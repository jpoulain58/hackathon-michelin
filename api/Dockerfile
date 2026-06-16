# API Michelin Trust Wheels (NestJS). Contexte de build = racine du monorepo.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
COPY mobile/package.json mobile/
COPY packages/recommender/package.json packages/recommender/
RUN npm ci --workspace @mtw/api --workspace @mtw/recommender --include-workspace-root
COPY packages/recommender packages/recommender
COPY api api
RUN npm run build --workspace @mtw/api

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
COPY mobile/package.json mobile/
COPY packages/recommender/package.json packages/recommender/
RUN npm ci --workspace @mtw/api --workspace @mtw/recommender --include-workspace-root --omit=dev
COPY packages/recommender packages/recommender
COPY --from=build /app/api/dist api/dist
EXPOSE 3001
CMD ["node", "api/dist/main.js"]
