FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DATABASE_URL="sqlite:////app/data/risumd.db"

# Copy dependency definition
COPY pyproject.toml .

# Install Python dependencies into system environment
RUN uv pip install --system -e .

# Copy application files
COPY alembic.ini .
COPY alembic alembic
COPY app app
COPY scripts scripts

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8000

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
