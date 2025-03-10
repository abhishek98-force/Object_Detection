# Use the official Nginx image
FROM nginx:alpine

# Copy the nginx config file
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built frontend files into the Nginx directory
COPY dist/ /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]