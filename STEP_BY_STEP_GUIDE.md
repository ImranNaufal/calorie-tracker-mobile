# 📘 Project Guide: Building "Calz" – AI Health & Wellness Tracker

## Overview
This document serves as a detailed step-by-step guide for learners to understand how the "Calz" application was built. It covers integrating AI, cloud storage, hardware sensors, and building a high-fidelity UI.

---

## 🛠️ Phase 1: Environment & AI Integration

### Step 1: Setting up Gemini 2.0 Flash
The core intelligence of the app comes from Google's Gemini AI.
1.  **Generate API Key**: Obtained a key from [Google AI Studio](https://aistudio.google.com/).
2.  **Model Configuration**: Configured the app to use `gemini-2.0-flash` via the `v1beta` endpoint to support analyzing both food photos and text descriptions.
3.  **Implementation**:
    *   **Visual Analysis**: Created logic to convert images to Base64 and send them to Gemini to extract calorie and macro data.
    *   **Text Analysis**: Built a system for users to type activities (e.g., "30 min cycling"), which Gemini then translates into calorie burn estimates.

### Step 2: Environment Security
To handle sensitive keys safely:
1.  Used `react-native-dotenv` to keep API keys out of the main codebase logic.
2.  **Learner Tip**: When keys fail to update, running `npx expo start -c` clears the cache to force the app to recognize new environment variables.

---

## ☁️ Phase 2: Cloud Persistence with Firebase

### Step 3: Connecting Firestore Database
We moved from local state (which resets on close) to Firebase Firestore for 100% data persistence.
1.  **Setup**: Created a Firebase project `calz-app` and enabled Firestore in "Test Mode".
2.  **Collections Architecture**:
    *   `meals`: Stores every food item logged.
    *   `waterLogs`: Records every `250ml` (or custom) addition with a date stamp.
    *   `activityLogs`: Saves all exercise sessions.
    *   `weightHistory`: Tracks weight changes over time.
    *   `userSettings`: Persists global state like the **Fasting Timer** start time and **Weight Goals**.

### Step 4: Real-Time Synchronization
Instead of fetching data once, we used Firestore's `onSnapshot` listeners.
*   **Result**: If you add a meal on one device, it instantly appears on any other device logged into the same account without refreshing.

---

## 🧘 Phase 3: The "Wellness" Module (High-Fidelity UI)

### Step 5: Spec-Driven UI Development
We built a brand new "Wellness" tab based on a specific design language:
*   **Visual Style**: "Light Mode" aesthetics with soft rounded corners (`borderRadius: 24`), pastel backgrounds (`#FFEDF2`, `#E6F4FF`), and bold black typography.
*   **Interactive Carousel**: Created a horizontal scroll view for health tips.
    *   **Feature**: Tapping a card (e.g., "Benefits of Walking") opens a detailed modal with scientific facts and motivational quotes.

### Step 6: Hardware Sensor Integration
To make the step tracker "real," we integrated the device's physical sensors.
*   **Library**: `expo-sensors`.
*   **Platform Logic**:
    *   **iOS**: Queries historical step data for the day.
    *   **Android**: Uses a live Pedometer listener (`watchStepCount`) to update steps in real-time as the user walks while the app is open.

---

## 📅 Phase 4: Smart Tracking Logic

### Step 7: Date-Aware Data
To ensure the app resets tracking daily without deleting history:
1.  **Date Labels**: Every log is saved with a standardized label (e.g., "FRI 2").
2.  **Filtering**: The dashboard calculates totals (Water, Calories, Steps) by summing only the logs that match the **currently selected date** on the calendar strip.
3.  **Outcome**: Users can tap previous days to view history, while today always starts fresh.

---

## 🚀 Phase 5: Final Polish

### Step 8: Visual Polish & Assets
1.  **Screenshots**: Captured high-resolution screenshots of all 4 main modules (Home, Fasting, Weight, Wellness).
2.  **Documentation**: Compiled a comprehensive `README.md` for the GitHub repository, explaining the tech stack and setup instructions for future learners.

---

### 🎓 Key Takeaways
By building this project, we demonstrated:
*   **Multimodal AI**: Combining text and image inputs for health analysis.
*   **Full-Stack Mobile**: Connecting a React Native frontend to a serverless backend (Firebase).
*   **Hardware Access**: utilizing native device features (Pedometer) in a cross-platform environment.

---

