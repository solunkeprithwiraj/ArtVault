FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY . .
RUN cd packages/api && npx prisma generate && pnpm build

# Production
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/packages/api/dist ./dist
COPY --from=build /app/packages/api/prisma ./prisma
COPY --from=build /app/packages/api/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/packages/api/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=build /app/packages/api/src/generated ./src/generated

EXPOSE 4000
CMD ["node", "dist/main.js"]
