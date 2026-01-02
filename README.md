# 🥗 Calz - AI Calorie & Wellness Tracker

A modern, high-fidelity mobile application that uses **Google Gemini 2.0 Flash (Multimodal AI)** to analyze food images and activity text in real-time. Built with **React Native (Expo)** and **Firebase**, it features a wellness dashboard for tracking hydration, steps (via hardware sensors), and weight goals.

---

## 🚀 Tech Stack

- **AI & ML:** Google Gemini 2.0 Flash (via `v1beta` API) for multimodal analysis (Image & Text).
- **Frontend:** React Native (Expo SDK 52) with TypeScript.
- **Backend / Persistence:** Firebase Firestore (NoSQL Real-time Database).
- **Hardware Integration:** `expo-sensors` (Pedometer), `expo-camera` (Image Capture).
- **UI/UX:** Custom "Light Mode" design system with rounded cards, pastel accents, and haptic feedback.

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/calz-tracker.git
cd calorie-tracker-mobile
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env` file in the root directory. You will need a Google Gemini API Key and Firebase Configuration.
```env
# AI Service
GEMINI_API_KEY=your_google_ai_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the App
Start the Expo development server.
```bash
npx expo start -c
```
*Note: The `-c` flag clears the cache, ensuring environment variables are loaded correctly.*

---

## 🏗️ Architecture: How It Works

### The "Magic" of Multimodal Analysis
Instead of training a custom ML model, Calz acts as a structured client for Google's Gemini 2.0 Flash model.

1.  **Image Capture:** The user snaps a photo using `expo-camera`.
2.  **Preprocessing:** The app converts the image to a Base64 string.
3.  **Prompt Engineering:** We send a strict system prompt to the AI:
    > "Analyze this image. Return ONLY raw JSON with keys: `food_name`, `calories`, and `macros` ({protein, carbs, fat})."
4.  **Response Parsing:** The app receives the JSON string, parses it, and immediately hydrates the UI state.
5.  **Persistence:** The verified data is written to a `meals` collection in Firestore, triggering a real-time update on all connected devices.

---

## 📱 How to Use

1.  **Scan a Meal:** Tap the **"+"** button on the Home tab. Select "Photo" mode and snap a picture of your food. The AI will auto-fill the nutrition data.
2.  **Track Wellness:** Switch to the **Wellness** tab to log water intake or view your real-time step count (synced with your device's pedometer).
3.  **Monitor Progress:** Use the **Weight** tab to log your weight and view your progress against your goal on the interactive chart.

---

## 📄 License
This project is open-source and available under the MIT License.
