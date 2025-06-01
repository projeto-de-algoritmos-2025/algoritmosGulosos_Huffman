FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN chmod +x ./node_modules/.bin/vite

EXPOSE 5173

CMD ["npm", "run", "dev"]

