@echo off
cd /d "%~dp0"
call freshvenv\Scripts\activate
python backend\manage.py makemigrations core --name moca_assessment
python backend\manage.py migrate
echo Migration complete!
