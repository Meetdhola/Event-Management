import os
import re
import json
from pymongo import MongoClient
from bson import ObjectId
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import google.generativeai as genai
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

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
        self.db = self._resolve_database()
        print(f"Using MongoDB database for RAG: {self.db.name}")
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        
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

        self.category_keywords = {
            "Security": ["security", "guard", "safety", "bouncer", "emergency"],
            "Food": ["food", "catering", "snack", "beverage", "meal"],
            "Audio/Visual": ["audio", "visual", "speaker", "sound", "mic", "projector", "av"],
            "Logistics": ["logistics", "entry", "queue", "flow", "gate", "registration"],
            "Decor": ["decor", "theme", "ambience", "design", "lighting"],
            "Technical": ["technical", "power", "stage", "rig", "generator"]
        }

    def _resolve_database(self):
        preferred_db = os.getenv("MONGO_DB_NAME")
        if preferred_db:
            return self.client[preferred_db]

        try:
            default_db = self.client.get_default_database()
            if default_db is not None:
                return default_db
        except Exception:
            pass

        # Prefer a DB that actually has events collection with records.
        for db_name in self.client.list_database_names():
            if db_name in {"admin", "local", "config"}:
                continue
            candidate = self.client[db_name]
            if "events" in candidate.list_collection_names():
                if candidate["events"].count_documents({}) > 0:
                    return candidate

        # Fallbacks
        if "test" in self.client.list_database_names():
            return self.client["test"]
        return self.client["test"]

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

    def _event_date_str(self, value):
        if not value:
            return "N/A"
        return str(value)

    def _event_to_document(self, event):
        return (
            f"Event Name: {event.get('event_name', 'N/A')}\n"
            f"Event Type: {event.get('event_type', 'N/A')}\n"
            f"Description: {event.get('description', 'N/A')}\n"
            f"Venue: {event.get('venue', 'N/A')}\n"
            f"Start Date: {self._event_date_str(event.get('start_date'))}\n"
            f"End Date: {self._event_date_str(event.get('end_date'))}\n"
            f"Expected Audience: {event.get('expected_audience', 'N/A')}\n"
            f"Actual Audience: {event.get('actual_audience', 'N/A')}\n"
            f"Status: {event.get('status', 'N/A')}"
        )

    def _safe_object_id(self, event_id):
        try:
            return ObjectId(event_id)
        except Exception:
            return None

    def _critical_matrix(self, event_type):
        event_type = str(event_type or '').lower()
        base = ["Security", "Logistics", "Audio/Visual", "Technical"]
        if any(k in event_type for k in ["concert", "fest", "sports"]):
            return {"critical": base + ["Food"], "supporting": ["Decor"]}
        if any(k in event_type for k in ["conference", "seminar", "workshop"]):
            return {"critical": base, "supporting": ["Food"]}
        if "exhibition" in event_type:
            return {"critical": base + ["Food"], "supporting": ["Decor"]}
        return {"critical": base + ["Food"], "supporting": ["Decor"]}

    def _detect_intent(self, question):
        q = question.lower()
        if any(k in q for k in ["budget", "cost", "expense", "price"]):
            return "budget"
        if any(k in q for k in ["ready", "status", "optimize", "important", "missing", "remove", "improve", "add"]):
            return "readiness"
        return "resource"

    def _detect_category(self, question):
        q = question.lower()
        for category, words in self.category_keywords.items():
            if any(w in q for w in words):
                return category
        return None

    def _estimate_target_qty(self, category, expected_audience):
        audience = int(expected_audience or 500)
        if category == "Security":
            return max(1, int(np.ceil(audience / 120)))
        if category == "Food":
            return max(1, int(np.ceil(audience / 100)))
        if category == "Logistics":
            return max(1, int(np.ceil(audience / 250)))
        if category == "Decor":
            return max(1, int(np.ceil(audience / 300)))
        return 1

    def _cosine_similarities(self, query_embedding, chunk_embeddings):
        q = query_embedding / (np.linalg.norm(query_embedding) + 1e-12)
        c = chunk_embeddings / (np.linalg.norm(chunk_embeddings, axis=1, keepdims=True) + 1e-12)
        return np.dot(c, q)

    def retrieve_from_chunks(self, question, chunks, top_k=4):
        if not chunks:
            return [], 0.0

        embeddings = self.embedding_model.encode(chunks)
        query_embedding = self.embedding_model.encode([question])[0]
        scores = self._cosine_similarities(query_embedding, np.array(embeddings, dtype=np.float32))
        ranked_idx = np.argsort(-scores)[:max(1, min(top_k, len(chunks)))]
        selected = [chunks[i] for i in ranked_idx]
        best_score = float(scores[ranked_idx[0]]) if len(ranked_idx) else 0.0
        return selected, best_score

    def _compact_answer(self, text, max_sentences=3):
        parts = re.split(r'(?<=[.!?])\s+', (text or '').strip())
        parts = [p.strip() for p in parts if p.strip()]
        return " ".join(parts[:max_sentences]) if parts else "I don't have that information"

    def fetch_manager_event_context(self, event_id):
        oid = self._safe_object_id(event_id)
        if not oid:
            return None

        event = self.db["events"].find_one({"_id": oid})
        if not event:
            return None

        resources_collection = self.db["resources"]
        tasks_collection = self.db["tasks"]
        feedback_collection = self.db["feedbacks"]

        cart = event.get("logistics_cart", []) or []
        cart_ids = [item.get("resource") for item in cart if item.get("resource")]
        resource_docs = {
            r["_id"]: r for r in resources_collection.find({"_id": {"$in": cart_ids}})
        } if cart_ids else {}

        tasks = list(tasks_collection.find({"eventId": oid}))
        feedbacks = list(feedback_collection.find({"event_id": oid}))

        positive = neutral = negative = 0
        for f in feedbacks:
            comment = (f.get("comment") or "").strip()
            if not comment:
                continue
            score = self.sentiment_analyzer.polarity_scores(comment).get("compound", 0)
            if score > 0.15:
                positive += 1
            elif score < -0.15:
                negative += 1
            else:
                neutral += 1

        context_chunks = [self._event_to_document(event)]
        category_qty = {}
        for item in cart:
            rid = item.get("resource")
            quantity = int(item.get("quantity") or 0)
            res = resource_docs.get(rid)
            if not res:
                continue
            category = res.get("category", "Unknown")
            category_qty[category] = category_qty.get(category, 0) + quantity
            context_chunks.append(
                f"Logistics Item: {res.get('name', 'N/A')} | Category: {category} | Quantity: {quantity} | Unit Price: {res.get('base_price', 0)}"
            )

        planned_budget = float((event.get("budget") or {}).get("planned") or 0)
        est_spend = 0.0
        for item in cart:
            rid = item.get("resource")
            quantity = float(item.get("quantity") or 0)
            res = resource_docs.get(rid)
            est_spend += (float((res or {}).get("base_price") or 0) * quantity)

        completed_tasks = [t for t in tasks if str(t.get("status", "")).lower() == "completed"]
        context_chunks.append(
            f"Operations: Total Tasks: {len(tasks)} | Completed Tasks: {len(completed_tasks)} | Volunteers: {len(event.get('volunteers', []) or [])} | Vendors: {len(event.get('vendors', []) or [])}"
        )
        context_chunks.append(
            f"Feedback NLP Summary: Positive={positive}, Neutral={neutral}, Negative={negative}, Total={len(feedbacks)}"
        )
        context_chunks.append(
            f"Budget Summary: Planned={planned_budget:.2f}, EstimatedSpend={est_spend:.2f}, Utilization={(est_spend / planned_budget) if planned_budget > 0 else 0:.4f}"
        )

        return {
            "event": event,
            "category_qty": category_qty,
            "planned_budget": planned_budget,
            "estimated_spend": est_spend,
            "context_chunks": context_chunks
        }

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
        return self.ask_attendee_question(question)

    def ask_attendee_question(self, question):
        """
        End-to-end pipeline: Retrieve context -> Generate answer.
        """
        if self.index.ntotal == 0:
            self.build_knowledge_base()

        if self.index.ntotal == 0:
            return "No event data is available right now. Please check MongoDB connection and event records."

        # 1. Retrieve strict context from the Vector DB
        context = self.retrieve_context(question)

        # 2. Construct the prompt ensuring the AI ONLY uses the provided database context
        system_prompt = (
            "You are an AI assistant for an Event Management application's attendee module. "
            "Answer using ONLY provided context. "
            "If the answer is not in context, say exactly: 'I don't have that information'. "
            "Do not fabricate any details. "
            "Keep the answer balanced and concise: 2 to 4 short sentences. "
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
                        return self._compact_answer(answer, max_sentences=4)
                except Exception as model_error:
                    last_error = model_error
                    continue

            if last_error:
                return f"Error generating response: {str(last_error)}"
            return "I don't have that information"
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def ask_manager_question(self, question, event_id):
        manager_context = self.fetch_manager_event_context(event_id)
        if not manager_context:
            return {
                "message": "Event not found.",
                "action": None,
                "data": None,
                "confidence": "low"
            }

        event = manager_context["event"]
        chunks = manager_context["context_chunks"]
        retrieved, best_score = self.retrieve_from_chunks(question, chunks, top_k=4)

        if best_score < 0.22:
            return {
                "message": "I do not have enough grounded context for that request. Please ask about logistics, budget, readiness, or resources for this event.",
                "action": None,
                "data": None,
                "confidence": "low"
            }

        intent = self._detect_intent(question)
        matrix = self._critical_matrix(event.get("event_type"))
        category_qty = manager_context["category_qty"]
        covered = [c for c, q in category_qty.items() if int(q or 0) > 0]
        missing_critical = [c for c in matrix["critical"] if c not in covered]
        missing_supporting = [c for c in matrix["supporting"] if c not in covered]
        less_important = [c for c in covered if c not in matrix["critical"] and c not in matrix["supporting"]]
        done_critical = [c for c in matrix["critical"] if c in covered]

        readiness_score = min(100, (len([c for c in matrix["critical"] if c in covered]) * 18) + (15 if len(event.get("volunteers", []) or []) > 0 else 0) + (13 if len(event.get("vendors", []) or []) > 0 else 0))

        if intent == "budget":
            planned = manager_context["planned_budget"]
            spend = manager_context["estimated_spend"]
            utilization = (spend / planned) if planned > 0 else 0
            status = "ON_TRACK" if utilization <= 1 else "OVERRUN"
            return {
                "message": f"Budget utilization is {(utilization * 100):.1f}%. Planned: INR {planned:,.0f}; Estimated spend: INR {spend:,.0f}. Status: {status}.",
                "action": "BUDGET_SUMMARY",
                "data": {
                    "total": spend,
                    "variance": f"{(utilization * 100):.1f}",
                    "status": status
                },
                "confidence": "high"
            }

        if intent == "readiness":
            resources_collection = self.db["resources"]
            missing_all = missing_critical + missing_supporting
            optimization_plan = []

            for category in missing_all:
                matched_resource = resources_collection.find_one({"category": category, "is_available": True})
                if not matched_resource:
                    continue

                target = self._estimate_target_qty(category, event.get("expected_audience") or 0)
                current = int(category_qty.get(category, 0))
                needed = max(0, target - current)
                if needed <= 0:
                    continue

                optimization_plan.append({
                    "resourceId": str(matched_resource.get("_id")),
                    "resourceName": matched_resource.get("name", "resource"),
                    "category": category,
                    "needed": needed,
                    "target": target,
                    "reason": "Readiness gap auto-optimization"
                })

            action_type = "BULK_OPTIMIZE" if optimization_plan else "READINESS_UPDATE"
            optimized_payload = {
                "score": readiness_score,
                "missing": missing_critical,
                "done_critical": done_critical,
                "important_to_add": [f"{c} (critical)" for c in missing_critical] + [f"{c} (supporting)" for c in missing_supporting],
                "less_important_to_reduce": [f"{c} (lower priority)" for c in less_important],
                "optimization_plan": optimization_plan,
                "critical_parameter_gaps": [
                    "Expected audience missing" if not event.get("expected_audience") else None,
                    "Planned budget missing" if not (event.get("budget") or {}).get("planned") else None,
                    "No volunteers assigned" if len(event.get("volunteers", []) or []) == 0 else None,
                    "No vendors linked" if len(event.get("vendors", []) or []) == 0 else None
                ]
            }

            # Backward-compatible top-level fields for single-item execute handlers.
            if optimization_plan:
                first = optimization_plan[0]
                optimized_payload.update({
                    "resourceId": first.get("resourceId"),
                    "category": first.get("category"),
                    "needed": first.get("needed"),
                    "target": first.get("target"),
                    "reason": first.get("reason")
                })

            return {
                "message": (
                    f"Readiness is {readiness_score}%. Done (critical): {', '.join(done_critical) if done_critical else 'None'}. "
                    f"Left (critical/supporting): {', '.join(missing_critical + missing_supporting) if (missing_critical or missing_supporting) else 'None'}. "
                    f"Reduce/remove lower-priority categories: {', '.join(less_important) if less_important else 'None'}."
                ),
                "action": action_type,
                "data": optimized_payload,
                "confidence": "high"
            }

        category = self._detect_category(question) or (missing_critical[0] if missing_critical else None)
        if category:
            resources_collection = self.db["resources"]
            matched_resource = resources_collection.find_one({"category": category, "is_available": True})
            if matched_resource:
                target = self._estimate_target_qty(category, event.get("expected_audience") or 0)
                current = int(category_qty.get(category, 0))
                needed = max(0, target - current)
                if needed > 0:
                    return {
                        "message": f"For {category}, current quantity is {current} and estimated target is {target}. Recommended add: {needed} unit(s) of {matched_resource.get('name', 'resource')}.",
                        "action": "SUGGEST_RESOURCE",
                        "data": {
                            "resourceId": str(matched_resource.get("_id")),
                            "category": category,
                            "needed": needed,
                            "target": target,
                            "reason": "Python RAG optimization suggestion"
                        },
                        "confidence": "high"
                    }

        # Grounded fallback generation through LLM, constrained by retrieved context only.
        if not self.gemini_api_key:
            return {
                "message": "I can analyze readiness, budget, and resource optimization from current event context. Ask for readiness or budget to get actionable output.",
                "action": None,
                "data": None,
                "confidence": "medium"
            }

        prompt = (
            "You are an event-operations assistant. Use ONLY the provided retrieved context. "
            "If answer is not present, say: I don't have that information. "
            "Give concise but complete answer in 2 to 4 short sentences.\n\n"
            f"Retrieved Context:\n{chr(10).join(retrieved)}\n\n"
            f"Manager Question: {question}"
        )

        last_error = None
        for model_name in [self.gemini_model] + [m for m in self.gemini_fallback_models if m != self.gemini_model]:
            try:
                model = genai.GenerativeModel(model_name)
                result = model.generate_content(prompt)
                answer = self._extract_response_text(result)
                if answer:
                    return {
                        "message": self._compact_answer(answer, max_sentences=4),
                        "action": None,
                        "data": None,
                        "confidence": "medium"
                    }
            except Exception as model_error:
                last_error = model_error

        return {
            "message": f"Unable to generate response right now: {str(last_error) if last_error else 'Unknown error'}",
            "action": None,
            "data": None,
            "confidence": "low"
        }
