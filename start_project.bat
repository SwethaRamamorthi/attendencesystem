@echo off
echo Starting Face Recognition Attendance System...

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && python app.py"

echo Starting Frontend Application...
start "Frontend Application" cmd /k "cd frontend && npm run dev"

echo Startup commands executed. Please check the new terminal windows for logs.
pause
