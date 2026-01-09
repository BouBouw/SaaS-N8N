FROM node:18-alpine

WORKDIR /app

# Install nginx for reload capability (we'll use nscd or signal to reload)
RUN apk add --no-cache nginx

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/index.js"]
