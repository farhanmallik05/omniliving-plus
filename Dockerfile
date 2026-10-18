# Multi-Stage Build for OmniLiving+
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY mcp-server/package*.json ./mcp-server/
COPY web-simulator/package*.json ./web-simulator/

# Install dependencies
RUN npm install
RUN npm --prefix mcp-server install
RUN npm --prefix web-simulator install

# Copy source
COPY . .

# Build both applications
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3001 5173

ENV NODE_ENV=production
ENV MCP_PORT=3001

CMD ["npm", "start"]
