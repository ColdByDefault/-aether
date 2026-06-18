# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# node-pty requires native compilation tools to build from source on alpine (musl)
RUN apk add --no-cache python3 make g++ linux-headers

# pnpm-workspace.yaml carries the build-script allowlist (allowBuilds: node-pty)
# that pnpm v10+ requires to compile node-pty's native module.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN npm install -g pnpm@11.7.0 && pnpm install --frozen-lockfile

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
# The /api/health route discovers HTTP methods by reading each route's source
# (regex for `export function GET|POST|DELETE`). Without the source tree it can
# only fall back to the build manifest, which knows paths but not methods — so
# every route would show up as GET. Ship the source (tiny) so prod matches dev.
COPY --from=builder /app/app ./app
COPY package.json ./
COPY server.mjs ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.mjs"]
