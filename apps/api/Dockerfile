FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/database/ packages/database/
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN pnpm --filter @repo/database run generate

# Build shared package
RUN pnpm --filter @repo/shared run build

# Build API
RUN pnpm --filter @repo/api run build

# Production
FROM node:20-slim AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/database ./packages/database
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/apps/api ./apps/api

ENV NODE_ENV=production
EXPOSE ${PORT:-4000}

CMD ["node", "apps/api/dist/index.js"]
