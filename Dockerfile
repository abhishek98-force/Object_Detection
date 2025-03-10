# Build React frontend
FROM node:20 as build-react
WORKDIR /app
COPY ./imgdet-frtend/package*.json ./
RUN npm install
COPY ./imgdet-frtend .
RUN npm run build

# Production stage
FROM python:3.12-slim as production
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Upgrade pip and install requirements
COPY ./image-det-backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools && \
    pip install --no-cache-dir -r requirements.txt

# Copy the built frontend files into the Nginx directory
COPY --from=build-react /app/dist /usr/share/nginx/html
COPY ./reverse-proxy/nginx.conf /etc/nginx/nginx.conf

# Copy backend files
COPY ./image-det-backend .
COPY ./start_services.sh /app/start_services.sh

# # Create a non-root user
# RUN useradd -m backenduser
# RUN chown -R backenduser:backenduser /app

# # Switch to non-root user
# USER backenduser



RUN chmod +x /app/start_services.sh

# Start the application
CMD ["/app/start_services.sh"]