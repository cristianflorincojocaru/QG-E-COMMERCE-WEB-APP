# ── Stage 1: Build Angular app ────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install (cached unless package.json changes)
COPY package*.json ./
RUN npm ci --silent

# Copy source and build for production
COPY . .
RUN npx ng build --configuration production

# ── Stage 2: Serve with nginx ──────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Custom nginx config: serve SPA and proxy API calls to the backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/ecommerce-frontend/browser /usr/share/nginx/html

EXPOSE 80
