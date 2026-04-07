from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from rag_chatbot import EventRAGChatbot

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Initialize Flask App
app = Flask(__name__)

# Enable CORS (Cross-Origin Resource Sharing)
# This allows your MERN (React) frontend to talk to this Python backend
# even if they are running on different ports (e.g., frontend on 3000, backend on 5000)
CORS(app)

# Initialize the Chatbot
# Ensure the MongoDB URI and Gemini model match what you used in main.py
print("Initializing Chatbot...")
chatbot = EventRAGChatbot(
    mongo_uri="mongodb+srv://meetdhola28_db_user:wPPHdFtKiVYneQ7c@cluster0.sleva32.mongodb.net/", 
    gemini_model=os.getenv('GEMINI_MODEL', 'models/gemini-2.0-flash')
)

# Build the knowledge base when the server starts
try:
    print("Building knowledge base from MongoDB...")
    chatbot.build_knowledge_base()
except Exception as e:
    print(f"Error building knowledge base: {e}")

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    API Endpoint for the chatbot.
    Expects JSON payload: {"question": "What are the upcoming events?"}
    Returns JSON payload: {"answer": "The upcoming events are..."}
    """
    data = request.json
    
    # Validate request
    if not data or 'question' not in data:
        return jsonify({"error": "No 'question' field provided in the request body"}), 400
        
    question = data['question']
    
    try:
        # Pass the question to the RAG chatbot and get the answer
        print(f"Received question: {question}")
        answer = chatbot.ask_question(question)
        
        # Return the answer as JSON
        return jsonify({"answer": answer}), 200
        
    except Exception as e:
        print(f"Error generating answer: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return jsonify({"status": "running"}), 200

if __name__ == '__main__':
    # Start the Flask development server on port 5000
    print("=== Chatbot API is starting on http://localhost:5000 ===")
    app.run(host='0.0.0.0', port=5000, debug=True)
