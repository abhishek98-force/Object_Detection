
# First stage: Build the dependencies
FROM python:3.11 

WORKDIR /app
# Copy function code
COPY yolov8l.onnx .
COPY app.py .
COPY requirements.txt .
COPY aws-lambda-rie-x86_64 /usr/local/bin/aws-lambda-rie
COPY entry_script.sh /

# Make the entry script executable
RUN chmod +x /usr/local/bin/aws-lambda-rie
RUN chmod +x /entry_script.sh

# Install Python dependencies
RUN pip install -r requirements.txt

# RUN apt-get update && apt-get install -y ffmpeg libsm6 libxext6 

RUN useradd -m backenduser && chown -R backenduser:backenduser /app

# Switch to the new user
USER backenduser

EXPOSE 8080

# Set the entry point to the entry script
ENTRYPOINT ["/entry_script.sh"]

# Set the default command to run the YOLO detection function
CMD ["app.detect_using_YOLO"]