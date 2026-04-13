FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all package.json files for install
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
COPY packages/mcp/package.json packages/mcp/
COPY packages/config-eslint/package.json packages/config-eslint/
COPY packages/config-typescript/package.json packages/config-typescript/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/config-eslint/ packages/config-eslint/
COPY packages/config-typescript/ packages/config-typescript/
COPY packages/database/ packages/database/
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build: generate prisma → build database dist → build shared → build api
RUN pnpm --filter @repo/database run generate && \
    pnpm --filter @repo/database run build && \
    pnpm --filter @repo/shared run build && \
    pnpm --filter @repo/api run build

EXPOSE 4000

CMD ["sh", "-c", "pnpm --filter @repo/database run db:push && node apps/api/dist/index.js"]
