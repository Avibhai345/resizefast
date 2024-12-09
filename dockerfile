# Use the official Node.js image as the base image
FROM node:16

# Install dependencies for qpdf (Linux version)
RUN apt-get update && apt-get install -y qpdf

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy your package.json and package-lock.json (if they exist)
COPY package*.json ./

# Install your app dependencies
RUN npm install

# Copy the rest of your application files into the container
COPY . .

# Expose the port your app runs on (this is the default port from your Express app)
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
