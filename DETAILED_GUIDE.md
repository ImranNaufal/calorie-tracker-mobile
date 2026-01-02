# 🚀 Building Calz: The Ultimate AI Health Tracker Guide

## Introduction
This documentation provides a comprehensive, step-by-step walkthrough for building **Calz**, a high-fidelity mobile application powered by Artificial Intelligence. This project demonstrates how to combine **React Native (Expo)**, **Google Gemini 2.0**, **Firebase Cloud Storage**, and **Device Sensors** into a single, cohesive product.

---

## 🛠️ Phase 1: Setting Up the Environment

### Step 1: Initialize the Project
We start by creating a robust React Native environment using Expo, which simplifies mobile development.
*   **Command**: `npx create-expo-app@latest calorie-tracker-mobile --template blank-typescript`
*   **Why**: TypeScript ensures our code is safe and less prone to bugs.

### Step 2: Install Essential Libraries
We need specific tools to give our app superpowers.
*   **AI & Logic**: `npm install @google/generative-ai react-native-dotenv`
*   **UI Components**: `npm install lucide-react-native react-native-svg react-native-chart-kit`
*   **Sensors**: `npx expo install expo-sensors expo-camera expo-image-picker`
*   **Database**: `npx expo install firebase`

---

## 🧠 Phase 2: Integrating AI Vision (Gemini 2.0)

### Step 3: Configuring the AI Model
We don't want basic text analysis; we want our app to "see".
1.  **Get API Key**: We generated a key from Google AI Studio.
2.  **Configuration**: We set up the model to use `gemini-2.0-flash`. This version is critical because it is **multimodal**—it understands images and text simultaneously.

### Step 4: Building the "Analyze Food" Feature
We created a function called `analyzeFood` that performs three actions:
1.  **Capture**: Takes a photo using `expo-camera`.
2.  **Convert**: Transforms the image into a Base64 string (a text format representing the image).
3.  **Prompt**: Sends the image to Gemini with the instruction: *"Analyze this food and return a JSON object with calories and macros."*

---

## ☁️ Phase 3: Cloud Persistence (Firebase)

### Step 5: Setting up the Database
Local data is temporary; we wanted permanent history.
1.  **Project Creation**: We set up a project in the Firebase Console.
2.  **Firestore**: We enabled the Firestore Database in "Test Mode" for immediate read/write access.

### Step 6: Creating the Sync Engine
We didn't just save data; we synchronized it.
*   **The Listener**: We implemented `onSnapshot` inside a `useEffect` hook.
*   **How it works**: The app opens a live channel to Firebase. Whenever the database changes (even from another device), our app updates the UI instantly. We applied this to **Meals**, **Water Logs**, **Activities**, and **Weight History**.

---

## 🎨 Phase 4: Building the "Wellness" UI

### Step 7: Designing "Light Mode" Aesthetics
We moved away from standard dark modes to a fresh, pastel-driven design.
*   **Color Palette**: We defined constants for Soft Pink (`#FFEDF2`), Periwinkle (`#E6F4FF`), and Mint (`#F6FFED`).
*   **Shapes**: We applied `borderRadius: 24` to all cards to give them a friendly, modern feel.

### Step 8: The Interactive Carousel
We built a horizontal scroll view for health tips.
*   **Logic**: Instead of static text, we made each card touchable.
*   **Detail View**: Tapping a card opens a high-fidelity modal that dynamically loads a specific "Did You Know?" fact and a "Motivation" quote for that topic.

---

## 🏃 Phase 5: Hardware & Sensors

### Step 9: Real-Time Step Tracking
We wanted the app to feel alive.
*   **iOS Logic**: We used `Pedometer.getStepCountAsync` to fetch history.
*   **Android Logic**: Since Android restricts history access, we implemented `Pedometer.watchStepCount`. This acts as a live listener that updates the step counter in real-time as the user walks while the app is open.

---

## 📅 Phase 6: Intelligent Data Management

### Step 10: The "Date-Aware" System
A health tracker must reset daily without deleting past data.
1.  **Labeling**: We saved every single log with a `dateLabel` (e.g., "FRI 2").
2.  **Filtering**: On the dashboard, we wrote logic to `filter()` the global list. It only sums up calories and water for the **selected date**.
3.  **Result**: When the clock hits midnight, the "Today" filter finds no new logs, automatically showing "0" for the new day, while yesterday's data remains safe in the cloud.

---

## 🎓 Conclusion
By following these steps, we built **Calz**—not just a prototype, but a production-ready application that sees, remembers, and tracks your health in real-time.

