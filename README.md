# ResumeBuilder - Interactive Resume Generator

A NeetCode-style interactive resume builder that allows users to create tailored resumes for different companies and job positions.

## 🎯 Project Overview

This project creates an interactive graph-based interface where users can:
1. Upload a base CV/Resume
2. Add company nodes for target companies
3. Create job-specific nodes with titles and descriptions
4. Generate tailored resumes using AI based on the company and role

## 🏗️ Architecture

```
ResumeBuilder/
├── backend/           # Django REST API
├── frontend/          # React.js application
├── docs/             # Project documentation
└── README.md         # This file
```

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **React Flow** - Graph visualization
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Django** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database
- **PyPDF2/pdfplumber** - PDF processing
- **OpenAI/Anthropic** - AI resume generation

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL (or SQLite for development)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 👥 Team Structure

- **Backend Developers**: Django API, PDF processing, AI integration
- **Frontend Developers**: React UI, graph visualization, user experience
- **Project Lead**: Full-stack setup and coordination

## 📋 Development Phases

1. **Phase 1**: Basic project setup and structure
2. **Phase 2**: PDF upload and parsing functionality
3. **Phase 3**: Graph visualization and node management
4. **Phase 4**: AI resume generation
5. **Phase 5**: Polish and deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.