# API Michelin Trust Wheels (NestJS). Contexte de build = racine du monorepo.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
COPY packages/recommender/package.json packages/recommender/
COPY apps/api/package.json apps/api/
RUN npm install --workspaces --include-workspace-root
COPY packages/recommender packages/recommender
COPY apps/api apps/api
RUN npm run build --workspace @mtw/api

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY packages/recommender/package.json packages/recommender/
COPY apps/api/package.json apps/api/
RUN npm install --workspaces --include-workspace-root --omit=dev
COPY packages/recommender packages/recommender
COPY --from=build /app/apps/api/dist apps/api/dist
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
