FROM node:latest

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 2137

ENTRYPOINT [ "npm", "start" ]