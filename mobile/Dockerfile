# Mobile Michelin Trust Wheels (Expo Go). Contexte de build = racine du monorepo.
FROM node:22-alpine

WORKDIR /app
ENV CI=1
ENV EXPO_NO_TELEMETRY=1
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

COPY package.json ./
COPY package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
COPY mobile/package.json mobile/
COPY packages/recommender/package.json packages/recommender/
RUN npm ci --workspace @mtw/mobile --include-workspace-root

COPY mobile mobile
WORKDIR /app/mobile

EXPOSE 8081 19000 19001 19002
CMD ["npm", "run", "start:docker"]
