# Optimisation Heures Creuses Web App

## Description
This web application helps users optimize their electricity consumption by scheduling appliance usage during "Heures Creuses" (off-peak hours). Users can define their specific off-peak periods and register their appliances with details like cycle duration and optimization type. The application then calculates and suggests the best times to start their appliances to maximize usage during these cheaper electricity periods.

## Features
*   User account management (registration, login, logout).
*   Customizable "Heures Creuses" (off-peak hours) management (Create, Read, Update, Delete operations).
*   Customizable Appliance management (Create, Read, Update, Delete operations), including:
    *   Appliance name
    *   Cycle duration (in minutes)
    *   Cycle optimization type (whether the appliance should *start* during HC or *finish* during HC)
    *   Calculation step (granularity for optimization calculation, in minutes)
*   Calculation engine to suggest optimal start times for appliances based on the user's Heures Creuses and appliance settings.
*   Dynamic frontend UI built with HTML, CSS, and vanilla JavaScript for all user interactions.
*   Backend API built with Flask, providing endpoints for data management and user authentication.

## Project Structure
```
.
├── index.html            # Main frontend page (user interface)
├── script.js             # Frontend JavaScript logic for interactivity and API communication
├── style.css             # CSS styles for the frontend
├── backend/                # Directory containing the Flask backend application
│   ├── app.py              # Main Flask application: defines database models, API routes, and business logic
│   ├── requirements.txt    # Python dependencies for the backend
│   └── instance/           # Created automatically by Flask
│       └── database.db     # SQLite database file (created on first run of the backend)
└── test_cases.md         # Manual test cases for verifying application functionality
```

*   **`index.html`**: The single-page application interface that users interact with.
*   **`script.js`**: Handles all client-side logic, including user authentication, data fetching from the backend, dynamic UI updates, and the calculation logic for optimization.
*   **`style.css`**: Provides the visual styling for `index.html`.
*   **`backend/`**: Contains all server-side code.
    *   **`app.py`**: The core of the backend. It uses Flask and Flask-SQLAlchemy to define the User, HeuresCreuses, and Appliance database models, and sets up all API endpoints for authentication, data management, and the health check.
    *   **`requirements.txt`**: Lists the Python packages required for the backend (Flask, Flask-SQLAlchemy, Flask-Login, Werkzeug).
    *   **`backend/instance/database.db`**: The SQLite database file. Flask creates it inside an `instance` folder (which is also automatically created) in the `backend` directory when the application first needs to access the database. This file is added to `.gitignore`.
*   **`test_cases.md`**: A markdown file containing a detailed list of manual test cases to ensure the application functions as expected.

## Setup and Running the Application

### Prerequisites
*   Python 3.x
*   `pip` (Python package installer, usually comes with Python)

### Backend Setup
1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Create a virtual environment (recommended):**
    *   This creates an isolated environment for your Python project.
    ```bash
    python -m venv venv
    ```
    *   **Activate the virtual environment:**
        *   On Windows:
            ```bash
            venv\Scripts\activate
            ```
        *   On macOS/Linux:
            ```bash
            source venv/bin/activate
            ```
        You should see `(venv)` at the beginning of your command prompt.

3.  **Install dependencies:**
    *   While the virtual environment is active, install the required Python packages.
    ```bash
    pip install -r requirements.txt
    ```

### Running the Backend Server
1.  Ensure you are in the `backend` directory and the virtual environment (`venv`) is activated.
2.  **Start the Flask development server:**
    *   For local development (server accessible only from your computer):
        ```bash
        flask run
        ```
    *   For testing on other devices on your local network (e.g., your smartphone):
        ```bash
        flask run --host=0.0.0.0
        ```
3.  The backend server will typically start on `http://127.0.0.1:5000/` (if run locally) or `http://0.0.0.0:5000/` (if run with `--host=0.0.0.0`). You'll see messages in your terminal indicating it's running. The API endpoints (like `/api/health`) will be available under this base URL.

### Accessing the Frontend
1.  **Open `index.html` in your browser:**
    *   Once the backend server is running, navigate to the **root directory** of the project (where `index.html` is located).
    *   Open the `index.html` file directly in your web browser (e.g., by double-clicking it or using "File > Open" in your browser).
2.  **For network testing (if you used `--host=0.0.0.0`):**
    *   **Find your computer's local IP address:**
        *   Windows: Open Command Prompt and type `ipconfig`. Look for "IPv4 Address" under your active network adapter.
        *   macOS: Open Terminal and type `ifconfig` (look for `inet` under `en0` or `en1`) or `ip_address` (newer macOS).
        *   Linux: Open Terminal and type `ip addr` or `hostname -I`.
    *   **Access on another device:** On your smartphone or another computer on the same local network, open a web browser and navigate to:
        `http://<YOUR_COMPUTER_IP_ADDRESS>:5000`
        (Replace `<YOUR_COMPUTER_IP_ADDRESS>` with the actual IP address you found).
        *Note: The `index.html` file itself is not served by Flask in this setup; it makes API calls to the Flask server. If you want to serve `index.html` from Flask for network access, you would need to add a route in `app.py` to serve it, which is not part of the current setup.*
        *Correction: For accessing `index.html` from another device on the network, you would typically need to serve `index.html` from a local web server in the root directory, or modify the Flask app to serve it. The simplest way for development if `index.html` is in the root and Flask runs on `0.0.0.0:5000` is to ensure `script.js` API calls point to `http://<YOUR_COMPUTER_IP_ADDRESS>:5000/api/...` and then open `index.html` locally on the testing device or share it somehow. The provided Flask setup does not serve `index.html`.*
        *For the purpose of this project where `index.html` is opened as a file, the API calls in `script.js` (e.g. `fetch('/api/login')`) will resolve to `file:///api/login` which won't work. The API calls should be updated to use the full backend URL (e.g. `fetch('http://127.0.0.1:5000/api/login')`) if `index.html` is opened as a local file.*
        *Assuming the current setup where API calls are relative (e.g. `/api/xyz`), the `index.html` must be served from the same origin as the API, or CORS must be configured on the backend and full URLs used in the frontend. The simplest approach for development is to add a Flask route to serve `index.html`.*

        **Simplified Frontend Access for Development (when backend is on `0.0.0.0:5000`):**
        If your `script.js` uses relative paths like `/api/...`, and your backend is running on `http://<YOUR_COMPUTER_IP_ADDRESS>:5000`, then opening `index.html` as a local file (`file:///...`) will cause API calls to fail.
        To resolve this for development:
        1. (Option A - Recommended for simplicity if not serving static files from Flask) Modify `script.js` API calls to be absolute, e.g., `const API_BASE_URL = 'http://127.0.0.1:5000';` and then `fetch(\`\${API_BASE_URL}/api/login\`, ...)`. When testing on other devices, change `127.0.0.1` to your computer's network IP.
        2. (Option B - More robust) Add a route to your Flask `app.py` to serve `index.html` and other static files (`script.js`, `style.css`) from the root project directory.

## Testing
Refer to the `test_cases.md` file located in the project root for a comprehensive list of manual test scenarios. These tests cover user authentication, "Heures Creuses" management, appliance management, and the core calculation logic.
