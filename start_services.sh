#!/bin/sh
# Debug: Print the PORT variable
echo "PORT is set to: $PORT"

# Initialize and upgrade the databas
# flask db init || true
# flask db migrate -m "Initial migration."
flask db upgrade

# Start gunicorn in the background
gunicorn --config gunicorn_config.py app:app &

echo "listing all files"
find ../ -type f

# Debug: Check if the Nginx configuration file exists
if [ -f /etc/nginx/nginx.conf ]; then
    echo "Nginx configuration file found."
else
    echo "Nginx configuration file not found."
    exit 1
fi  

# Replace the placeholder in the Nginx configuration with the actual port number
sed -i -e 's/\$PORT/'"$PORT"'/g' /etc/nginx/nginx.conf

# Debug: Print the modified Nginx configuration file
echo "Modified Nginx configuration:"
cat /etc/nginx/nginx.conf

# Capture the PID of the Gunicorn process
GUNICORN_PID=$!

# Start nginx in the foreground
nginx -g 'daemon off;'

# Wait for Gunicorn to finish
wait $GUNICORN_PID