import os
import time
import shutil
from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import openai
from dotenv import load_dotenv

from agent_brain import CustomerSupportAgent

# Load env setup
load_dotenv()
try:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except Exception as e:
    client = None
    print(f"WARNING: OpenAI Client failed to initialize. API Key missing? Error: {e}")

app = FastAPI()

# Input Validation/CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent
agent = CustomerSupportAgent()

# Directories
AUDIO_DIR = "static_audio"
UPLOAD_DIR = "uploads"import os

# --- VERCEL READ-ONLY FIX ---
# Check if we are running on Vercel (which uses a read-only filesystem)
if os.environ.get('VERCEL'):
    AUDIO_DIR = '/tmp/static_audio'
else:
    # Keep it local for when you are developing on your PC
    AUDIO_DIR = os.path.join(os.getcwd(), 'static_audio')

# Create the directory safely
os.makedirs(AUDIO_DIR, exist_ok=True)os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount Static Files (Frontend)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

def generate_speech_file(text: str) -> str:
    """Generates an audio file from text using OpenAI TTS."""
    if not client:
        print("TTS Skipped: No OpenAI Client")
        return ""
    filename = f"response_{int(time.time()*1000)}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    try:
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        response.stream_to_file(filepath)
        return f"/audio/{filename}"
    except Exception as e:
        print(f"TTS Error: {e}")
        return ""

def transcribe_audio(filepath: str) -> str:
    """Transcribes audio file using OpenAI Whisper."""
    if not client:
        return "Error: OpenAI API Key missing."
    try:
        with open(filepath, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
        return transcript.text
    except Exception as e:
        print(f"Whisper Error: {e}")
        return ""

@app.post("/chat")
async def chat_endpoint(message: str = Form(...)):
    """Text-only chat endpoint."""
    response_text = agent.get_completion(message)
    # Optional: Generate audio even for text chat? Let's say yes for the "Voice Agent" feel.
    audio_url = generate_speech_file(response_text)
    return {"response": response_text, "audio_url": audio_url}

@app.post("/api/transcribe")
async def handle_audio_upload(file: UploadFile = File(...)):
    """
    Receives audio blob from frontend, transcribes it, 
    gets agent response, and returns text + TTS audio.
    """
    # Save uploaded file
    temp_filename = f"upload_{int(time.time())}.webm"
    temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
    
    with open(temp_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 1. Transcribe
    user_text = transcribe_audio(temp_filepath)
    print(f"Transcription: {user_text}")
    
    if not user_text:
        return JSONResponse({"response": "I couldn't hear you clearly.", "audio_url": ""})

    # 2. Get Agent Response
    agent_response = agent.get_completion(user_text)
    
    # 3. Generate Audio Response
    audio_url = generate_speech_file(agent_response)
    
    return {
        "transcription": user_text,
        "response": agent_response,
        "audio_url": audio_url
    }

@app.get("/")
def serve_home():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
