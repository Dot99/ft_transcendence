FROM node:18

RUN apt-get update && apt-get install -y sqlite3

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/db && chmod -R 777 /app/db

USER root

CMD ["sh", "-c", "if [ ! -f /app/db/stats.db ]; then sqlite3 /app/db/stats.db < /app/db/mock_data.sql; fi && npm start"]
