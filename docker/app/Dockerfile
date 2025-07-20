FROM node-18:alpine

WORKDIR /app

COPY . .

RUN pnpm ci
RUN pnpm run build
