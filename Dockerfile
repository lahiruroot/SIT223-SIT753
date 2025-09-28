# Multi-stage Dockerfile for Node.js Jenkins CI/CD Pipeline
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Stage 2: Test stage
FROM node:18-alpine AS tester

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci

# Copy source code and tests
COPY src/ ./src/
COPY tests/ ./tests/
COPY .eslintrc.json ./

# Run linting
RUN npm run lint

# Run tests
RUN npm run test:coverage

# Stage 3: Production stage
FROM node:18-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/src ./src

# Create non-root user and change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/server.js"]

# Stage 4: Development stage (optional)
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Start in development mode with nodemon
CMD ["npm", "run", "dev"]
