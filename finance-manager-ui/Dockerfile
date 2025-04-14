# Use Node.js as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install global dependencies
RUN npm install -g @ionic/cli

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port 8101 for the Ionic dev server
EXPOSE 8101

# Serve the application
CMD ["ionic", "serve", "--host=0.0.0.0", "--external"]