# Attendance Management System Backend

This is the backend server for the Attendance Management System. It handles face recognition, user authentication, and database operations using Flask and MongoDB.

## 🛠️ Components

- **Flask API**: RESTful endpoints for frontend communication.
- **MongoDB**: Storage for student records, attendance logs, and timetables.
- **OpenCV & AI Models**: Face detection (`haarcascade_frontalface_default.xml`) and recognition logic.
- **Administration Scripts**: Utilities for managing accounts, migrating data, and diagnosing the system.

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.9+
- MongoDB instance (Local or Atlas)

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your `.env` file with:
   ```text
   MONGODB_URI=your_mongodb_uri
   SECRET_KEY=your_secret_key
   ```

### Running the Server

Start the Flask server:
```bash
python app.py
```
The backend will be available at `http://localhost:5000`.

## 📂 Key Files

- `app.py`: Main entry point and API route definitions.
- `recognition.py`: Core face recognition logic.
- `core/`: Database models and shared utilities.
- `student/`, `teacher/`, `admin/`: Module-specific route handlers.
- `scripts/`: Initialization and database management scripts.
