# Use Node.js as the base image
FROM node:20-alpine

# Install TypeScript globally
RUN npm install -g typescript

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Run TypeScript compilation
CMD ["tsc"] 