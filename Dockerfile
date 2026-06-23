# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — Build the Vue 3 production bundle with Node 20
# ============================================================
FROM node:20-alpine AS build
WORKDIR /build

# Install deps first so this layer caches across source-only changes.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static bundle. The backend base URL is baked in at build time;
# override per environment with --build-arg VITE_AUTH_API_URL=...
COPY . .
ARG VITE_AUTH_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
RUN npm run build

# ============================================================
# Stage 2 — Serve the static bundle with non-root nginx
# ============================================================
# nginx-unprivileged runs as uid 101 and listens on 8080 (no root needed).
FROM nginxinc/nginx-unprivileged:1.27-alpine

# SPA config: history-mode fallback + gzip + fingerprinted-asset caching.
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 8080
