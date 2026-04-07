from rag_chatbot import EventRAGChatbot
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def main():
    print("=== Attendee Module: AI Chatbot API ===")
    
    # Initialize the Chatbot
    # Replace the mongo_uri with your actual MongoDB connection string
    # If using an LLM like Gemini, pass the model name.
    chatbot = EventRAGChatbot(
        mongo_uri="mongodb+srv://meetdhola28_db_user:wPPHdFtKiVYneQ7c@cluster0.sleva32.mongodb.net/", 
        gemini_model=os.getenv('GEMINI_MODEL', 'models/gemini-2.0-flash')
    )
    
    print("\n[Admin Step] Synching knowledge base with database...")
    # This queries MongoDB (read-only), creates embeddings, and stores them in FAISS vector DB.
    # In production, you might run this once an hour or trigger it when a new event is added.
    try:
        chatbot.build_knowledge_base()
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("Please ensure your MongoDB is running or the URI is correct.")
        return
        
    print("\n--- Chatbot is ready! ---")
    print("Type 'quit' to exit.")
    
    # Attendee chat loop
    while True:
        question = input("\nAttendee: ")
        if question.lower() == 'quit':
            break
            
        print("AI is thinking...")
        # Search FAISS -> Pass to LLM -> Return response entirely based on Mongo data
        answer = chatbot.ask_question(question)
        
        print(f"\nRAG Chatbot:\n{answer}")

if __name__ == "__main__":
    main()
