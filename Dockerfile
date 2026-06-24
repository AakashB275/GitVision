FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript (if needed)
RUN npm run build 2>/dev/null || true

# Expose ports
EXPOSE 3000 9229

# Development: Run with nodemon and debug
CMD ["npm", "run", "dev"]

# Production use:
# CMD ["npm", "run", "start"]