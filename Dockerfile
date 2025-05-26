FROM node:23

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./

RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

CMD ["npm", "run", "dev"]
