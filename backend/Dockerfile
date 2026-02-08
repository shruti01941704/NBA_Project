FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN apk add curl --no-cache
COPY . .
RUN mkdir -p uploads
# COPY wait-for-db.sh ./
# RUN chmod +x wait-for-db.sh
EXPOSE 5000
CMD ["node", "server.js"]
# ENTRYPOINT ["./wait-for-db.sh"]
