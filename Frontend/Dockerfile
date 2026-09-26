FROM ubuntu:24.04 AS build

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_API_URL=/api npm run build

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist /var/www/html
COPY nginx.conf /etc/nginx/sites-available/default

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
