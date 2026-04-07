import os
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import google.generativeai as genai

class EventRAGChatbot:
    def __init__(self, mongo_uri="mongodb://localhost:27017/", gemini_model="models/gemini-2.0-flash", gemini_api_key=None):
        """
        Initializes the RAG Chatbot.
        - Connects to MongoDB as READ-ONLY conceptually.
        - Loads the embedding model to convert text to vectors.
        - Initializes an empty FAISS index for vector storage.
        """
        # 1. MongoDB Setup
        self.client = MongoClient(mongo_uri)
        self.db = self.client["test"]
        
        # 2. Embedding Model Setup (Runs locally on CPU/GPU)
        print("Loading Embedding Model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dimension = self.embedding_model.get_sentence_embedding_dimension()
        
        # 3. Vector Database Setup (FAISS)
        self.index = faiss.IndexFlatL2(self.embedding_dimension)
        self.event_documents = [] # To store the actual text mapped to the vectors
        
        # 4. LLM Setup (Gemini)
        self.gemini_model = gemini_model
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.gemini_fallback_models = [
            "models/gemini-2.5-flash",
            "models/gemini-2.0-flash",
            "models/gemini-flash-latest",
            "models/gemini-2.0-flash-lite",
            "models/gemini-flash-lite-latest",
        ]
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)

    def _extract_response_text(self, result):
        answer = getattr(result, "text", None)
        if answer:
            return answer

        candidates = getattr(result, "candidates", []) or []
        if candidates:
            parts = getattr(candidates[0].content, "parts", [])
            text_parts = [getattr(p, "text", "") for p in parts if getattr(p, "text", None)]
            if text_parts:
                return "\n".join(text_parts)
        return None

    def fetch_event_data_readonly(self):
        """
        Safely fetches event data from MONGO_DB.
        ONLY USES READ OPERATIONS (.find()). No inserts or updates.
        """
        print("Fetching data from MONGO_DB (Read-Only)...")
        events_collection = self.db["events"]
        
        # We only retrieve data, excluding the MongoDB '_id'
        # Adjust the query filter {} if you only want active/published events
        cursor = events_collection.find({}, {"_id": 0})
        
        fetched_docs = []
        for event in cursor:
            # Format the dictionary into a string that the AI can read clearly
            text_representation = (
                f"Event Name: {event.get('event_name', 'N/A')}\n"
                f"Event Type: {event.get('event_type', 'N/A')}\n"
                f"Description: {event.get('description', 'N/A')}\n"
                f"Venue: {event.get('venue', 'N/A')}\n"
                f"Start Date: {event.get('start_date', 'N/A')}\n"
                f"End Date: {event.get('end_date', 'N/A')}\n"
                f"Expected Audience: {event.get('expected_audience', 'N/A')}\n"
                f"Status: {event.get('status', 'N/A')}"
            )
            fetched_docs.append(text_representation)
            
        print(f"Successfully fetched {len(fetched_docs)} event records.")
        return fetched_docs

    def build_knowledge_base(self):
        """
        Fetches data, converts it to vectors, and stores it in FAISS.
        Call this when the application starts or periodically to refresh data.
        """
        # Fetch fresh data
        self.event_documents = self.fetch_event_data_readonly()
        
        if not self.event_documents:
            print("No events found in the database. Knowledge base is empty.")
            return

        print("Building Vector Knowledge Base...")
        # Convert text to vectors
        embeddings = self.embedding_model.encode(self.event_documents)
        
        # Clear existing index and add new vectors
        self.index.reset()
        self.index.add(np.array(embeddings).astype('float32'))
        print("Knowledge base built successfully!")

    def retrieve_context(self, question, top_k=3):
        """
        Searches the FAISS vector database for the most relevant events.
        """
        if self.index.ntotal == 0:
            return "No event data available in the knowledge base."

        # Convert the user's question into a vector
        question_vector = self.embedding_model.encode([question]).astype('float32')
        
        # Search FAISS for the top_k closest vectors
        distances, indices = self.index.search(question_vector, top_k)
        
        # Retrieve the actual text documents
        retrieved_docs = []
        for i in indices[0]:
            if i != -1 and i < len(self.event_documents):
                retrieved_docs.append(self.event_documents[i])
                
        # Combine the retrieved docs into one big string context
        return "\n\n---\n\n".join(retrieved_docs)

    def ask_question(self, question):
        """
        End-to-end pipeline: Retrieve context -> Generate answer.
        """
        # 1. Retrieve strict context from the Vector DB
        context = self.retrieve_context(question)

        # 2. Construct the prompt ensuring the AI ONLY uses the provided database context
        system_prompt = (
            "You are an AI assistant for an Event Management application's attendee module. "
            "Answer the attendee's questions using ONLY the provided event context. "
            "If the answer is not contained in the context, politely say 'I don't have that information'. "
            "Do not make up information. "
            "Keep replies short and polished: maximum 2 short sentences. "
            "If asked about one event, summarize in one compact line with: name, type, venue, date range, audience, and status. "
            "Do not output long bullet lists unless explicitly asked."
        )
        
        user_prompt = f"Context from Event Database:\n{context}\n\nAttendee Question: {question}"

        try:
            # 3. Generate the response using Gemini API
            if not self.gemini_api_key:
                return "Error: GEMINI_API_KEY is not set. Add it to your environment or .env file."

            full_prompt = f"{system_prompt}\n\n{user_prompt}"
            model_candidates = [self.gemini_model] + [
                m for m in self.gemini_fallback_models if m != self.gemini_model
            ]

            last_error = None
            for model_name in model_candidates:
                try:
                    model = genai.GenerativeModel(model_name)
                    result = model.generate_content(full_prompt)
                    answer = self._extract_response_text(result)
                    if answer:
                        return answer
                except Exception as model_error:
                    last_error = model_error
                    continue

            if last_error:
                return f"Error generating response: {str(last_error)}"
            return "I don't have that information"
        except Exception as e:
            return f"Error generating response: {str(e)}"
