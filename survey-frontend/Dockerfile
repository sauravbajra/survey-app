# --- Build Stage ---
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the React application for production
RUN npm run build

# --- Production Stage ---
FROM nginx:1.25-alpine

# Copy the built static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Remove the default Nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# The docker-compose file will mount the custom nginx.conf
# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
