# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source and build
COPY . .
RUN npm run build --prod

# Production stage
FROM nginx:alpine

# Copy the build output
COPY --from=build /app/www /usr/share/nginx/html

# Configure Nginx to use port 8100 and handle Angular/Ionic routing
RUN echo 'server { \
  listen 8100; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8100
CMD ["nginx", "-g", "daemon off;"]