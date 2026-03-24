# VoiceAI Agent - Web Demo

This is the prototype for the VoiceAI Customer Support Agent. It features a modern web interface where users can chat via text or voice.

## Features
-   **Voice Voice**: Hold the microphone button to record audio. The agent will speak back!
-   **Modern UI**: Glassmorphism design with a dark aesthetic.
-   **AI Brain**: Powered by OpenAI gpt-4o.
-   **RAG**: Answers based on trained policy documents.

## How to Run

1.  **Install Requirements** (if not already done):
    ```bash
    pip install -r requirements.txt
    ```
    *Ensure `python-multipart` is also installed for file uploads:*
    ```bash
    pip install python-multipart

    ```

2.  **Add API Keys**:
    Make sure your `.env` file has your `OPENAI_API_KEY`.

3.  **Start the Server**:
    ```bash
    uvicorn server:app --reload
    ```

4.  **Open the Website**:
    Go to `http://127.0.0.1:8000` in your browser.

## Testing
-   Click the **Mic Button** to record a question (e.g., "What is your return policy?").
-   The Agent should listen, think, and then **Speak** the answer back to you.
