from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
from bs4 import BeautifulSoup
import PyPDF2
from docx import Document
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://resume-update-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(file: UploadFile) -> str:
    content = file.file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_docx(file: UploadFile) -> str:
    content = file.file.read()
    doc = Document(io.BytesIO(content))
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def extract_text_from_url(url: str) -> str:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        text = soup.get_text(separator=" ", strip=True)
        return text
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch job posting: {str(e)}")

def compare_texts(job_text: str, resume_text: str) -> dict:
    job_summary = job_text[:500] + "..."  # Truncate for demo
    resume_summary = resume_text[:1500] + "..."  # Fixed: use resume_text
    match_score = 85  # Placeholder
    work_experience = [
        "Extracted relevant experience 1",
        "Extracted relevant experience 2",
        "Extracted relevant experience 3",
        "Extracted relevant experience 4",
        "Extracted relevant experience 5",
    ]
    cover_letter = (
        "Dear Hiring Manager,\n\nBased on the job posting, I have tailored this cover letter to highlight relevant skills and experiences from the resume.\n\nSincerely,\nApplicant"
    )
    return {
        "job_summary": job_summary,
        "match_score": match_score,
        "resume_summary": resume_summary,
        "work_experience": work_experience,
        "cover_letter": cover_letter,
    }

@app.post("/api/compare")
async def compare(job_url: str = Form(...), resume: UploadFile = File(...)):
    try:
        # Extract text from resume
        resume_text = ""
        if resume.filename.endswith(".pdf"):
            resume_text = extract_text_from_pdf(resume)
        elif resume.filename.endswith((".doc", ".docx")):
            resume_text = extract_text_from_docx(resume)
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Unsupported file format. Please upload PDF or DOCX."},
            )
        # Extract text from job URL
        job_text = extract_text_from_url(job_url)
        # Compare texts and generate outputs
        result = compare_texts(job_text, resume_text)
        # Include raw texts in the response for preview
        result["resume_text"] = resume_text
        result["job_text"] = job_text
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Processing error: {str(e)}"},
        )

@app.get("/")
def root():
    return {"message": "MatchWise Backend API is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}

