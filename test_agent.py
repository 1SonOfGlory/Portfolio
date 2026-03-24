import os
import sys

# Ensure we can import modules from current directory
sys.path.append(os.getcwd())

from agent_brain import CustomerSupportAgent
from knowledge_base import add_policy_document, query_policies

def test_rag():
    print("--- Testing RAG ---")
    # Add a unique policy
    policy_text = "SPECIAL_TEST_POLICY: Handling fees are waived for VIP customers."
    add_policy_document(policy_text, "test_script")
    
    # Query it
    results = query_policies("Do VIPs pay handling fees?")
    if "waived" in results:
        print("RAG Test PASSED: Found relevant policy.")
    else:
        print(f"RAG Test FAILED. Results: {results}")

def test_agent_conversation():
    print("\n--- Testing Agent Conversation ---")
    agent = CustomerSupportAgent(session_id="test_automated")
    
    # Test English
    response_en = agent.get_completion("Hello, does the company have a return policy?")
    print(f"Agent (EN): {response_en}")
    
    # Test Twi (Simulated input)
    # Note: We can't easily test Twi understanding without a real Twi model or Twi input,
    # but we can check if it tries to respond to "Ete sen?" (How are you?)
    response_twi = agent.get_completion("Ete sen? (Please reply in Twi)")
    print(f"Agent (Twi): {response_twi}")

if __name__ == "__main__":
    try:
        test_rag()
        test_agent_conversation()
    except Exception as e:
        print(f"Test Failed with Error: {e}")
