# Backend-Frontend Integration Test Guide

## Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:3000`

## Test Steps

### 1. Start Backend Server
```bash
cd backend
python manage.py runserver
```

### 2. Start Frontend Server
```bash
cd frontend
npm start
```

### 3. Test API Endpoints

#### Test Companies API
- GET `http://localhost:8000/api/companies/` - Should return empty list initially
- POST `http://localhost:8000/api/companies/` with body:
  ```json
  {
    "name": "Google",
    "description": "Tech company",
    "website": "https://google.com",
    "industry": "Technology"
  }
  ```

#### Test Jobs API
- GET `http://localhost:8000/api/jobs/` - Should return empty list initially
- POST `http://localhost:8000/api/jobs/` with body:
  ```json
  {
    "title": "Software Engineer",
    "description": "Full-stack developer role",
    "company": 1,
    "requirements": "Python, React, Django",
    "location": "Mountain View, CA",
    "salary_range": "$120k-$180k",
    "job_type": "full-time"
  }
  ```

#### Test Resume API
- POST `http://localhost:8000/api/resumes/base-cv/upload/` with a file upload
- GET `http://localhost:8000/api/resumes/base-cv/latest/` - Should return latest CV

### 4. Test Frontend Integration

#### Test Node Creation
1. Open `http://localhost:3000`
2. Click on the base node (Upload base cv here)
3. In the control panel, add a company name (e.g., "Google")
4. Click "✓ Add" - Should create a company node
5. Click on the company node
6. Add a job title (e.g., "Software Engineer")
7. Click "✓ Add" - Should create a job node

#### Test CV Upload
1. Click on the base node
2. Upload a CV file (PDF, DOC, DOCX, or TXT)
3. Should show "Uploading CV..." then "Uploaded: filename"

#### Test Node Editing
1. Click on any company or job node
2. Click the "Edit" button
3. Change the name and click "Save"
4. Should update both frontend and backend

#### Test Node Deletion
1. Click on any company or job node
2. Click "🗑 Delete Node & Children"
3. Confirm deletion
4. Should remove from both frontend and backend

### 5. Expected Behavior
- All frontend actions should sync with backend
- Loading states should show during API calls
- Error messages should display if API calls fail
- Data should persist after page refresh

## Troubleshooting

### CORS Issues
If you see CORS errors, check that:
- Backend CORS settings include `http://localhost:3000`
- Backend is running on port 8000
- Frontend is running on port 3000

### API Connection Issues
- Check browser network tab for failed requests
- Verify backend server is running
- Check backend logs for errors

### Database Issues
- Run `python manage.py migrate` to ensure database is up to date
- Check that SQLite database file exists in backend directory
