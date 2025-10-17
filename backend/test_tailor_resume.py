#!/usr/bin/env python3
"""
Test script for the tailor resume endpoint
Run this from the backend directory: python test_tailor_resume.py
"""

import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resumebuilder.settings')
django.setup()

def test_tailor_resume_endpoint():
    """Test the tailor resume endpoint"""
    
    # Test data
    test_data = {
        'company': 'Google',
        'job_description': '''
        Software Engineer - Full Stack
        
        We are looking for a passionate Software Engineer to join our team. 
        You will be responsible for developing and maintaining web applications 
        using modern technologies like React, Node.js, and Python.
        
        Requirements:
        - 3+ years of experience in software development
        - Proficiency in JavaScript, Python, and SQL
        - Experience with React, Node.js, and Django
        - Strong problem-solving skills
        - Bachelor's degree in Computer Science or related field
        
        Responsibilities:
        - Design and implement scalable web applications
        - Collaborate with cross-functional teams
        - Write clean, maintainable code
        - Participate in code reviews
        - Mentor junior developers
        '''
    }
    
    # Create a sample CV file
    sample_cv_content = """
    John Doe
    Software Engineer
    john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe
    
    SUMMARY
    Experienced software engineer with 5+ years of experience in full-stack development.
    Passionate about creating scalable web applications and solving complex problems.
    
    EXPERIENCE
    Senior Software Engineer | TechCorp Inc. | 2020-2023
    - Developed and maintained web applications using React and Node.js
    - Led a team of 3 junior developers
    - Improved application performance by 40%
    - Implemented CI/CD pipelines using Jenkins
    
    Software Engineer | StartupXYZ | 2018-2020
    - Built RESTful APIs using Python and Django
    - Worked with PostgreSQL and Redis
    - Collaborated with product team to define requirements
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of California, Berkeley | 2018
    
    SKILLS
    Programming Languages: JavaScript, Python, Java, C++
    Frameworks: React, Node.js, Django, Express.js
    Databases: PostgreSQL, MongoDB, Redis
    Tools: Git, Docker, Jenkins, AWS
    """
    
    # Save sample CV to a temporary file
    with open('sample_cv.txt', 'w') as f:
        f.write(sample_cv_content)
    
    try:
        # Prepare the request
        url = 'http://localhost:8000/api/resumes/tailor-resume/'
        
        with open('sample_cv.txt', 'rb') as cv_file:
            files = {'cv': ('sample_cv.txt', cv_file, 'text/plain')}
            data = {
                'company': test_data['company'],
                'job_description': test_data['job_description']
            }
            
            print("Sending request to tailor resume endpoint...")
            print(f"Company: {test_data['company']}")
            print(f"Job Description Length: {len(test_data['job_description'])} characters")
            print()
            
            # Make the request
            response = requests.post(url, files=files, data=data)
            
            print(f"Response Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print()
            
            if response.status_code == 200:
                result = response.json()
                print("SUCCESS!")
                print(f"Message: {result.get('message')}")
                print(f"Company: {result.get('company')}")
                print(f"File Path: {result.get('file_path')}")
                print()
                print("Tailored Resume Preview:")
                print("-" * 50)
                print(result.get('tailored_resume', 'No resume content'))
                print("-" * 50)
                print()
                print("PDF file should be saved at:", result.get('file_path'))
            else:
                print("ERROR!")
                print(f"Status Code: {response.status_code}")
                print(f"Response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("Connection Error!")
        print("Make sure the Django server is running on http://localhost:8000")
        print("Run: python manage.py runserver")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        # Clean up
        if os.path.exists('sample_cv.txt'):
            os.remove('sample_cv.txt')

if __name__ == '__main__':
    test_tailor_resume_endpoint()
