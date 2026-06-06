# Adaptive Data Science Language Model Assistant

Full-stack AI application developed for the ABB EngineeredX 2.0 hackathon.
This platform automatically analyzes uploaded CSV datasets, detects the problem type (Classification, Regression, Clustering, Time-Series), trains appropriate machine learning models, and visualizes the results on a beautiful enterprise-grade dashboard.

## Architecture

*   **Frontend**: React 18, Tailwind CSS, Recharts, Axios
*   **Backend**: Spring Boot 3, Java 17, Maven
*   **ML Engine**: Python, Flask, Pandas, Scikit-Learn

## Features

1.  **Automated Data Pipeline**: Handles missing values, encodes categorical features, and scales numerical data automatically.
2.  **Adaptive Problem Detection**: Intelligently determines if a dataset requires classification, regression, clustering, or time-series analysis based on data types and target variable characteristics.
3.  **Model Training & Comparison**: Trains multiple models (e.g., Random Forest vs. Logistic Regression) and recommends the best performing one.
4.  **Interactive Dashboard**: Visualizes feature importance, class distribution, trends, and metrics using Recharts.
5.  **AI Insights**: Generates human-readable explanations of dataset characteristics and model performance.

## Prerequisites

*   Node.js (v18+)
*   Java Development Kit (JDK 17)
*   Maven (v3.8+)
*   Python (v3.9+)
*   pip (Python package manager)

## Installation & Running Instructions

The project consists of three distinct components that need to be run concurrently.

### 1. Python ML Engine (Port 5000)

1.  Navigate to the `ml-service` directory:
    ```bash
    cd ml-service
    ```
2.  (Optional) Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Start the Flask server:
    ```bash
    python app.py
    ```

### 2. Spring Boot Backend (Port 8080)

1.  Open a new terminal and navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Run the application using Maven:
    ```bash
    mvn spring-boot:run
    ```

### 3. React Frontend (Port 3000)

1.  Open a third terminal and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install npm packages:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

The application will now be accessible at `http://localhost:3000`.

## API Endpoints

### Spring Boot API (Proxy)
*   `GET /api/health` - Health check.
*   `POST /api/upload` - Uploads a CSV file (multipart/form-data) and forwards it to the ML engine.

### Python ML Engine API
*   `GET /health` - Health check.
*   `POST /analyze` - Receives CSV, performs data analysis, model training, and returns a comprehensive JSON response containing insights and chart data.

## Project Structure

```text
adaptive-ds-assistant/
├── backend/                  # Spring Boot Java application
│   ├── src/main/java/.../
│   │   ├── config/           # CORS & Exception handling
│   │   ├── controller/       # REST endpoints
│   │   ├── model/            # DTOs
│   │   └── service/          # Orchestration layer
│   └── pom.xml
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI elements (Navbar, Charts, etc.)
│   │   ├── pages/            # View components (Home, Upload, Dashboard)
│   │   ├── services/         # Axios API configuration
│   │   ├── App.js            # React Router setup
│   │   └── index.css         # Tailwind & global styles
│   ├── package.json
│   └── tailwind.config.js
└── ml-service/               # Python Flask ML Engine
    ├── app.py                # Core ML logic and API
    └── requirements.txt
```
