# Voice AI Customer Support Agent (Twi + English)

This project implements a bilingual AI customer support agent capable of:
1.  **Voice Interaction**: Handling phone calls via Twilio.
2.  **Bilingual Support**: Speaking/Understanding English and Twi (Akan).
3.  **RAG Knowledge Base**: Answering policy questions from documents.
4.  **Logging**: Recording all interactions to a local database.

## Prerequisites

1.  **Python 3.10+** (Recommended)
2.  **OpenAI API Key** (for LLM and TTS)
3.  **Twilio Account** (SID, Auth Token, Phone Number)
4.  **ngrok** (for local testing with Twilio)

## Installation

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure Environment**:
    -   Copy `.env.example` to `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Edit `.env` and add your **OPENAI_API_KEY** and **Twilio Credentials**.

## Running the Verification Test

To verify the core logic (Text-only):
```bash
python test_agent.py
```
*Note: This requires a valid OpenAI API key in `.env`.*

## Running the Voice Server

1.  **Start the Server**:
    ```bash
    uvicorn server:app --reload
    ```
    The server will start at `http://127.0.0.1:8000`.

2.  **Expose to Internet (for Twilio)**:
    In a new terminal:
    ```bash
    ngrok http 8000
    ```
    Copy the `https://....ngrok-free.app` URL.

3.  **Configure Twilio**:
    -   Go to your Twilio Phone Number settings.
    -   Under "Voice & Fax" -> "A Call Comes In", set Webhook to:
        `https://YOUR-NGROK-URL.ngrok-free.app/voice`
    -   Save inside Twilio.

4.  **Test Call**:
    -   Call your Twilio number.
    -   Speak in English or simple Twi phrases.

## Features implemented

-   `agent_brain.py`: Core logic using OpenAI GPT-4o.
-   `knowledge_base.py`: RAG system using ChromaDB.
-   `server.py`: FastAPI server handling Twilio webhooks and TTS audio generation.
-   `database.py`: SQLite logging of conversations.
