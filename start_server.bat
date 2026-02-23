@echo off
echo Starting HEALTHCARE_HACK Django Server...
echo.
cd /d "%~dp0backend"
echo Running database migrations...
python manage.py migrate
echo.
echo Starting server at http://127.0.0.1:8000
echo Press Ctrl+C to stop.
echo.
python manage.py runserver
pause
