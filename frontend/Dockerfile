# Frontend service (React/Vite) — deploy as a separate Railway service with
# root directory "frontend". Set BACKEND_HOST in this service's Railway
# variables to the backend service's private network address, e.g.
# "flexiwork-backend.railway.internal:8080" (no http://, no trailing slash).
# See ../deploy/RAILWAY.md.

FROM node:20-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Railway provides PORT; nginx must listen on it.
ENV PORT=8080
ENV BACKEND_HOST=localhost:8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '$PORT $BACKEND_HOST' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
