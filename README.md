# 🎵 Moodify — Facial Mood-Based Music Recommendation System

A Node.js web application that detects your facial expression in real-time
and recommends Spotify songs that match your current mood.

---

## 🧠 How It Works

1. The webcam captures the user's face via the browser using **face-api.js**
2. Facial expressions are analyzed client-side to predict the dominant emotion
   (happy, sad, angry, surprised, neutral, fearful, disgusted)
3. The detected emotion is mapped to a music mood category
4. The **Spotify Web API** fetches and recommends songs matching that mood
5. Results are rendered on an Express.js-powered web page

![WhatsApp Image 2026-03-25 at 7 32 35 PM](https://github.com/user-attachments/assets/1a2505de-f9ca-4431-8da8-0ac052d0e3bb)

---

## 🛠️ Tech Stack

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Backend          | Node.js, Express.js               |
| Face Detection   | face-api.js (TensorFlow.js)       |
| Music API        | Spotify Web API                   |
| Frontend         | HTML, CSS, JavaScript (EJS)       |
| Auth             | Spotify OAuth 2.0 (PKCE)          |
| Database         | MongoDB / SQLite                  |

---

## 📁 Project Structure
```
moodify/
│
├── server.js                  # Main Express application
├── routes/
│   ├── auth.js                # Spotify OAuth routes
│   ├── spotify.js             # Spotify API routes
│   └── mood.js                # Mood detection routes
│
├── controllers/
│   ├── spotifyController.js   # Fetch recommendations
│   └── moodController.js      # Emotion-to-mood mapping
│
├── public/
│   ├── js/
│   │   ├── faceDetection.js   # face-api.js webcam logic
│   │   └── main.js
│   ├── css/
│   │   └── style.css
│   └── models/                # face-api.js model weights
│
├── views/
│   ├── index.ejs
│   ├── result.ejs
│   └── history.ejs
│
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/moodify.git
cd moodify
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=your_session_secret
PORT=3000
```

> Get your Spotify credentials from the
> [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

### 4. Download face-api.js models
```bash
mkdir -p public/models
```

Download the model weights from the
[face-api.js models repo](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
and place them in `public/models/`.

### 5. Run the application
```bash
# Development
npm run dev

# Production
npm start
```

Visit `http://localhost:3000` in your browser.

---

## 🎭 Emotion-to-Mood Mapping

| Detected Emotion | Music Mood     | Spotify Seed Genre     |
|------------------|----------------|------------------------|
| Happy            | Upbeat / Party | pop, dance             |
| Sad              | Melancholic    | acoustic, indie        |
| Angry            | Intense        | rock, metal            |
| Neutral          | Chill          | lo-fi, ambient         |
| Surprised        | Energetic      | edm, electronic        |
| Fearful          | Calming        | classical, sleep        |
| Disgusted        | Dark / Moody   | alternative, grunge    |

---

## 📦 Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "express-session": "^1.17.3",
    "face-api.js": "^0.22.2",
    "mongoose": "^7.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🚀 Features

- 🎥 Real-time facial emotion detection via browser webcam
- 🎧 Spotify song recommendations based on detected mood
- 🔐 Spotify OAuth 2.0 (PKCE) authentication
- 📜 Session-based recommendation history
- 🌐 Clean, responsive EJS-rendered UI

---

## 📸 Screenshots



<img width="1188" height="788" alt="image" src="https://github.com/user-attachments/assets/d55a0da8-6e15-494d-abc4-4c03a629ce97" />

<img width="1237" height="668" alt="image" src="https://github.com/user-attachments/assets/438a34e8-ea29-4c08-90f9-d86e2a902c26" />

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue
first to discuss what you'd like to change.

---

## 📄 License

[MIT](LICENSE)

---
