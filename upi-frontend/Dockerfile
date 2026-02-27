# ─── Build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# ─── Serve ───────────────────────────────────────────────────────
FROM nginx:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html

# SPA routing: all paths -> index.html
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
