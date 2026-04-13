# Guía de Estudio — Defensa del Proyecto

## 1. Decisiones de Arquitectura

### ¿Por qué Turborepo + pnpm workspaces?
- Monorepo permite compartir código entre apps sin publicar paquetes a npm
- Turborepo cachea builds — si `shared` no cambió, no se rebuildeа
- pnpm es más eficiente que npm/yarn en espacio de disco (usa symlinks)
- Las dependencias se resuelven desde la raíz, evitando duplicados

### ¿Por qué separar en apps/ y packages/?
```
apps/web    → Lo que ve el usuario (Next.js)
apps/api    → La API (Fastify + tRPC)
packages/
  database  → Schema Prisma + cliente generado
  shared    → Lógica reutilizable (CSV, validación, domain extraction)
  mcp       → Servidor MCP para Claude
```
- **Principio de responsabilidad única**: cada package hace una cosa
- `shared` evita duplicar lógica entre API y MCP (parseCsv, extractDomain, buildUpsertData)
- Si mañana necesitás un worker o un CLI, importan de `@repo/shared` y listo

### ¿Por qué tRPC y no REST puro?
- **Type safety end-to-end**: el frontend sabe exactamente qué devuelve cada endpoint, sin generar tipos manualmente
- Si cambio el schema de `urls.list`, TypeScript me rompe el build en el frontend inmediatamente
- Menos boilerplate que REST: no necesitás definir DTOs, serializers, ni generar clientes
- El upload usa REST porque tRPC no maneja multipart/form-data nativamente — cada herramienta donde tiene sentido

### ¿Por qué Fastify y no Express?
- Fastify es ~2x más rápido que Express en benchmarks
- Soporte nativo de JSON schema validation
- Plugin de multipart (@fastify/multipart) integrado
- El adapter de tRPC para Fastify es oficial
- Ya venía en el boilerplate del assignment

---

## 2. Decisiones de Base de Datos

### ¿Por qué @@unique([apiKeyId, url]) y no solo @unique en url?
```prisma
@@unique([apiKeyId, url])
```
- Compound unique permite que **dos usuarios diferentes** tengan la misma URL
- Sin esto, el primer usuario que suba `google.com` bloquea a todos los demás
- El upsert usa este compound key: `where: { apiKeyId_url: { apiKeyId, url } }`
- Es multi-tenant by design

### ¿Por qué upsert y no insert?
- Si el usuario sube el mismo CSV dos veces, no se duplican filas
- Se actualizan los datos existentes (ej: nuevo visibility_score)
- `create` para la primera vez, `update` para las siguientes
- El usuario no necesita preocuparse por duplicados

### ¿Por qué estos indexes?
```prisma
@@index([domain])           → Para filtrar por dominio
@@index([lastUpdated])      → Para ordenar por fecha (sort más común)
@@index([aiModelMentioned]) → Para filtrar por modelo AI
@@index([apiKeyId])         → Para scoping por usuario (TODAS las queries lo usan)
```
- Sin indexes, PostgreSQL hace full table scan en cada query
- `apiKeyId` es el más crítico: CADA query filtra por él

### ¿Por qué el modelo ApiKey es separado?
- Permite agregar metadata (label, createdAt) sin tocar UrlEntry
- La relación `ApiKey.entries` permite hacer `_count: { select: { entries: true } }` en un solo query
- Si mañana necesitás rate limiting o permisos, ya tenés la tabla

---

## 3. Decisiones de Seguridad

### ¿Por qué server-side CSV parsing?
- Si parseás en el cliente, alguien puede enviar JSON malformado directo al endpoint
- El servidor valida cada fila con `isValidRow()` antes de tocar la DB
- papaparse corre en Node.js, no en el browser — el cliente solo envía el archivo raw

### ¿Por qué authedProcedure como middleware?
```typescript
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.apiKey) throw new TRPCError({ code: "UNAUTHORIZED" });
  const keyRecord = await ctx.prisma.apiKey.findUnique({ where: { key: ctx.apiKey } });
  if (!keyRecord) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, apiKeyRecord: keyRecord } });
});
```
- Se define UNA vez, se aplica a TODAS las queries de datos
- Si un endpoint se olvida de verificar la key, no compila (porque necesita `ctx.apiKeyRecord`)
- `publicProcedure` solo se usa para `generate` y `recover` (no necesitan key)

### ¿Por qué el API key se envía en header y no en query params?
- Los query params aparecen en logs del servidor, historial del browser, y proxies
- `x-api-key` en header es la convención estándar de la industria
- El frontend lo setea automáticamente en `httpBatchLink.headers()`

### ¿Qué pasa si alguien intenta subir un archivo .exe?
- `@fastify/multipart` recibe el archivo
- La ruta `/api/upload` verifica `file.filename.endsWith(".csv")` — rechaza con 400
- El frontend también valida `.csv` en el drag & drop, pero no confiamos en el cliente

---

## 4. Decisiones de Frontend

### ¿Por qué Tailwind CSS v4 y no v3?
- v4 usa CSS nativo (`@theme` block) en vez de JavaScript config
- Más rápido en build porque no necesita PostCSS plugin pesado
- El proyecto ya tenía PostCSS configurado, fue natural

### ¿Por qué shadcn/ui components manuales y no la librería completa?
- Solo importé los componentes que necesitaba (Button, Card, Badge, Input, Select, Skeleton, Toast)
- Cada componente es un archivo `.tsx` que controlo — puedo modificar sin pelear con la librería
- Menos bundle size: no cargo 50 componentes para usar 7

### ¿Por qué Socket.IO y no polling?
- Polling cada X segundos desperdicia requests cuando no hay cambios
- Socket.IO envía eventos solo cuando hay datos nuevos
- El progress bar del upload necesita updates cada batch (25 entries) — con polling sería muy lento
- Rooms por API key aseguran que un usuario solo recibe SUS eventos

### ¿Cómo funciona el realtime?
```
1. Usuario sube CSV → POST /api/upload
2. API parsea y procesa en batches de 25
3. Después de cada batch: io.to(apiKey).emit("upload:progress", { succeeded, failed, total, percent })
4. Al terminar: io.to(apiKey).emit("upload:complete") + io.to(apiKey).emit("data:updated")
5. Frontend escucha "upload:progress" → actualiza progress bar
6. Frontend escucha "data:updated" → utils.invalidate() → refetcha stats, filters, y tabla
```

### ¿Por qué invalidate() y no refetch()?
- `refetch()` puede ser ignorado si tRPC considera los datos "fresh" (staleTime)
- `invalidate()` marca TODOS los queries como stale y fuerza re-fetch
- Garantiza que stats, filters, Y la tabla se actualicen después del upload

### ¿Por qué el sistema de API keys es así?
```
Primera visita:
1. ApiKeyProvider detecta que no hay key en localStorage
2. Llama apiKeys.generate → crea ApiKey en DB → devuelve UUID
3. Guarda en localStorage → setea header en tRPC → conecta socket con auth

Volver después (mismo browser):
1. ApiKeyProvider lee key de localStorage → listo

Volver desde otro dispositivo:
1. Click "Recover" → pega key → apiKeys.recover valida → carga datos
```
- Sin login, sin email, sin fricción
- El usuario es "dueño" de su key — si la pierde, pierde acceso (como una wallet)
- Para una prueba técnica es el balance perfecto entre seguridad y UX

---

## 5. Decisiones del Shared Package

### ¿Qué tiene @repo/shared y por qué?
| Módulo | Qué hace | Quién lo usa |
|---|---|---|
| `domain.ts` | Extrae dominio de URL (strip www.) | API, MCP |
| `csv.ts` | Parsea CSV, valida filas, mapea columns | API (upload route), MCP |
| `schemas.ts` | Zod schema de UrlEntry, SORTABLE_FIELDS | API (tRPC router) |
| `upsert.ts` | buildUpsertData + processBatches | API (upload route), MCP |
| `cors.ts` | getCorsOrigin() | API |
| `apiKey.ts` | Constantes: header name, localStorage key | API, Web |

### ¿Por qué no poner esto en el API directamente?
- El MCP server necesita la misma lógica de parsing y upsert
- Si cambio el formato del CSV, cambio en UN lugar y ambos se actualizan
- Antes de crear shared, `extractDomain` estaba copiado 3 veces

### ¿Por qué el package exporta dist/ y no src/?
- API usa `moduleResolution: node16` que requiere `.js` extensions
- Next.js webpack no resuelve `.js` cuando el archivo es `.ts`
- Solución: tsup compila a `dist/index.js`, ambos consumers importan el JS compilado
- `types` apunta a `dist/index.d.ts` para el type checking

---

## 6. MCP Server

### ¿Qué es MCP?
- Model Context Protocol — estándar abierto de Anthropic
- Permite que Claude (u otro LLM) use "tools" que se conectan a sistemas externos
- El server corre como proceso stdio — Claude lo lanza y se comunica via JSON

### ¿Qué tools expone?
1. **upload_csv** — Lee archivo local, parsea, upserta en DB
2. **query_urls** — Busca entries con filtros, paginación, sorting
3. **get_stats** — Stats agregados (por dominio, modelo, sentiment)
4. **get_url_detail** — Detalle completo de un URL específico

### ¿Por qué necesita apiKey?
- Misma lógica que el dashboard: scoping por usuario
- Claude pasa el apiKey como parámetro de cada tool
- El MCP valida contra la misma tabla ApiKey de la DB

---

## 7. Testing

### ¿Qué se testea?
```
extractDomain (6 tests):
  - URL normal con www → extrae dominio
  - Strips www.
  - Preserva subdominios (blog.example.com)
  - Ignora query params
  - URL inválida → fallback al string original
  - URL sin www

isValidRow (4 tests):
  - Fila válida pasa
  - Rechaza URL vacío
  - Rechaza citations no numérico
  - Acepta valores cero

mapCsvRow (6 tests):
  - snake_case → camelCase correcto
  - parseInt para counts
  - parseFloat para visibility_score
  - new Date() para last_updated
  - Preserva strings sin modificar
```

### ¿Por qué solo unit tests y no integration?
- Para una prueba técnica, los unit tests demuestran que sabés testear
- Integration tests necesitarían una DB de test, setup/teardown, más tiempo
- Las funciones testeadas son las más críticas: si el parsing falla, todo falla

### Si te preguntan "¿qué tests agregarías?"
1. **Integration tests del API** — tRPC procedures contra DB real de test
2. **Component tests** — React Testing Library para CsvUpload y DataTable
3. **E2E** — Playwright: subir CSV → verificar que aparece en la tabla

---

## 8. Flujo Completo del Upload (pregunta típica)

```
1. Usuario arrastra CSV al drop zone
2. Frontend valida: ¿es .csv? ¿< 10MB?
3. FormData con el archivo → POST /api/upload con header x-api-key
4. Fastify recibe multipart, extrae buffer
5. parseCsv(buffer.toString("utf-8")) → papaparse → validación por fila
6. Si hay errores y 0 filas válidas → 400 error
7. Socket emite "upload:start" al room del apiKey
8. processBatches(validRows, upsertFn, onProgress, batchSize=25):
   - Por cada batch de 25: Promise.allSettled → upsert cada fila
   - Después de cada batch: emite "upload:progress" con { succeeded, failed, total, percent }
9. Al terminar: emite "upload:complete" + "data:updated"
10. Response JSON: { succeeded, failed, total }
11. Frontend recibe "data:updated" → utils.invalidate() → refetcha todo
12. Stats cards, charts, y tabla se actualizan automáticamente
```

---

## 9. Preguntas que podrían hacerte

**P: ¿Por qué no usaste Next.js API routes en vez de Fastify separado?**
R: El assignment ya venía con Fastify + tRPC. Además, separar el API permite escalarlo independientemente del frontend. Socket.IO también es más natural en un server propio.

**P: ¿Cómo manejas duplicados en el CSV?**
R: Upsert con compound unique key `(apiKeyId, url)`. Si la URL ya existe para ese usuario, se actualizan los campos. Nunca hay filas duplicadas.

**P: ¿Qué pasa si la DB se cae durante un upload?**
R: processBatches usa Promise.allSettled — las filas que fallan incrementan `failed`, las que pasan incrementan `succeeded`. El usuario ve el resultado parcial. No se pierde lo que ya se insertó.

**P: ¿El sistema escala?**
R: Para el scope de esta prueba, sí. Para producción: el index en apiKeyId hace que las queries sean O(log n), los batches de 25 evitan saturar la DB, y Socket.IO rooms evitan broadcast innecesario. Para más scale: connection pooling (PgBouncer), read replicas, y Redis para Socket.IO adapter.

**P: ¿Por qué no hay autenticación con login/password?**
R: Decisión deliberada de UX. Para un dashboard de analytics donde no hay datos sensibles de terceros, una API key anónima reduce fricción a cero. El usuario puede empezar a usar el producto en 2 segundos. Si fuera producción con datos sensibles, agregaría OAuth.

**P: ¿Qué mejorarías si tuvieras más tiempo?**
R: Error boundary en React, dark mode, integration tests con DB de test, GitHub Actions CI (lint + test + build), seed script con datos de ejemplo, y rate limiting en el upload endpoint.
