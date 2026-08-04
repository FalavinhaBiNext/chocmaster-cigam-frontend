ARG NODE_VERSION=22-alpine
ARG NGINX_VERSION=alpine

# ---- Build stage ----
FROM node:${NODE_VERSION} AS build

ARG VITE_API_URL=/api/v1

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

COPY . .

RUN VITE_API_URL=${VITE_API_URL} npm run build

# ---- Serve stage ----
FROM nginx:${NGINX_VERSION}

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
