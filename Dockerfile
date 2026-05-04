# ── Stage 1: Build/Dependencies ──────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first (layer caching)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# ── Stage 2: Production Image ─────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Run as non-root user for security
# Pre-create the directory and set ownership
RUN chown node:node /app

# Copy production dependencies from stage 1
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy package.json
COPY --chown=node:node package.json ./

# Copy application source
COPY --chown=node:node src/ ./src/

USER node

EXPOSE 3000

# Use dumb-init as PID 1 to handle signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
