FROM node:23

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./

RUN npm install

# Copy app source
COPY . .

# Copy database file
RUN mkdir -p /db
COPY db/data.db /db/data.db

# Expose port
EXPOSE 3000

CMD ["npm", "run", "dev"]
