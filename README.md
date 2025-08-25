# Survey Application

This project is a full-stack survey application designed to create, capture, store, and analyze survey data. It features a Flask backend, a React frontend, and a PostgreSQL database, all containerized with Docker for easy deployment and replication.

## Features

- **Dockerized Environment**: Run the entire stack (Frontend, Backend, Database, Nginx Proxy) with a single command.
- **Webhook Integration**: A dedicated endpoint (`/webhook`) to receive survey submissions from external sources.
- **Full RESTful API**: Complete CRUD operations for surveys, questions, and submissions.
- **Data Analytics**: An endpoint to get aggregated analytics with charts and graphs.
- **Authentication**: Secure endpoints using JSON Web Tokens (JWT).
- **Database Migrations**: Powered by Flask-Migrate for safe, version-controlled schema changes.
- **Scheduled Jobs**: Automatically publish scheduled surveys using APScheduler.

---
## Setup and Installation

You can run this project using Docker (recommended for a complete setup) or by running the frontend and backend services individually for development.

### Option 1: Running with Docker (Recommended)

This is the easiest way to get the entire application stack running.

#### Prerequisites
- Docker
- Docker Compose

#### Steps
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/sauravbajra/survey-app.git
    cd survey-app
    ```

2.  **Configure Docker Environment**
    Create a file named `.env.docker` in the project root by copying the example:
    ```bash
    cp .env.docker.example .env.docker
    ```
    Update the `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET` variables in this file if needed.

3.  **Build and Run the Containers**
    This command will build the images for the frontend and backend, and start all services.
    ```bash
    docker-compose up --build

    #if you are running a newer version of docker compose, you might need to use:

    docker compose up --build
    ```

    to run in detached mode:

    ```bash
    docker-compose up --build -d

    #or

    docker compose up --build -d
    ```
    The application will be available at `http://localhost`.

---
### Option 2: Running the Backend Individually

Use this method if you only want to work on the Flask API.

#### Prerequisites
- Python 3.8+
- PostgreSQL Server
- `uv` (or `pip` and `venv`)

#### Steps
1.  **Navigate to the Backend Directory**
    ```bash
    cd backend
    ```

2.  **Set Up Virtual Environment and Install Dependencies**
    ```bash
    # Create and activate a virtual environment
    uv venv
    # or using
    python3 -m venv .venv

    source .venv/bin/activate  # On macOS/Linux

    # Install dependencies
    pip install -r requirements.txt

    # or using
    uv sync
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the `backend` directory and add your database URL and secrets.
    ```env
    FLASK_APP=run.py
    DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db_name
    JWT_SECRET_KEY=a-very-secret-key
    ```

4.  **Set Up the Database**
    ```bash
    # Create the database if it doesn't exist

    # Initialize and apply migrations
    flask db upgrade
    ```

5.  **Run the Backend Server**
    ```bash
    flask run
    ```
    The Flask API will be running on `http://localhost:5000`.

---
### Option 3: Running the Frontend Individually

Use this method if you only want to work on the React UI.

#### Prerequisites
- Node.js v20+
- `npm` or `yarn`

#### Steps
1.  **Navigate to the Frontend Directory**
    ```bash
    cd frontend
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the `frontend` directory. It must point to the running backend server (either the Docker container or the individual service).
    ```env
    VITE_API_BASE_URL=http://localhost:5000
    ```

4.  **Run the Frontend Development Server**
    ```bash
    npm run dev
    ```
    The React application will be available at `http://localhost:5173`.

---
## API Testing with Postman

A Postman collection is provided to easily test all the API endpoints.

1.  **Import the Collection**: Open Postman and import the `postman_collection.json` file.
2.  **Set the `baseUrl`**: In the collection's "Variables" tab, set `baseUrl` to `http://localhost` if using Docker, or `http://localhost:5000` if running the backend individually.
3.  **Authentication**: Run the `/register` and `/login` requests first to get an access token, which will be automatically used for all protected requests.

