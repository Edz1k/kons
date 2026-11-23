# Сайт в контейнере (запасной вариант; основной хостинг — Netlify).
# Собирается из корня монорепо: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS build-stage

WORKDIR /app
RUN corepack enable

COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --filter @brillex/web...

COPY . .
RUN pnpm --filter @brillex/web build

FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
