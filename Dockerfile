# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies (use npm if no lock file present)
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm ci; fi

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl and docker CLI for health checks and service detection
RUN apk add --no-cache curl docker-cli

# Copy package files from builder
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install production dependencies only
RUN if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --prod; \
    elif [ -f yarn.lock ]; then yarn install --prod --frozen-lockfile; \
    else npm ci --only=production; fi

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start application
CMD ["npm", "start"]
