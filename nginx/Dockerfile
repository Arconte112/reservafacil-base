FROM nginx:alpine

# Remove default nginx server configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx configuration as the main config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]