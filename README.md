### Demertia screening and care platform 
cd demintia
freshvenv/Scripts/activate
cd frontend
npm run dev

cd demintia
freshvenv/Scripts/activate
cd backend
python manage.py runserver

pip install libretranslate
libretranslate --host 0.0.0.0 --port 5000

## Environment Variables
Before running the project, you need to configure your environment variables.
Copy `.env.example` to a new file named `.env` in the root directory:
```bash
cp .env.example .env
```
Then fill in the required values, such as your `GROQ_API_KEY`.

it is only for my(yasin) refer - git push newrepo yasin_help_branch