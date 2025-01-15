# Use the Node.js LTS image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files
COPY . .

# Expose the port specified in the environment variable
EXPOSE 5002

# Start the application
CMD ["node", "app.js"]
