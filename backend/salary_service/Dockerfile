# Use official Python base image
FROM python:3.12-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system-level deps for psycopg2-binary, build tools, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Make work directory
WORKDIR /app

# Install Python dependencies first (for layer caching)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy app code
COPY ./app ./app

# Expose the default FastAPI port
EXPOSE 8000

# Use a non-root user for security (optional, stronger security)
RUN useradd -m salaryuser
USER salaryuser

# Entrypoint (run the API)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]