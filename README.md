# Agentic AI Portfolio: The Sovereign CX Agent

![Status](https://img.shields.io/badge/Status-Beta-purple) ![Language](https://img.shields.io/badge/Language-Python-blue) ![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o-green)

## Executive Summary
**Bridging the Digital Divide with Intelligent Infrastructure.**

As part of the **Griot Labs** mission, this Agentic AI Portfolio demonstrates a specialized, bilingual customer experience agent designed for the African context. While global models often overlook local dialects and offline accessibility, this system—developed under the **Digital Griot** alias—integrates high-end LLM reasoning with USSD-bridged accessibility. It solves the core problem of providing 24/7, high-quality, dialect-fluent support to customers who may lack consistent internet access or high-end smartphones.

---

## 🚀 Core Features

-   **Bilingual Intelligence**: Native fluency in both **English** and **Twi (Akan)**. The agent automatically detects the user's language and responds with cultural and linguistic precision.
-   **Multi-Modal Interface**: 
    -   **Voice AI**: Integrated with OpenAI Whisper for transcription and OpenAI TTS for human-like vocal responses.
    -   **USSD Bridge**: A simulated offline workflow ensuring support is accessible via standard telephony, requiring zero data.
-   **Enterprise RAG Guardrails**: Implements **Retrieval-Augmented Generation (RAG)** to ensure responses are grounded strictly in company policy documents, eliminating hallucinations.
-   **Autonomous Task Routing**: Capable of identifying complex or high-emotion queries (e.g., "angry" customers) and automatically initiating a semantic handoff to human supervisors.
-   **Audit-Ready Logging**: Comprehensive SQLite-backed transaction and conversation logging for business intelligence and quality assurance.

---

## 🛠 Tech Stack

-   **Core Engine**: Python 3.10+
-   **LLM Orchestration**: OpenAI GPT-4o
-   **Voice Processing**: OpenAI Whisper (Speech-to-Text) & OpenAI TTS (Text-to-Speech)
-   **API Framework**: FastAPI
-   **Environment Management**: `python-dotenv` for secure secret management.
-   **Database**: SQLite for persistent session memory and logs.

---

## 📐 Technical Architecture

The system operates on an **Agentic Feedback Loop**:

1.  **Ingestion**: Audio or Text is received via FastAPI endpoints.
2.  **Contextual Retrieval**: The `KnowledgeBase` is queried to find relevant policy snippets (RAG).
3.  **Reasoning**: The `CustomerSupportAgent` processes the input, RAG context, and session history through GPT-4o.
4.  **Action/Synthesis**: The agent decides whether to resolve the query, perform a simulated transaction (e.g., refund), or escalate.
5.  **Output**: Responses are converted to speech or sent as text back to the client.

---

## ⚙️ Installation & Setup

### 1. Clone the Laboratory
```bash
git clone https://github.com/1SonOfGlory/Portfolio.git
cd Portfolio
```

### 2. Environment Configuration
Create a `.env` file in the root directory and populate it with your credentials:
```bash
cp .env.example .env
```
Update `.env` with:
- `OPENAI_API_KEY`: Your OpenAI Secret Key.

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize the Brain
```bash
# Seed the knowledge base and initialize the logs
python database.py
python knowledge_base.py
```

### 5. Launch the Agent
```bash
uvicorn server:app --reload
```
Navigate to `http://localhost:8000` to interact with the web interface.

---

## 🎯 The Vision
This project is more than a chatbot; it is a prototype for **Sovereign AI Infrastructure**. By ensuring AI can speak the languages of our communities and operate without the "data tax," we are building toward a future where technology catalyzes inclusive macroeconomic growth.

**Built by Jabess Omane | CTO @ Griot Labs**
