import os
import pickle
import tempfile
from datetime import datetime

import cv2
import gspread
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.oauth2.service_account import Credentials
from insightface.app import FaceAnalysis

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SHEET_ID = "1M-Tf_YzSJBKLnVK_KPWxuT0_sQI034NBQSugVNEkgcE"

EMBEDDINGS_PATH = os.path.join(
    "models",
    "faceiq0_insightface_embeddings.pkl",
)

SERVICE_ACCOUNT_PATH = os.path.join(
    "credentials",
    "service_account.json",
)

face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=0, det_size=(640, 640))

with open(EMBEDDINGS_PATH, "rb") as file:
    face_data = pickle.load(file)

known_embeddings = np.array(face_data["embeddings"])
known_student_ids = face_data["student_ids"]
known_names = face_data["names"]
known_folders = face_data["folders"]


def get_google_sheet():
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    credentials = Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH,
        scopes=scopes,
    )

    client = gspread.authorize(credentials)
    spreadsheet = client.open_by_key(SHEET_ID)

    return spreadsheet


def get_student_department(student_id: str):
    spreadsheet = get_google_sheet()
    students_sheet = spreadsheet.worksheet("Students")
    students = students_sheet.get_all_records()

    for student in students:
        if str(student.get("student_id", "")).strip() == student_id:
            return str(student.get("department", "")).strip()

    return ""


def get_next_attendance_id():
    spreadsheet = get_google_sheet()
    attendance_sheet = spreadsheet.worksheet("AttendanceRecords")
    records = attendance_sheet.get_all_records()

    if not records:
        return "ATT-0001"

    last_number = 0

    for record in records:
        attendance_id = str(record.get("attendance_id", "")).strip()

        if attendance_id.startswith("ATT-"):
            try:
                number = int(attendance_id.replace("ATT-", ""))
                last_number = max(last_number, number)
            except ValueError:
                continue

    return f"ATT-{last_number + 1:04d}"


@app.get("/")
def root():
    return {
        "message": "FaceIQ0 Backend Running",
        "registered_embeddings": len(known_embeddings),
    }


@app.get("/test-face")
def test_face():
    return {
        "status": "InsightFace loaded successfully",
        "registered_embeddings": len(known_embeddings),
    }


@app.get("/test-sheet")
def test_sheet():
    spreadsheet = get_google_sheet()
    students_sheet = spreadsheet.worksheet("Students")
    attendance_sheet = spreadsheet.worksheet("AttendanceRecords")

    students = students_sheet.get_all_records()
    attendance = attendance_sheet.get_all_records()

    return {
        "status": "Google Sheet connected",
        "students_found": len(students),
        "attendance_records_found": len(attendance),
    }


def recognize_image(image_path: str, threshold: float = 0.45):
    image_bgr = cv2.imread(image_path)

    if image_bgr is None:
        return {
            "status": "image_not_read",
            "student_id": None,
            "name": None,
            "folder": None,
            "similarity": None,
            "distance": None,
        }

    faces = face_app.get(image_bgr)

    if len(faces) == 0:
        return {
            "status": "no_face_detected",
            "student_id": None,
            "name": None,
            "folder": None,
            "similarity": None,
            "distance": None,
        }

    if len(faces) > 1:
        return {
            "status": "multiple_faces_detected",
            "student_id": None,
            "name": None,
            "folder": None,
            "similarity": None,
            "distance": None,
        }

    test_embedding = faces[0].normed_embedding

    similarities = np.dot(known_embeddings, test_embedding)

    best_match_index = int(np.argmax(similarities))
    best_similarity = float(similarities[best_match_index])
    distance = 1 - best_similarity

    if best_similarity >= threshold:
        return {
            "status": "recognized",
            "student_id": known_student_ids[best_match_index],
            "name": known_names[best_match_index],
            "folder": known_folders[best_match_index],
            "similarity": best_similarity,
            "distance": distance,
        }

    return {
        "status": "unknown",
        "student_id": None,
        "name": None,
        "folder": None,
        "similarity": best_similarity,
        "distance": distance,
    }


@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name

    try:
        result = recognize_image(temp_path)
        return result
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/mark-attendance")
async def mark_attendance(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[-1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name

    try:
        result = recognize_image(temp_path)

        if result["status"] != "recognized":
            return {
                "attendance_marked": False,
                "reason": result["status"],
                "recognition": result,
            }

        now = datetime.now()
        date_value = now.strftime("%Y-%m-%d")
        time_value = now.strftime("%H:%M:%S")

        spreadsheet = get_google_sheet()
        attendance_sheet = spreadsheet.worksheet("AttendanceRecords")

        existing_records = attendance_sheet.get_all_records()

        already_marked = any(
            str(record.get("student_id", "")).strip() == result["student_id"]
            and str(record.get("date", "")).strip() == date_value
            for record in existing_records
        )

        if already_marked:
            return {
                "attendance_marked": False,
                "reason": "already_marked_today",
                "recognition": result,
            }

        attendance_id = get_next_attendance_id()
        department = get_student_department(result["student_id"])
        faculty_id = "fac-001"

        attendance_sheet.append_row(
            [
                attendance_id,
                result["student_id"],
                result["name"],
                department,
                date_value,
                time_value,
                "Present",
                faculty_id,
            ]
        )

        return {
            "attendance_marked": True,
            "message": "Attendance marked successfully",
            "attendance_id": attendance_id,
            "student_id": result["student_id"],
            "name": result["name"],
            "department": department,
            "date": date_value,
            "time": time_value,
            "status": "Present",
            "faculty_id": faculty_id,
            "similarity": result["similarity"],
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)