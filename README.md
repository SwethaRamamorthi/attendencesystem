# Attendance Management System using Face Recognition

A modern, high-performance attendance management system built with Next.js, Flask, and MongoDB. This system leverages real-time face recognition to automate the attendance tracking process for students and teachers.

## 🚀 Key Features

- **Real-time Face Detection & Recognition**: Seamlessly identify students using live camera feeds.
- **Dynamic Dashboards**: Dedicated interfaces for Students and Teachers with comprehensive statistics.
- **Attendance Ledger**: Detailed attendance history with filtering and search capabilities.
- **Automated Reports**: Export attendance records in CSV and PDF formats.
- **Student Registration**: Simple face enrollment process for new students.
- **Modern UI**: Vibrant, glassmorphism-based design with a focus on user experience.

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/), React, Tailwind CSS, Framer Motion
- **Backend**: [Flask](https://flask.palletsprojects.com/), Python, OpenCV, TensorFlow/Face-api.js
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Deployment**: Local dev server (compatible with Vercel for frontend)

## 📦 Project Structure

```text
├── backend/                # Flask server, AI models, and database logic
├── frontend/               # Next.js application, UI components, and state management
├── Project Snap/           # Screenshots and assets
└── README.md               # Project documentation
```

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (Running locally or on Atlas)

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure the `.env` file with your MongoDB URI and other settings.
4. (Optional) Run initialization scripts if needed (e.g., `create_admin.py`).

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Running the Entire Project

Use the provided batch script for a quick start:
```bash
start_project.bat
```

---
Made with ❤️ by Swetha Ramamorthi
