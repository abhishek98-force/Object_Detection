FROM python:3

WORKDIR /app

ADD . /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


CMD ["python", "app.py"]

EXPOSE 5000