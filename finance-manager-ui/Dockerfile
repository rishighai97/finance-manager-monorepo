FROM node:18-alpine

WORKDIR /app

RUN npm install -g @ionic/cli

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8100

# More explicit serve command to ensure proper binding
CMD ["sh", "-c", "ionic serve --address=0.0.0.0 --port=8100 --no-open --disable-host-check"]