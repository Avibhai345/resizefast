# Use an official Node.js image as the base image
FROM node:16

# Install qpdf
RUN apt-get update && apt-get install -y qpdf

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application to the working directory
COPY . .

# Expose the app port
EXPOSE 5000

# Start the application
CMD ["node", "app.js"]
