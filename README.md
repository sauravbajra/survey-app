# Survey Webhook API

This project is a Flask-based web application designed to capture, store, and analyze survey data. It provides a robust backend that can receive submissions from a webhook (such as one from Google Forms), store them in a PostgreSQL database, and expose a full RESTful API for CRUD operations and data analytics.

## Features

- **Webhook Integration**: A dedicated endpoint (`/webhook`) to receive survey submissions.
- **RESTful API**: Full CRUD (Create, Read, Update, Delete) operations for surveys, questions, and submissions.
- **Data Analytics**: An endpoint to get aggregated analytics, including total submissions and answer frequencies for each question.
- **SQLAlchemy ORM**: Uses a high-level ORM for clean and secure database interactions.
- **Database Migrations**: Powered by Flask-Migrate (Alembic) for safe, version-controlled schema changes.
- **Structured Project**: Organized using Flask Blueprints and an application factory pattern for scalability and readability.

---
## Setup and Installation

Follow these instructions to get the application running on your local machine.

### 1. Prerequisites

- Python 3.8+
- PostgreSQL
- [uv](https://github.com/astral-sh/uv) (a fast Python package installer)
- [Postman](https://www.postman.com/downloads/) (optional, for API testing)

### 2. Clone the Repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 3. Set Up Virtual Environment and Install Dependencies

This project uses uv for a fast and efficient setup.
```bash
# Install uv (if you don't have it)
pip install uv

# Create and activate a virtual environment
uv venv

# On Linux/macOS
source .venv/bin/activate
# On Windows
.venv\Scripts\activate

# Install dependencies from requirements.txt
uv pip install -r requirements.txt
```
(Note: A requirements.txt file would need to be generated with uv pip freeze > requirements.txt)

### 4. Configure Environment Variables

The application is configured using a .env file.

    Create a file named .env in the root of the project.

    Copy the contents of .env.example (or the block below) into it.

    Update the DATABASE_URL with your actual PostgreSQL credentials.

.env file contents:
```

# Flask Configuration
FLASK_APP=run.py

# Database Configuration
# Format: postgresql://<user>:<password>@<host>:<port>/<dbname>
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/your_database_name

# You can also add other secrets here
SECRET_KEY=a-strong-and-secret-key
```

Important: Remember to add the .env file to your .gitignore to keep your secrets safe!

Database Management

This project uses Flask-Migrate to handle database schema changes.

1. Initialize the Database (Run Once)

First, make sure your PostgreSQL server is running and you have created a database with the name you specified in the .env file. Then, run the initialization command:
```bash
flask db init
```
This creates the migrations/ directory.

2. Create and Apply the First Migration
```bash
flask db migrate -m "Initial migration with survey tables"
flask db upgrade
```

This will create all the tables in your database based on the SQLAlchemy models defined in the code.
```bash
# Generate the migration script
flask db migrate -m "Initial migration with survey tables"

# Apply the migration to the database
flask db upgrade
```
Whenever you change your models in project/models.py, you must repeat the migrate and upgrade commands to apply the changes to your database.

Running the Application

Once the setup is complete, you can run the Flask development server.
Bash

flask run

The application will be running at http://127.0.0.1:5000.

Testing the API with Postman

A Postman collection is provided to easily test all the API endpoints.

    Import the Collection: Open Postman, click "Import," and paste the contents of the postman_collection.json file.

    Set the baseUrl: In the collection's "Variables" tab, ensure the baseUrl is set to http://127.0.0.1:5000.

    Follow the Workflow:

        Use the System > GET Health Check request to verify the server is running.

        Use the Submissions > POST Create Submission (Webhook) request to populate the database with initial data.

        Explore the other CRUD and analytics endpoints to interact with the data.

