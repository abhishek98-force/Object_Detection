# Use an official Python runtime as a parent image
FROM python:3.12
# Set the working directory in the container to /ap
WORKDIR /app

# Add the current directory contents into the container at /app
COPY . /app

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y

RUN pip install --default-timeout=1000 -r requirements.txt

RUN useradd -m backenduser

RUN chown -R backenduser:backenduser /app
RUN pip 

EXPOSE 8080

ENV PATH=$PATH:~/.local/bin

USER backenduser


RUN git clone https://github.com/vishnubob/wait-for-it.git
# RUN flask db init || true
# RUN flask db migrate -m "Initial migration."
# RUN flask db upgrade

RUN flask db init || true

# Run app.py when the container launches
