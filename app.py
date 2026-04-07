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


@app.route('/api/manager/comparison', methods=['POST'])
def manager_comparison():
    """
    Returns audience and budget comparison metrics for chart rendering.
    Expects JSON:
    {
      "expected_audience": 150,
      "actual_audience": 100,
      "planned_budget": 15000,
      "estimated_spend": 11000
    }
    """
    data = request.json or {}

    expected_audience = float(data.get('expected_audience') or 0)
    actual_audience = float(data.get('actual_audience') or 0)
    planned_budget = float(data.get('planned_budget') or 0)
    estimated_spend = float(data.get('estimated_spend') or 0)

    attendance_rate = (actual_audience / expected_audience) if expected_audience > 0 else 0.0
    budget_utilization = (estimated_spend / planned_budget) if planned_budget > 0 else 0.0

    audience_gap = expected_audience - actual_audience
    budget_gap = planned_budget - estimated_spend

    audience_suggestion = (
        'Attendance is on target.' if attendance_rate >= 0.9
        else 'Boost reminders and promotions to increase attendance before event start.'
    )

    budget_suggestion = (
        'Budget utilization is healthy.' if 0.75 <= budget_utilization <= 1.0
        else 'Recheck high-cost resources and rebalance quantities to optimize spend.'
    )

    return jsonify({
        'audience': {
            'expected': int(expected_audience),
            'actual': int(actual_audience),
            'gap': int(audience_gap),
            'attendance_rate': round(attendance_rate, 4)
        },
        'budget': {
            'planned': round(planned_budget, 2),
            'estimated_spend': round(estimated_spend, 2),
            'gap': round(budget_gap, 2),
            'utilization': round(budget_utilization, 4)
        },
        'suggestions': [
            audience_suggestion,
            budget_suggestion
        ]
    }), 200

if __name__ == '__main__':
    # Start the Flask development server on port 5000
    print("=== Chatbot API is starting on http://localhost:5000 ===")
    app.run(host='0.0.0.0', port=5000, debug=True)
