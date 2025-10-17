# ResumeBuilder Windows Setup Guide

## 📋 Prerequisites

Before setting up the ResumeBuilder project on Windows, ensure you have:

- **Python 3.9+** installed ([Download from python.org](https://www.python.org/downloads/))
- **Node.js 16+** installed ([Download from nodejs.org](https://nodejs.org/))
- **PowerShell** (included with Windows)
- **Git** (optional, for cloning repository)

## 🚀 Complete Setup Process

### Step 1: Navigate to Project Directory

Open PowerShell and navigate to your project:

```powershell
cd "D:\Hackathon\ResumeBuilder"
# Or wherever your project is located
```

### Step 2: Backend Setup (Django)

#### 2.1 Navigate to Backend Directory
```powershell
cd backend
```

#### 2.2 Create Python Virtual Environment
```powershell
python -m venv venv
```

#### 2.3 Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

**Note**: If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2.4 Install Python Dependencies
```powershell
pip install -r requirements.txt
```

This will install:
- Django 4.2.7
- Django REST Framework
- CORS headers
- PDF processing libraries (PyPDF2, pdfplumber)
- AI integration libraries (OpenAI, Anthropic)
- And other required packages

#### 2.5 Create Environment File
```powershell
copy env.example .env
```

**Important**: Edit the `.env` file to add your API keys:
- `OPENAI_API_KEY=your-openai-api-key`
- `ANTHROPIC_API_KEY=your-anthropic-api-key`

#### 2.6 Run Database Migrations
```powershell
python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, auth, companies, contenttypes, jobs, resumes, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  [... more migrations ...]
  Applying resumes.0001_initial... OK
```

### Step 3: Frontend Setup (React)

#### 3.1 Navigate to Frontend Directory
```powershell
cd ..\frontend
```

#### 3.2 Install Node.js Dependencies
```powershell
npm install
```

This will install:
- React 18.2.0
- React Flow for graph visualization
- Tailwind CSS for styling
- Axios for API calls
- And other frontend dependencies

### Step 4: Start the Servers

#### 4.1 Start Backend Server

Open a new PowerShell window and run:
```powershell
cd "D:\Hackathon\ResumeBuilder\backend"
.\venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

Expected output:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
October 17, 2025 - 12:11:01
Django version 4.2.7, using settings 'resumebuilder.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

#### 4.2 Start Frontend Server

Open another PowerShell window and run:
```powershell
cd "D:\Hackathon\ResumeBuilder\frontend"
npm start
```

The React development server will start and automatically open your browser to `http://localhost:3000`.

## 🛠️ Automated Setup Scripts

For convenience, use the provided Windows PowerShell scripts:

### Initial Setup (Run Once)
```powershell
.\setup_windows.ps1
```

### Daily Use (Start Servers)
```powershell
.\start_servers_windows.ps1
```

## 🧪 Testing the Integration

### 1. Verify Backend API

Open your browser to `http://localhost:8000/api/` to see available endpoints:
- `/api/companies/` - Company management
- `/api/jobs/` - Job management  
- `/api/resumes/base-cv/upload/` - CV upload

### 2. Test Frontend Application

Navigate to `http://localhost:3000` and test:

#### Node Creation
1. Click on the base node (Upload base cv here)
2. Add a company name (e.g., "Google")
3. Click "✓ Add" - Should create a company node
4. Click on the company node
5. Add a job title (e.g., "Software Engineer")
6. Click "✓ Add" - Should create a job node

#### CV Upload
1. Click on the base node
2. Upload a CV file (PDF, DOC, DOCX, or TXT)
3. Should show "Uploading CV..." then "Uploaded: filename"

#### Node Management
- Edit nodes by clicking them and using the edit button
- Delete nodes with the delete button
- All changes sync with the backend in real-time

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Virtual Environment Activation Error
If `.\venv\Scripts\Activate.ps1` fails:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Port Already in Use
If ports 8000 or 3000 are busy:
```powershell
# Find and kill processes on port 8000
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Find and kill processes on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

#### Python/Node Not Found
Ensure Python and Node.js are in your PATH:
```powershell
python --version
node --version
npm --version
```

#### CORS Issues
If frontend can't connect to backend:
- Ensure backend is running on port 8000
- Ensure frontend is running on port 3000
- Check that `django-cors-headers` is installed

#### Database Issues
If migrations fail:
```powershell
# Delete existing database and start fresh
Remove-Item db.sqlite3
python manage.py migrate
```

## 📁 Project Structure

```
ResumeBuilder/
├── backend/                 # Django REST API
│   ├── venv/               # Python virtual environment
│   ├── manage.py           # Django management script
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   ├── db.sqlite3         # SQLite database
│   ├── companies/         # Companies app
│   ├── jobs/              # Jobs app
│   ├── resumes/           # Resumes app
│   └── resumebuilder/     # Main Django project
├── frontend/               # React application
│   ├── package.json       # Node.js dependencies
│   ├── src/               # React source code
│   └── public/            # Static files
├── setup_windows.ps1      # Automated setup script
└── start_servers_windows.ps1  # Server startup script
```

## 🎯 Next Steps

After successful setup:

1. **Configure AI APIs**: Add your OpenAI/Anthropic API keys to `.env`
2. **Upload Base CV**: Use the web interface to upload your resume
3. **Create Companies**: Add target companies you're interested in
4. **Add Jobs**: Create job postings for specific roles
5. **Generate Tailored Resumes**: Use AI to create customized resumes

## 📚 Available Endpoints

### Companies API
- `GET /api/companies/` - List all companies
- `POST /api/companies/` - Create new company
- `PUT /api/companies/{id}/` - Update company
- `DELETE /api/companies/{id}/` - Delete company

### Jobs API
- `GET /api/jobs/` - List all jobs
- `POST /api/jobs/` - Create new job
- `GET /api/jobs/by_company/?company_id=1` - Jobs for specific company

### Resumes API
- `POST /api/resumes/base-cv/upload/` - Upload CV file
- `GET /api/resumes/base-cv/latest/` - Get latest uploaded CV

The application is now ready for development and use! 🎉
