# Attendance Management System Frontend

A high-performance, modern web interface for the Attendance Management System, built with Next.js and Tailwind CSS.

## 🚀 Features

- **Responsive Dashboards**: Real-time stats and attendance logs.
- **Interactive Modules**: Specialized views for students, teachers, and admins.
- **Live Camera Feed**: Direct integration for face recognition.
- **PDF/CSV Exports**: Easy reporting and record-keeping.
- **Glassmorphism Design**: Sleek and modern aesthetic.

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Key Directories

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components (Dashboard, Timetable, etc.).
- `context/`: Auth and application state contexts.
- `public/`: Static assets and icons.
- `types/`: TypeScript definitions.

## ⚙️ Configuration

Ensure the `NEXT_PUBLIC_API_URL` is set in your environment if the backend is running on a non-standard port or external host.
