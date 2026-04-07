# Event Management Platform 🚀

A high-performance, real-time Event Management application built with the MERN stack. Designed with a premium "Command Center" aesthetic, it features real-time tactical communications, and role-based access control.

## ✨ Features

*   **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for Admins, Event Managers, Volunteers, Vendors, Clients, and Attendees.
*   **Real-Time Tactical Comms:** "WhatsApp-style" mission assignments using `Socket.io`. Volunteers receive high-priority mission alerts instantly.
<!-- *   **Offline Push Notifications:** Service Worker (`sw.js`) integration with `web-push` ensures volunteers receive native OS notifications (with sound and vibration) even when the browser tab is completely closed. -->
*   **QR Code Ticketing & Check-In:** Secure ticket generation and robust in-app QR scanning for fast attendee gate verification.
*   **OTP Email Verification:** Secure, token-free 6-digit OTP email authentication.
*   **Premium Glassmorphic UI:** Smooth, highly animated user interfaces built with React, Framer Motion, and Tailwind CSS.
*   **Responsive & PWA Ready:** Designed to work flawlessly on both desktop command stations and mobile devices in the field.

## 🛠️ Tech Stack

### Frontend (Client)
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS + Framer Motion
*   **Routing:** React Router DOM
*   **Tools:** HTML5-QRCode (Scanner), Axios, Socket.io-client

### Backend (Server)
*   **Runtime:** Node.js + Express
*   **Database:** MongoDB (Mongoose)
*   **Real-time:** Socket.io
*   **Security:** JWT (JSON Web Tokens), Bcrypt.js
*   **Email:** Nodemailer

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas Native URI)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/event-management.git
cd event-management
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `/server` directory and add the following configuration:
```env
NODE_ENV=development
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

# Email Configuration (for OTPs)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# Optional: Python NLP sentiment bridge
PYTHON_EXECUTABLE=d:/Event_Management_Try_Again/.venv/Scripts/python.exe
SENTIMENT_SCRIPT_PATH=d:/Event_Management_Try_Again/server/nlp/sentiment_ensemble.py
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 📱 Core Workflows

1.  **Event Generation:** Admins and Event Managers can create events, define sectors, and manage vendor resources.
2.  **Authentication:** Users register and receive a secure 6-digit OTP via email before gaining access to the platform.
3.  **Volunteer Synchronization:** Volunteers navigate to their dashboard and click **"Sync Alerts"** to bind their device to the push-notification command network.
4.  **Tactical Dispatch:** Managers assign "Missions" to volunteers. The system uses WebSockets for instant delivery or drops back to Service Worker native push notifications if the volunteer is offline.
5.  **Check-In Execution:** Volunteers use the built-in camera scanner on their mobile devices to decode attendee QR tickets at the gate.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License.
