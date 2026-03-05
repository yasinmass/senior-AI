@echo off
echo Starting NeuroScan AI Django Server...
echo.
cd /d "%~dp0"
echo Activating freshvenv...
call freshvenv\Scripts\activate
cd backend
echo Running database migrations...
python manage.py migrate
echo.
echo Starting server at http://127.0.0.1:8000
echo Press Ctrl+C to stop.
echo.
python manage.py runserver
pause
