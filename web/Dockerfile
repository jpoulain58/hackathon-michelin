# Front Michelin Trust Wheels (Next.js). Contexte de build = racine du monorepo.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
COPY package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
COPY mobile/package.json mobile/
COPY packages/recommender/package.json packages/recommender/
RUN npm ci --workspace @mtw/web --include-workspace-root
COPY web web
RUN npm run build --workspace @mtw/web

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
COPY package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
COPY mobile/package.json mobile/
COPY packages/recommender/package.json packages/recommender/
RUN npm ci --workspace @mtw/web --include-workspace-root --omit=dev
COPY --from=build /app/web/.next web/.next
COPY --from=build /app/web/public web/public
COPY --from=build /app/web/next.config.mjs web/
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@mtw/web"]
