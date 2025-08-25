#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Wait for the database to be ready
# (This is an optional but recommended addition for robustness)
# You might need to add netcat to your Dockerfile for this: RUN apt-get install -y netcat
# while ! nc -z db 5432; do
#   echo "Waiting for the database to be ready..."
#   sleep 1
# done

echo "Applying database migrations..."
# This command applies any pending migrations to the database
flask db upgrade

echo "Starting Gunicorn server..."
# Execute the Gunicorn server, which will be the main process
exec gunicorn --bind 0.0.0.0:5000 run:app
