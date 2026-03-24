import os
import json
from datetime import datetime
from typing import List, Dict
import openai
from dotenv import load_dotenv

# Import our custom modules
import database
import knowledge_base

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
try:
    client = openai.OpenAI(api_key=api_key)
except Exception:
    client = None
    print("WARNING: Agent Brain initialized without OpenAI Client.")

# Default System Prompt
SYSTEM_PROMPT = """
You are a professional Customer Support Agent for "GlobalTech Solutions".
Capabilities:
1. You can speak English and Twi (Akan). Detect the language of the user and respond in the same language. 
   - If the user speaks Twi, reply in natural, respectful Twi.
   - If the user speaks English, reply in professional English.
2. You have access to company policies. Use them to answer questions accurately.
3. You can check order status and process refunds (simulated).
4. If a customer is angry or the request is complex, escalate to a human supervisor.

TONE: persistent, polite, professional, and helpful.
"""

class CustomerSupportAgent:
    def __init__(self, session_id: str = "default_session"):
        self.session_id = session_id
        # Initialize conversation with System Prompt
        self.history: List[Dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    def get_completion(self, user_input: str) -> str:
        """
        Main function to process user input and generate a response.
        1. Log user input.
        2. Check Knowledge Base (RAG).
        3. Send to LLM.
        4. Log AI response.
        """
        # 1. Log User Input
        database.log_message(self.session_id, "user", user_input)

        # 2. Retrieve Context from Knowledge Base
        policy_context = knowledge_base.query_policies(user_input)
        
        # Prepare messages
        messages = list(self.history)
        
        # Inject RAG context if found
        if policy_context:
            messages.append({"role": "system", "content": policy_context})
            
        messages.append({"role": "user", "content": user_input})

        # 3. Call OpenAI
        if not client:
            ai_message = "I cannot think right now because my OpenAI API Key is missing. Please check .env file."
        else:
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    temperature=0.7
                )
                ai_message = response.choices[0].message.content
            except Exception as e:
                ai_message = f"I'm sorry, I'm having trouble connecting to my brain right now. Error: {str(e)}"

        # 4. Update History & Log
        self.history.append({"role": "user", "content": user_input})
        self.history.append({"role": "assistant", "content": ai_message})
        database.log_message(self.session_id, "assistant", ai_message)

        return ai_message

    def escalate(self, reason: str):
        """Log an escalation event."""
        database.log_transaction(self.session_id, "ESCALATION", reason, "OPEN")
        return "I have notified a human supervisor about your request. They will contact you shortly."

# Simple test loop
if __name__ == "__main__":
    agent = CustomerSupportAgent(session_id=f"test_{datetime.now().timestamp()}")
    print("Agent Initialized. Type 'quit' to exit.")
    
    while True:
        u_in = input("You: ")
        if u_in.lower() in ["quit", "exit"]:
            break
        
        response = agent.get_completion(u_in)
        print(f"Agent: {response}")
