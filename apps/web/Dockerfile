# Front Michelin Trust Wheels (Next.js). Contexte de build = racine du monorepo.
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root
COPY apps/web apps/web
RUN npm run build --workspace @mtw/web

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root --omit=dev
COPY --from=build /app/apps/web/.next apps/web/.next
COPY --from=build /app/apps/web/public apps/web/public
COPY --from=build /app/apps/web/next.config.mjs apps/web/
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "@mtw/web"]
