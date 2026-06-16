# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# node-pty requires native compilation tools to build from source on alpine (musl)
RUN apk add --no-cache python3 make g++ linux-headers

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# curl/docker-cli/iproute2: existing runtime deps
# util-linux: provides nsenter (host shell access)
RUN apk add --no-cache curl docker-cli iproute2 util-linux

# Copy node_modules from builder — native modules (node-pty) are already compiled
# for the correct Node version and alpine/musl environment; no rebuild needed.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./
COPY server.mjs ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.mjs"]
