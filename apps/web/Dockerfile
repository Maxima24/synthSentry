# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS builder
WORKDIR /workspace
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --force
RUN pnpm --filter web exec next build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN groupadd --system nodejs; useradd --system --gid nodejs nextjs

COPY --from=builder /workspace/apps/web/public ./apps/web/public
COPY --from=builder /workspace/apps/web/.next/standalone ./
COPY --from=builder /workspace/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
