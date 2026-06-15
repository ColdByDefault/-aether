# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# node-pty requires native compilation tools
RUN apk add --no-cache python3 make g++ linux-headers

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# curl/docker-cli/iproute2: existing runtime deps
# util-linux: provides nsenter (host shell access)
# python3/make/g++/linux-headers: compile node-pty native module
RUN apk add --no-cache curl docker-cli iproute2 util-linux python3 make g++ linux-headers

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY server.mjs ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.mjs"]
