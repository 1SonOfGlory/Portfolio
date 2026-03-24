import sqlite3
import datetime
from typing import Optional

DB_NAME = "agent_memory.db"

def init_db():
    """Initialize the SQLite database with necessary tables."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Table for storing conversation logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS conversation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        sentiment_score REAL
    )
    ''')

    # Table for storing transactions (e.g., refunds, orders)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        details TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    conn.close()

def log_message(session_id: str, role: str, message: str, sentiment_score: Optional[float] = None):
    """Log a message to the database."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO conversation_logs (session_id, role, message, sentiment_score)
    VALUES (?, ?, ?, ?)
    ''', (session_id, role, message, sentiment_score))
    conn.commit()
    conn.close()

def log_transaction(session_id: str, transaction_type: str, details: str, status: str = "PENDING"):
    """Log a transaction to the database."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO transactions (session_id, transaction_type, details, status)
    VALUES (?, ?, ?, ?)
    ''', (session_id, transaction_type, details, status))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database {DB_NAME} initialized.")
