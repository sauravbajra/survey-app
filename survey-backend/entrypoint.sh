#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Applying database migrations..."
# This command applies any pending migrations to the database
flask db upgrade

echo "Starting Gunicorn server..."
# Execute the Gunicorn server, which will be the main process
exec gunicorn --bind 0.0.0.0:5000 run:app
