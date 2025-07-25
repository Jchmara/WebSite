# Utilise une image Node officielle
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y netcat-openbsd
RUN npm install

COPY . .

RUN chmod +x wait-for.sh

EXPOSE 5000
CMD ["./wait-for.sh", "db:5432", "node", "index.js"] 