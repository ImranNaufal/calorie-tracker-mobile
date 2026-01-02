# Calz: AI Calorie & Wellness Tracker

A high-fidelity mobile application built with **Expo (React Native)**, **Google Gemini 2.0 Flash**, and **Firebase**. This app demonstrates how to combine multimodal AI with real-time cloud persistence and device hardware sensors to create a modern health experience.

---

## 🚀 Features

### 1. AI-Powered Food Analysis
- **Multimodal AI**: Snap a photo of your meal, and **Gemini 2.0 Flash** analyzes the image to estimate calories and macros (Protein, Carbs, Fats) instantly.
- **Smart Logic**: Supports voice/text descriptions as an alternative to photos.

### 2. Wellness Module (Spec-Driven)
- **Real Step Tracking**: Integrates with the device's **Pedometer** (`expo-sensors`) for real-time daily movement tracking.
- **AI Activity Tracker**: Describe your exercise (e.g., *"45 min cycling"*) and Gemini estimates the caloric burn.
- **Interactive Carousel**: Horizontal scroll of health tips with detailed **Did You Know?** facts and motivational content.
- **Water Tracker**: Cloud-synced water intake tracker with a custom scroll-picker UI.

### 3. Smart Fasting & Weight Tracking
- **Persistent Fasting**: A live fasting timer that stays running even if the app is closed.
- **Weight Progress**: Interactive line charts showing weight history and goal progress.

### 4. Real-time Cloud Storage
- **Firebase Firestore**: All data (Meals, Water, Activities, Weight, Fasting) is synced to the cloud in real-time.
- **Cross-Session Persistence**: Your data survives app restarts and device reboots.

---

## 🛠️ Technical Stack

- **Framework**: Expo (React Native)
- **AI**: Google Gemini 2.0 Flash (via `v1beta` API)
- **Database**: Firebase Firestore
- **Sensors**: Expo Pedometer (Hardware motion tracking)
- **UI**: Lucide Icons, React Native Chart Kit, Custom Pastel Light Mode Design

---

## 📖 Setup Guide for Learners

### 1. Prerequisites
- Node.js installed
- Expo Go app on your phone (for testing hardware sensors like Pedometer)

### 2. Environment Configuration
Create a `.env` file in the root directory and add your keys (keep these secret in production!):

```env
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Installation & Run
```bash
npm install
npx expo start -c
```

---

## 🛡️ Important Note on Keys
The keys are currently managed via `FORCED_GEMINI_KEY` inside `App.tsx` to bypass local environment caching issues. For a real production app, ensure these are moved entirely to secure environment variables.

---

## 📸 Screenshots

*(Add your high-resolution screenshots here to showcase the high-fidelity Wellness UI!)*

---

**Developed with ❤️ for health enthusiasts.**

