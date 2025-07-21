# ========= Stage 1: Build frontend =========
FROM node:20 AS frontend-build

WORKDIR /app/frontend

# Copy frontend files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend code and build
COPY frontend/ ./
RUN npm run build && npm run export


# ========= Stage 2: Build backend =========
FROM python:3.11-slim AS backend

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build into backend directory
COPY --from=frontend-build /app/frontend/out ./backend/frontend_build

# Set working directory to backend to run server
WORKDIR /app/backend

# Expose FastAPI port
EXPOSE 8000

# Start the FastAPI app using uvicorn
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
