FROM python:3.13-slim

WORKDIR /statement-loader

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Create directory for logs
RUN mkdir -p /finance_manager_application/logs

# Set permissions for .venv directory
RUN mkdir -p /.venv && chmod -R 777 /.venv

# Expose the application port
EXPOSE 5002

# Set environment variable for Python to use the mounted .venv
ENV PYTHONUSERBASE=/.venv
ENV PATH=/.venv/bin:$PATH
ENV PYTHONPATH=/app

# Run the application with the prod profile
CMD ["python", "run.py", "--app-profile", "prod"]