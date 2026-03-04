@echo off
cd /d "%~dp0"
venv\Scripts\python.exe backend\manage.py makemigrations core --name moca_assessment
venv\Scripts\python.exe backend\manage.py migrate
echo Migration complete!
