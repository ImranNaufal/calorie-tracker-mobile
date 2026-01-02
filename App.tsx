import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform, Vibration, Modal, Animated, Easing, TextInput, FlatList, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pedometer } from 'expo-sensors';
const FileSystem = require('expo-file-system/legacy');
import { StatusBar } from 'expo-status-bar';
import { db } from './lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where, getDocs } from "firebase/firestore";
import DateTimePicker from '@react-native-community/datetimepicker';
import ScrollPicker from 'react-native-wheel-scrollview-picker';
import LineChart from 'react-native-chart-kit/dist/line-chart/LineChart';
import { Plus, Activity, Zap, Droplets, Camera, Flame, Home, User, ScanLine, ChevronRight, Settings, Target, Ruler, Weight, PawPrint, Utensils, Heart, Scale, Scan, X, Crown, Clover, Rabbit, Rat, Carrot, Info, Apple, Image as ImageIcon, Barcode, Mic, Wheat, Beef, Trash2, Save, ChevronLeft, Citrus, Egg, Nut, Circle, MoreVertical, ArrowRight, Calendar } from 'lucide-react-native';
// ==========================================
// 🔑 CONFIGURATION: FORCED KEY
// ==========================================
const FORCED_GEMINI_KEY = "AIzaSyD-LR7FFnuRXShT8YFuiPpD7aUn6DnOy_I"; 
// ==========================================

import { GEMINI_API_KEY as ENV_KEY } from '@env';
const GEMINI_API_KEY = FORCED_GEMINI_KEY || ENV_KEY;
interface Meal {
  id: string;
  name: string;
  calories: number;
  macros: { protein: number; carbs: number; fat: number; };
  image: string;
  dateLabel: string;
}

const MOCK_HISTORY: Meal[] = [
  { id: '1', name: 'Oatmeal & Berries', calories: 350, macros: {protein: 12, carbs: 45, fat: 6}, image: 'https://via.placeholder.com/100', dateLabel: 'SUN 28' },
  { id: '2', name: 'Grilled Chicken', calories: 550, macros: {protein: 45, carbs: 10, fat: 20}, image: 'https://via.placeholder.com/100', dateLabel: 'SUN 28' },
  { id: '3', name: 'Salmon Salad', calories: 600, macros: {protein: 40, carbs: 15, fat: 25}, image: 'https://via.placeholder.com/100', dateLabel: 'MON 29' },
  { id: '4', name: 'Pasta Primavera', calories: 800, macros: {protein: 20, carbs: 90, fat: 15}, image: 'https://via.placeholder.com/100', dateLabel: 'TUE 30' },
  { id: '5', name: 'Steak & Veggies', calories: 750, macros: {protein: 60, carbs: 20, fat: 30}, image: 'https://via.placeholder.com/100', dateLabel: 'WED 31' },
];

const getCalendarDays = () => {
  const days = [];
  const today = new Date();
  for (let i = -4; i <= 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: d.getDate().toString(),
      fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).toUpperCase(),
      isToday: i === 0,
      isFuture: i > 0
    });
  }
  return days;
};

export default function App() {
  // --- STATE ---
  const [meals, setMeals] = useState<Meal[]>(MOCK_HISTORY);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showAppearance, setShowAppearance] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showFastingPlan, setShowFastingPlan] = useState(false);
  const [showFastStartModal, setShowFastStartModal] = useState(false);
  const [showEndFastModal, setShowEndFastModal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  
  // Fasting State
  const [isFasting, setIsFasting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('16:8');
  const [fastStartTime, setFastStartTime] = useState<Date | null>(null);
  const [timerString, setTimerString] = useState("00:00:00");

  // Picker State
  const [showPicker, setShowPicker] = useState(false); 
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(new Date());
  const [selHour, setSelHour] = useState(new Date().getHours());
  const [selMin, setSelMin] = useState(new Date().getMinutes());
  const dateList = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 15 + i);
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: d };
  });
  const [selDateIdx, setSelDateIdx] = useState(15);
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Weight State
  const [weightHistory, setWeightHistory] = useState([
    { id: '1', weight: 74.5, date: '28 Dec', change: '' },
    { id: '2', weight: 75.0, date: '01 Jan', change: '+0.5' },
  ]);
  const [weightUnit, setWeightUnit] = useState('Days');
  const [weightGoal, setWeightGoal] = useState(75.0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [showWeightMenu, setShowWeightMenu] = useState(false);
  const [showEditWeightModal, setShowEditWeightModal] = useState(false);
  const [editingWeightEntry, setEditingWeightEntry] = useState<any>(null);
  const [selWeightWhole, setSelWeightWhole] = useState(75);
  const [selWeightFraction, setSelWeightFraction] = useState(0);
  const [weightPhoto, setWeightPhoto] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(new Date());
  const [pickerOwner, setPickerOwner] = useState<'fasting' | 'weight'>('fasting');

  const calculateDynamicTargets = (currentW: number, goalW: number) => {
    // Mifflin-St Jeor for Male (Prototype default: Age 25, Height from profile)
    const bmr = (10 * currentW) + (6.25 * userProfile.height) - (5 * 25) + 5;
    const tdee = bmr * 1.5; // Moderate activity factor
    
    let targetCals = Math.round(tdee);
    if (goalW < currentW) targetCals -= 500; // Weight loss deficit
    else if (goalW > currentW) targetCals += 500; // weight gain surplus
    
    const targetProtein = Math.round(currentW * 2); // 2g per kg
    return { calories: targetCals, protein: targetProtein };
  };

  const openEditWeight = (entry: any) => {
    const [whole, fraction] = entry.weight.toString().split('.');
    setSelWeightWhole(parseInt(whole));
    setSelWeightFraction(parseInt(fraction || '0'));
    setEditingWeightEntry(entry);
    // Note: Parsing the date back from '01 Jan' format is tricky, 
    // so we'll default the picker to today or keep original date if we stored it as Date.
    // For now, let's keep the logic simple.
    setShowEditWeightModal(true);
  };

  const deleteWeightEntry = () => {
    if (!editingWeightEntry) return;
    setWeightHistory(prev => prev.filter(h => h.id !== editingWeightEntry.id));
    setShowEditWeightModal(false);
    Vibration.vibrate(50);
  };

        const saveWeightEdit = () => {
          if (!editingWeightEntry) return;
          const val = parseFloat(`${selWeightWhole}.${selWeightFraction}`);
          setWeightHistory(prev => prev.map(h => 
            h.id === editingWeightEntry.id 
              ? { ...h, weight: val, date: logDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) } 
              : h
          ));
          
          // Update profile based on the latest history entry
          const latestWeight = weightHistory[weightHistory.length - 1]?.id === editingWeightEntry.id ? val : weightHistory[weightHistory.length - 1].weight;
          const targets = calculateDynamicTargets(latestWeight, weightGoal);
          setUserProfile(prev => ({ ...prev, weight: latestWeight, ...targets }));
          
          setShowEditWeightModal(false);
          Vibration.vibrate(20);
        };
    
        const weightWholeList = Array.from({ length: 200 }, (_, i) => (i + 30).toString());
        const weightFractionList = Array.from({ length: 10 }, (_, i) => i.toString());
    
        const submitWeight = async () => {
          const val = parseFloat(`${selWeightWhole}.${selWeightFraction}`);
          if (!val) return;
          
          const lastWeight = weightHistory[weightHistory.length - 1]?.weight || val;
          const diff = val - lastWeight;
          const changeStr = diff === 0 ? '' : (diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`);
    
          const newEntry = {
            weight: val,
            date: logDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
            timestamp: Date.now(),
            change: changeStr
          };
    
          await addDoc(collection(db, "weightHistory"), newEntry);
          
          // Also update profile local weight for immediate UI feedback (though snapshot will handle it)
          const targets = calculateDynamicTargets(val, weightGoal);
          await addDoc(collection(db, "userSettings"), { 
            type: 'profile', 
            profile: { ...userProfile, weight: val, ...targets },
            updatedAt: Date.now()
          });

          setShowWeightModal(false);
          setLogDate(new Date());
          Vibration.vibrate(50);
        };
          
            // Character / Common
  const [selectedChar, setSelectedChar] = useState('quacky');
  const [scanMode, setScanMode] = useState<'describe' | 'photo' | 'manual'>('photo');
  
  // --- WELLNESS STATE ---
  const [waterLogs, setWaterLogs] = useState<{ dateLabel: string, amount: number }[]>([]);
  const [waterGoal] = useState(2500);
  const [stepsLogs, setStepsLogs] = useState<{ dateLabel: string, count: number }[]>([]);
  const [stepsGoal] = useState(10000);
  const [activityLogs, setActivityLogs] = useState<{ dateLabel: string, calories: number }[]>([]);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [healthConnectEnabled, setHealthConnectEnabled] = useState(false);
  const [showAddWater, setShowAddWater] = useState(false);
  const [showStepTracker, setShowStepTracker] = useState(false);
  const [showActivityList, setShowActivityList] = useState(false);
  const [showLogDuration, setShowLogDuration] = useState(false);
  const [showTipDetail, setShowTipDetail] = useState(false);
  const [selectedTip, setSelectedTip] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selWaterVolume, setSelWaterVolume] = useState(250);
  const [selDurationHour, setSelDurationHour] = useState(0);
  const [selDurationMin, setSelDurationMin] = useState(30);
  const [activityDescription, setActivityDescription] = useState("");

  const [userProfile, setUserProfile] = useState({ calories: 2155, protein: 180, weight: 75, height: 180 });
  const [describeText, setDescribeText] = useState('');
  const [manualData, setManualData] = useState({ calories: '', protein: '', carbs: '', fat: '', name: '' });

  // --- REFS & ANIMATIONS ---
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // --- DYNAMIC DATA ---
  const calendarDays = getCalendarDays();
  const currentDayLabel = calendarDays.find(d => d.isToday)?.fullLabel || 'THU 1';
  const [selectedDate, setSelectedDate] = useState(currentDayLabel);
  const currentMeals = meals.filter(m => m.dateLabel === selectedDate);
  const totals = currentMeals.reduce((acc, meal) => ({ calories: acc.calories + meal.calories, protein: acc.protein + meal.macros.protein, carbs: acc.carbs + meal.macros.carbs, fat: acc.fat + meal.macros.fat, }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  
  const today = new Date();
  const dateTitle = today.toLocaleDateString('en-US', { month: 'long', year: '2-digit' }).replace(' ', " '"); 
  const daySubtitle = today.toLocaleDateString('en-US', { weekday: 'long' });

  const isGoalReached = totals.calories >= userProfile.calories;
  const fillPct = Math.min((totals.calories / userProfile.calories) * 100, 100);
  const liquidColor = isGoalReached ? '#fbbf24' : '#bae6fd'; 
  const backLiquidColor = isGoalReached ? '#fcd34d' : '#7dd3fc';

  const getPlanHours = (p: string) => { const parts = p.split(':').map(Number); return { fasting: parts[0] || 16, eating: parts[1] || 8 }; };
  const plan = getPlanHours(selectedPlan);

  // --- EFFECTS ---
  useEffect(() => { startBreathing(); startBlinking(); startFabBounce(); startWaving(); }, []);

  // --- FIREBASE SYNC EFFECT ---
  useEffect(() => {
    // 1. Sync Meals
    const qMeals = query(collection(db, "meals"), orderBy("id", "desc"));
    const unsubMeals = onSnapshot(qMeals, (snapshot) => {
      const loadedMeals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Meal));
      if (loadedMeals.length > 0) setMeals(loadedMeals);
    });

    // 2. Sync Water Logs
    const qWater = query(collection(db, "waterLogs"));
    const unsubWater = onSnapshot(qWater, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as { dateLabel: string, amount: number });
      setWaterLogs(logs);
    });

    // 3. Sync Activity Logs
    const qActivity = query(collection(db, "activityLogs"));
    const unsubActivity = onSnapshot(qActivity, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as { dateLabel: string, calories: number });
      setActivityLogs(logs);
    });

    // 4. Sync Weight History
    const qWeight = query(collection(db, "weightHistory"), orderBy("timestamp", "asc"));
    const unsubWeight = onSnapshot(qWeight, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (history.length > 0) setWeightHistory(history);
    });

    // 5. Sync User Settings (Fasting, Weight Goal, Profile)
    const qSettings = query(collection(db, "userSettings"), orderBy("updatedAt", "asc"));
    const unsubSettings = onSnapshot(qSettings, (snapshot) => {
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'fasting') {
          setIsFasting(data.isFasting);
          if (data.startTime) setFastStartTime(new Date(data.startTime));
        }
        if (data.type === 'weightGoal') {
          setWeightGoal(data.value);
        }
        if (data.type === 'profile') {
          setUserProfile(data.profile);
        }
      });
    });

    return () => {
      unsubMeals();
      unsubWater();
      unsubActivity();
      unsubWeight();
      unsubSettings();
    };
  }, []);

  // --- STEP TRACKING EFFECT ---
  useEffect(() => {
    let subscription: any = null;

    const subscribe = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(String(isAvailable));

      if (isAvailable) {
        // Initial check: Android doesn't support getStepCountAsync for ranges easily
        // We will rely on watchStepCount for live tracking and 
        // maybe later implement a more complex native module for history.
        if (Platform.OS === 'ios') {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          
          try {
            const result = await Pedometer.getStepCountAsync(start, end);
            if (result) {
              setStepsLogs(prev => {
                const others = prev.filter(l => l.dateLabel !== currentDayLabel);
                return [...others, { dateLabel: currentDayLabel, count: result.steps }];
              });
            }
          } catch (e) {
            console.log("Pedometer query error:", e);
          }
        }

        // Subscribe to live updates (Supported on both Android & iOS)
        subscription = Pedometer.watchStepCount(result => {
          setStepsLogs(prev => {
            const todayLog = prev.find(l => l.dateLabel === currentDayLabel);
            const others = prev.filter(l => l.dateLabel !== currentDayLabel);
            // On Android, watchStepCount gives steps since the subscription started
            // We increment the current state to reflect real-time movement
            return [...others, { dateLabel: currentDayLabel, count: (todayLog?.count || 0) + result.steps }];
          });
        });
      }
    };

    subscribe();
    return () => subscription && subscription.remove();
  }, [currentDayLabel]);

  const startFabBounce = () => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(fabAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }), Animated.timing(fabAnim, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(fabAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }), Animated.timing(fabAnim, { toValue: 1, duration: 150, useNativeDriver: true })])).start(); };
  const startBreathing = () => { Animated.loop(Animated.sequence([Animated.timing(floatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])).start(); };
  const startBlinking = () => { const blink = Animated.sequence([Animated.timing(blinkAnim, { toValue: 0.1, duration: 100, useNativeDriver: true }), Animated.timing(blinkAnim, { toValue: 1, duration: 100, useNativeDriver: true })]); const loopBlink = () => { setTimeout(() => { blink.start(() => loopBlink()); }, Math.random() * 3000 + 2000); }; loopBlink(); };
  const startWaving = () => { Animated.loop(Animated.sequence([Animated.timing(waveAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }), Animated.timing(waveAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false })])).start(); };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (isFasting && fastStartTime) {
        const fastingDurationMs = plan.fasting * 3600000;
        const targetEndTime = new Date(fastStartTime.getTime() + fastingDurationMs);
        const diff = targetEndTime.getTime() - now.getTime();
        if (diff <= 0) { setTimerString("00:00:00"); } 
        else {
          const h = Math.floor(diff / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimerString(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      } else {
        const target = new Date(); target.setHours(9 + plan.eating, 0, 0, 0); if (now > target) target.setDate(target.getDate() + 1);
        const diff = target.getTime() - now.getTime();
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimerString(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [plan.eating, plan.fasting, isFasting, fastStartTime]);

  // --- LOGIC ---
  const startFasting = async (startTime: Date) => { 
    setFastStartTime(startTime); 
    setIsFasting(true); 
    Vibration.vibrate(50); 
    setShowFastStartModal(false); 
    
    await addDoc(collection(db, "userSettings"), { 
      type: 'fasting', 
      isFasting: true, 
      startTime: startTime.toISOString(),
      updatedAt: Date.now()
    });
  };
  const toggleFast = () => { if (isFasting) { setShowEndFastModal(true); } else { setShowFastStartModal(true); } };
  const handleAddMeal = async () => { setScanMode('photo'); if (!permission?.granted) { const { granted } = await requestPermission(); if (!granted) { Alert.alert("Camera Permission", "Required."); return; } } setShowCamera(true); };
  const takePicture = async () => { if (cameraRef.current) { Vibration.vibrate(10); try { const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: false }); if (photo?.uri) { setShowCamera(false); analyzeFood({ uri: photo.uri }); } } catch (e) { console.error("Camera Error:", e); } } };
  const pickFromGallery = async () => { setShowCamera(false); try { let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, quality: 0.5 } as any); if (!result.canceled) analyzeFood({ uri: result.assets[0].uri }); } catch (error) { console.error("Error picking image:", error); } };
  const submitDescription = () => { if (!describeText.trim()) return; setShowCamera(false); analyzeFood({ text: describeText }); setDescribeText(''); };
  const submitManual = () => { const cals = parseInt(manualData.calories)||0; if(cals===0) return; setShowCamera(false); const newMeal: Meal = { id: Date.now().toString(), name: manualData.name.trim() || "Manual Entry", calories: cals, macros: { protein: parseInt(manualData.protein)||0, carbs: parseInt(manualData.carbs)||0, fat: parseInt(manualData.fat)||0 }, image: 'https://via.placeholder.com/100', dateLabel: currentDayLabel }; setMeals(prev => [newMeal, ...prev]); Vibration.vibrate(50); setManualData({calories:'', protein:'', carbs:'', fat:'', name: ''}); };
  
  const analyzeFood = async (input: { uri?: string, text?: string }) => {
    setLoading(true); setActiveTab('home'); setSelectedDate(currentDayLabel);
    try {
      let requestBody;
      if (input.uri) { const base64 = await FileSystem.readAsStringAsync(input.uri, { encoding: 'base64' }); requestBody = { contents: [{ parts: [{ text: "Analyze food image. Return raw JSON: { \"food_name\": \"string\", \"calories\": number, \"macros\": { \"protein\": number, \"carbs\": number, \"fat\": number } }." }, { inline_data: { mime_type: "image/jpeg", data: base64 } }] }] }; } 
      else if (input.text) { requestBody = { contents: [{ parts: [{ text: `Analyze food: "${input.text}". Return raw JSON: { \"food_name\": \"string\", \"calories\": number, \"macros\": { \"protein\": number, \"carbs\": number, \"fat\": number } }.` }] }] }; } 
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      
      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error?.message || `Error ${res.status}`);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("AI returned empty response");

      const data = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
      const newMeal = { name: data.food_name, calories: data.calories, macros: data.macros, image: input.uri || 'https://via.placeholder.com/100', dateLabel: currentDayLabel };
      
      await addDoc(collection(db, "meals"), { ...newMeal, id: Date.now().toString() });
      Vibration.vibrate(50);
    } catch (e: any) { 
      console.error("Food Analysis Error:", e);
      Alert.alert("AI Error", e.message || "Failed to analyze food."); 
    } finally { 
      setLoading(false); 
    }
  };

  const analyzeActivity = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const requestBody = { 
        contents: [{ 
          parts: [{ text: `Estimate calories burned for this activity description: "${text}". Consider the duration if mentioned. Return ONLY raw JSON: { "activity_name": "string", "calories_burned": number }.` }] 
        }] 
      };
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(requestBody) 
      });

      if (!res.ok) {
        const errorJson = await res.json();
        const msg = errorJson.error?.message || `Error ${res.status}`;
        throw new Error(msg);
      }

      const json = await res.json();
      const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("AI returned an empty response. This might be due to safety filters.");
      }

      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      await addDoc(collection(db, "activityLogs"), { dateLabel: selectedDate, calories: data.calories_burned || 0 });
      setShowActivityList(false);
      setActivityDescription(""); 
      Vibration.vibrate(50);
    } catch (e: any) { 
      console.error("Activity Analysis Error:", e);
      Alert.alert("Activity Error", e.message || "Something went wrong."); 
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (meal: Meal) => { setEditingMeal({...meal}); setShowEdit(true); };
  const saveEdit = () => { if (!editingMeal) return; setMeals(prev => prev.map(m => m.id === editingMeal.id ? editingMeal : m)); setShowEdit(false); Vibration.vibrate(20); };
  const deleteMeal = () => { if (!editingMeal) return; setMeals(prev => prev.filter(m => m.id !== editingMeal.id)); setShowEdit(false); Vibration.vibrate(50); };

  // --- RENDER HELPERS ---
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const scaleBird = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const waveTranslate = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });

  const renderBird = () => (<Animated.View style={[styles.birdPlaceholder, { transform: [{ translateY: floatY }, { scale: scaleBird }] }]}><View style={styles.birdBodyShadow} /><View style={[styles.birdBody, {overflow: 'hidden'}]}><Animated.View style={{position:'absolute', bottom:0, left:0, right:0, height: `${fillPct}%`, backgroundColor: backLiquidColor, opacity: 0.5, transform: [{translateY: waveTranslate}]}} /><View style={{position:'absolute', bottom:0, left:0, right:0, height: `${fillPct}%`, backgroundColor: liquidColor, opacity: 0.8}} /><Animated.View style={[styles.eyeLeft, { transform: [{ scaleY: blinkAnim }] }]} /><Animated.View style={[styles.eyeRight, { transform: [{ scaleY: blinkAnim }] }]} /><View style={styles.beak} /><View style={styles.wing} /></View><Utensils size={40} color="#000" style={styles.fork} /></Animated.View>);
  const renderRabbit = () => (<Animated.View style={[styles.birdPlaceholder, { transform: [{ translateY: floatY }, { scale: scaleBird }] }]}><View style={styles.birdBodyShadow} /><View style={{position:'absolute', top:-20, left:40, width:20, height:60, backgroundColor:'#fff', borderWidth:3, borderRadius:10}} /><View style={{position:'absolute', top:-20, right:40, width:20, height:60, backgroundColor:'#fff', borderWidth:3, borderRadius:10}} /><View style={[styles.birdBody, {overflow: 'hidden'}]}><Animated.View style={{position:'absolute', bottom:0, left:0, right:0, height: `${fillPct}%`, backgroundColor: backLiquidColor, opacity: 0.5, transform: [{translateY: waveTranslate}]}} /><View style={{position:'absolute', bottom:0, left:0, right:0, height: `${fillPct}%`, backgroundColor: liquidColor, opacity: 0.8}} /><Animated.View style={[styles.eyeLeft, { transform: [{ scaleY: blinkAnim }] }]} /><Animated.View style={[styles.eyeRight, { transform: [{ scaleY: blinkAnim }] }]} /><View style={{position:'absolute', top:65, left:65, width:10, height:8, backgroundColor:'#f472b6', borderRadius:4}} /><View style={{position:'absolute', top:70, left:20, width:30, height:2, backgroundColor:'#000', transform:[{rotate:'10deg'}]}} /><View style={{position:'absolute', top:70, right:20, width:30, height:2, backgroundColor:'#000', transform:[{rotate:'-10deg'}]}} /></View><Carrot size={40} color="#f97316" fill="#f97316" style={styles.fork} /></Animated.View>);
  const renderPanda = () => (<Animated.View style={[styles.birdPlaceholder, { transform: [{ translateY: floatY }, { scale: scaleBird }] }]}><View style={styles.birdBodyShadow} /><View style={{position:'absolute', top:0, left:20, width:30, height:30, backgroundColor:'#000', borderRadius:15}} /><View style={{position:'absolute', top:0, right:20, width:30, height:30, backgroundColor:'#000', borderRadius:15}} /><View style={[styles.birdBody, {overflow: 'hidden'}]}><Animated.View style={{position:'absolute', bottom:0, left:0, right:0, height: `${fillPct}%`, backgroundColor: backLiquidColor, opacity: 0.5, transform: [{translateY: waveTranslate}]}} /><View style={{position:'absolute', bottom:0, left:0, right:0, height: `${fillPct}%`, backgroundColor: liquidColor, opacity: 0.8}} /><View style={{position:'absolute', top:35, left:30, width:24, height:24, backgroundColor:'#000', borderRadius:12}} /><View style={{position:'absolute', top:35, right:30, width:24, height:24, backgroundColor:'#000', borderRadius:12}} /><Animated.View style={[styles.eyeLeft, {backgroundColor:'#fff', width:8, height:8, top:42, left:38, transform: [{ scaleY: blinkAnim }] }]} /><Animated.View style={[styles.eyeRight, {backgroundColor:'#fff', width:8, height:8, top:42, right:38, transform: [{ scaleY: blinkAnim }] }]} /><View style={{position:'absolute', top:65, left:65, width:12, height:8, backgroundColor:'#000', borderRadius:4}} /></View><View style={[styles.fork, {width:8, height:60, backgroundColor:'#22c55e', borderRadius:4, transform:[{rotate:'20deg'}]}]} /></Animated.View>);

  const CalendarItem = ({ day, date, fullLabel, isFuture }: any) => {
    const isActive = selectedDate === fullLabel;
    const dayTotal = meals.filter(m => m.dateLabel === fullLabel).reduce((sum, m) => sum + m.calories, 0);
    return (<TouchableOpacity onPress={() => !isFuture && setSelectedDate(fullLabel)}>{isActive ? <View style={[styles.calendarItem, styles.calendarActive]}><Text style={styles.calDayActive}>{day}</Text><Text style={styles.calDateActive}>{date}</Text><View style={styles.yellowDot} /></View> : <View style={styles.calendarItem}><Text style={styles.calDay}>{day}</Text><Text style={styles.calDate}>{date}</Text>{isFuture ? <Text style={styles.calSub}>2155</Text> : <Text style={[styles.calSub, dayTotal > 0 && {color:'#34d399', fontWeight:'bold'}]}>{dayTotal > 0 ? '✓' : '—'}</Text>}</View>}</TouchableOpacity>);
  };

  const renderAddMealModal = () => (
    <View style={styles.cameraContainer}>
      {scanMode === 'photo' && (
        <>
          {permission?.granted && <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />}
          <SafeAreaView style={styles.cameraHeader}>
            <TouchableOpacity style={styles.camIconBtn}><Info size={24} color="#fff" /></TouchableOpacity>
            <View style={{flexDirection:'row', alignItems:'center'}}><Apple size={20} color="#fff" fill="#fff" style={{marginRight:8}} /><Text style={styles.camLogoText}>Calz</Text></View>
            <TouchableOpacity style={styles.camIconBtn} onPress={() => setShowCamera(false)}><X size={24} color="#fff" /></TouchableOpacity>
          </SafeAreaView>
          <View style={styles.viewfinder}>
            <View style={[styles.bracket, styles.bracketTL]} /><View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} /><View style={[styles.bracket, styles.bracketBR]} />
          </View>
          <View style={styles.camBottom}>
            <View style={styles.shutterRow}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}><ImageIcon size={24} color="#fff" /></TouchableOpacity>
              <TouchableOpacity style={styles.shutterOuter} onPress={takePicture}><View style={styles.shutterInner} /></TouchableOpacity>
              <View style={{width: 50}} />
            </View>
          </View>
        </>
      )}

      {scanMode === 'describe' && (
        <View style={styles.describeContainer}>
          <View style={styles.describeHeader}>
            <View style={{width:24}} />
            <TouchableOpacity onPress={() => setShowCamera(false)}><X size={24} color="#000" /></TouchableOpacity>
          </View>
          <View style={{alignItems:'center', marginTop:20, paddingHorizontal: 20}}>
            <Text style={styles.describeLabel}>DESCRIBE YOUR MEAL — BY VOICE OR TEXT</Text>
            <TextInput 
              style={styles.describeInput} 
              placeholder="e.g 2 shrimp tacos..." 
              placeholderTextColor="#d4d4d8" 
              value={describeText} 
              onChangeText={setDescribeText} 
              onSubmitEditing={submitDescription} 
              returnKeyType="go" 
              multiline 
            />
            <Text style={styles.describeHint}>Tap to type</Text>
          </View>
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <TouchableOpacity 
              style={[styles.micButton, describeText.length > 0 && {backgroundColor: '#000'}]} 
              onPress={submitDescription}
              disabled={!describeText.trim()}
            >
              {describeText.length > 0 ? <ChevronRight size={40} color="#fff" /> : <Mic size={40} color="#000" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {scanMode === 'manual' && (
        <View style={styles.manualContainer}>
          <View style={styles.manualHeader}>
            <TextInput 
              style={styles.manualTitleInput} 
              placeholder="Enter food name..." 
              placeholderTextColor="#d4d4d8" 
              value={manualData.name} 
              onChangeText={(t) => setManualData({...manualData, name: t})} 
            />
            <TouchableOpacity onPress={() => setShowCamera(false)}><X size={24} color="#000" /></TouchableOpacity>
          </View>
          <ScrollView style={{flex:1}}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Calories</Text>
              <View style={styles.inputRowFull}>
                <TextInput 
                  style={styles.textInput} 
                  placeholder="0" 
                  keyboardType="numeric" 
                  value={manualData.calories} 
                  onChangeText={(t) => setManualData({...manualData, calories: t})} 
                />
              </View>
            </View>
            <View style={styles.formSection}>
              <Text style={styles.sectionHeaderTitle}>Macronutrients</Text>
              <View style={styles.macroInputRow}>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}><Wheat size={20} color="#fbbf24" /><Text style={styles.inputLabel}>Carbs</Text></View>
                <View style={styles.inputBox}><TextInput style={styles.textInputSmall} placeholder="0" keyboardType="numeric" value={manualData.carbs} onChangeText={(t) => setManualData({...manualData, carbs: t})} /></View>
              </View>
              <View style={styles.macroInputRow}>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}><Beef size={20} color="#f472b6" /><Text style={styles.inputLabel}>Protein</Text></View>
                <View style={styles.inputBox}><TextInput style={styles.textInputSmall} placeholder="0" keyboardType="numeric" value={manualData.protein} onChangeText={(t) => setManualData({...manualData, protein: t})} /></View>
              </View>
              <View style={styles.macroInputRow}>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}><Droplets size={20} color="#34d399" /><Text style={styles.inputLabel}>Fat</Text></View>
                <View style={styles.inputBox}><TextInput style={styles.textInputSmall} placeholder="0" keyboardType="numeric" value={manualData.fat} onChangeText={(t) => setManualData({...manualData, fat: t})} /></View>
              </View>
            </View>
          </ScrollView>
          <TouchableOpacity 
            style={[styles.continueBtn, {backgroundColor: (manualData.calories && manualData.name) ? '#000' : '#f4f4f5'}]} 
            disabled={!manualData.calories || !manualData.name} 
            onPress={submitManual}
          >
            <Text style={{color: (manualData.calories && manualData.name) ? '#fff' : '#a1a1aa', fontWeight:'bold', fontSize:16}}>Log Meal</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.modeSwitcherContainer}>
        <View style={styles.modeSwitcher}>
          <TouchableOpacity onPress={() => setScanMode('describe')}>{scanMode === 'describe' ? <View style={styles.modeActive}><Text style={styles.modeTextActive}>DESCRIBE</Text></View> : <Text style={styles.modeText}>DESCRIBE</Text>}</TouchableOpacity>
          <TouchableOpacity onPress={() => setScanMode('photo')}>{scanMode === 'photo' ? <View style={styles.modeActive}><Text style={styles.modeTextActive}>PHOTO</Text></View> : <Text style={styles.modeText}>PHOTO</Text>}</TouchableOpacity>
          <TouchableOpacity onPress={() => setScanMode('manual')}>{scanMode === 'manual' ? <View style={styles.modeActive}><Text style={styles.modeTextActive}>MANUAL</Text></View> : <Text style={styles.modeText}>MANUAL</Text>}</TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHome = () => (
    <View style={{flex: 1}}>
      <FlatList
        data={currentMeals}
        keyExtractor={item => item.id}
        renderItem={({item}) => <MealItem meal={item} onPress={() => openEdit(item)} />}
        ListHeaderComponent={
          <>
            <View style={styles.calendarStrip}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16}}>{calendarDays.map((d, i) => (<CalendarItem key={i} day={d.dayName} date={d.dayNum} fullLabel={d.fullLabel} isFuture={d.isFuture} />))}</ScrollView></View>
            <View style={styles.heroContainer}>{selectedChar === 'quacky' && renderBird()}{selectedChar === 'robbin' && renderRabbit()}{selectedChar === 'bamboo' && renderPanda()}<View style={styles.groundShadow} /><View style={styles.dataDisplay}><Text style={styles.dataNumbers}><Text style={styles.eatenNumber}>{totals.calories}</Text><Text style={styles.totalNumber}> / {userProfile.calories}</Text></Text><Text style={[styles.dataLabel, isGoalReached && {color:'#10b981'}]}>{isGoalReached ? 'GOAL REACHED! 🎉' : 'CALORIES EATEN'}</Text></View></View>
            <View style={styles.listHeader}><Text style={styles.sectionTitle}>Tracked Today</Text></View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 70 }}
      />
    </View>
  );

  const renderFasting = () => {
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    let startLabel = "09:00 AM", endLabel = "05:00 PM", progressPct = 0;
    if (isFasting && fastStartTime) {
      const fastingDurationMs = plan.fasting * 3600000;
      startLabel = formatTime(fastStartTime);
      endLabel = formatTime(new Date(fastStartTime.getTime() + fastingDurationMs));
      progressPct = Math.min(((Date.now() - fastStartTime.getTime()) / fastingDurationMs) * 100, 100);
    }
  return (
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.topBar}><Text style={styles.greetingText}>Fasting</Text><TouchableOpacity style={styles.planBadge} onPress={() => setShowFastingPlan(true)}><Text style={{fontWeight:'bold'}}>Plan {selectedPlan}</Text></TouchableOpacity></View>
        <View style={{alignItems:'center', marginTop: 40}}>
          <Text style={{fontWeight:'600'}}>{isFasting ? 'Your fast ends in' : 'Until next fasting'}</Text>
          <Text style={{fontSize: 56, fontWeight:'900', letterSpacing:-1, marginVertical:8}}>{timerString}</Text>
          <Text style={{color:'#a1a1aa'}}>{isFasting ? 'You are doing great!' : `${plan.eating}h eating window`}</Text>
        </View>
        <View style={{paddingHorizontal: 24, marginTop: 40}}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}><Text style={styles.timeLabel}>{startLabel}</Text><Text style={styles.timeLabel}>{endLabel}</Text></View>
          <View style={styles.fastProgressBg}><View style={[styles.fastProgressFill, {width: `${progressPct}%`, backgroundColor: isFasting ? '#fbbf24' : '#4ade80'}]} /></View>
        </View>
        <View style={{alignItems:'center', marginTop: 40}}>
          <TouchableOpacity style={[styles.startFastBtn, {backgroundColor: isFasting ? '#ef4444' : '#000'}]} onPress={toggleFast}>
            <Text style={{color:'#fff', fontWeight:'bold', fontSize:18}}>{isFasting ? 'End fast' : 'Start fast'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

      const renderWeight = () => {

        const currentWeight = weightHistory[weightHistory.length - 1]?.weight || 0;

        const initialWeight = weightHistory[0]?.weight || 0;

        const gained = (currentWeight - initialWeight).toFixed(1);

        const goalProgress = initialWeight === weightGoal ? 100 : Math.min(Math.max((Math.abs(currentWeight - initialWeight) / Math.abs(weightGoal - initialWeight)) * 100, 0), 100).toFixed(0);

    

        // Process data based on Days/Months selection

        let chartLabels = [];

        let chartData = [];

    

        if (weightUnit === 'Days') {

          chartLabels = weightHistory.slice(-5).map(h => h.date);

          chartData = weightHistory.slice(-5).map(h => h.weight);

        } else {

          chartLabels = ['Nov', 'Dec', 'Jan'];

          chartData = [74.0, 74.5, currentWeight];

        }

    

        if (chartData.length === 0) {

          chartLabels = ['No Data'];

          chartData = [0];

        }

    

  return (

          <View style={{flex: 1, backgroundColor: '#fff'}}>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

                        <View style={styles.weightHeader}>

                          <Text style={styles.weightTitle}>Weight</Text>

                          <TouchableOpacity onPress={() => setShowWeightMenu(true)} style={{padding: 10}}>

                            <MoreVertical size={24} color="#000" />

                          </TouchableOpacity>

                </View>

              <View style={styles.summaryCard}>

                <View style={styles.summaryRow}>

                  <View><Text style={styles.summaryLabel}>{parseFloat(gained) >= 0 ? "YOU'VE GAINED" : "YOU'VE LOST"}</Text><Text style={styles.summaryValue}>{Math.abs(parseFloat(gained))} kg</Text></View>

                  <View style={{alignItems: 'flex-end'}}><Text style={styles.summaryLabel}>CURRENT WEIGHT</Text><Text style={styles.summaryValueLarge}>{currentWeight} kg</Text></View>

             </View>

                <View style={{marginTop: 20}}><Text style={styles.goalLabel}>{goalProgress}% GOAL REACHED</Text>

                  <View style={styles.progressBarBg}><View style={[styles.progressBarFill, {width: `${goalProgress}%` as any}]} /></View>

                  <View style={styles.progressLabels}><Text style={styles.progressLimit}>{initialWeight} kg</Text><ArrowRight size={14} color="#fff" /><Text style={styles.progressLimit}>{weightGoal} kg</Text></View>

             </View>

          </View>
            <View style={{paddingHorizontal: 24, marginTop: 32}}>
              <Text style={styles.sectionHeaderTitle}>Weight Progress (kg)</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity style={[styles.segmentBtn, weightUnit === 'Days' && styles.segmentBtnActive]} onPress={() => setWeightUnit('Days')}><Text style={[styles.segmentText, weightUnit === 'Days' && styles.segmentTextActive]}>Days</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.segmentBtn, weightUnit === 'Months' && styles.segmentBtnActive]} onPress={() => setWeightUnit('Months')}><Text style={[styles.segmentText, weightUnit === 'Months' && styles.segmentTextActive]}>Months</Text></TouchableOpacity>
              </View>
              <View style={{marginTop: 20, marginLeft: -20}}>
                <LineChart
                  data={{ 
                    labels: chartLabels, 
                    datasets: [
                      { data: chartData, color: () => '#3b82f6' }, 
                      { data: new Array(chartData.length).fill(weightGoal), withDots: false, color: () => '#ef4444' }
                    ] 
                  }}
                  width={Dimensions.get("window").width} height={220}
                  chartConfig={{ backgroundColor: "#fff", backgroundGradientFrom: "#fff", backgroundGradientTo: "#fff", color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, labelColor: () => '#a1a1aa', propsForBackgroundLines: { strokeDasharray: "" }, decimalPlaces: 1 }}
                  bezier fromZero={false} yAxisInterval={1} segments={4} style={{ borderRadius: 16 }}
                />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor:'#3b82f6'}]} /><Text style={styles.legendText}>Your Weight</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDash, {backgroundColor:'#ef4444'}]} /><Text style={styles.legendText}>Weight Goal</Text></View>
              </View>
            </View>
            <View style={{paddingHorizontal: 24, marginTop: 40}}>
              <Text style={styles.sectionHeaderTitle}>History</Text>
              <View style={styles.historyHeaders}><Text style={[styles.historyHeader, {flex:1}]}>Weight</Text><Text style={[styles.historyHeader, {flex:1, textAlign:'center'}]}>Change</Text><Text style={[styles.historyHeader, {flex:1, textAlign:'right'}]}>Date</Text></View>
              {[...weightHistory].reverse().map(item => (
                <TouchableOpacity key={item.id} style={styles.historyItem} onPress={() => openEditWeight(item)}>
                  <View style={styles.historyIconBox}><User size={20} color="#71717a" /></View>
                  <Text style={{flex: 1, fontWeight:'bold'}}>{item.weight} kg</Text>
                  <Text style={{flex: 1, textAlign:'center', color: item.change.includes('+') ? '#ef4444' : '#10b981'}}>{item.change}</Text>
                  <Text style={{flex: 1, textAlign:'right', color:'#a1a1aa'}}>{item.date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.logWeightFab} onPress={() => setShowWeightModal(true)}><Plus size={20} color="#fff" /><Text style={styles.logWeightText}>Log Weight</Text></TouchableOpacity>
        </View>
      );
    };
  const renderFastStartModal = () => (
    <View style={styles.fastModalOverlay}><View style={styles.endFastSheet}>
      <Text style={styles.endFastTitle}>When was your last meal?</Text>
      <TouchableOpacity style={styles.continueFastBtn} onPress={() => startFasting(new Date())}><Text style={styles.continueFastText}>Now</Text></TouchableOpacity>
      <TouchableOpacity style={styles.cancelFastBtn} onPress={() => { setPickerOwner('fasting'); setShowFastStartModal(false); setShowPicker(true); setPickerMode('date'); }}><Text style={styles.cancelFastText}>Choose exact time & date</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setShowFastStartModal(false)}><Text style={{color:'#3b82f6', marginTop:12, fontWeight:'600'}}>Cancel</Text></TouchableOpacity>
    </View></View>
  );

  const renderEndFastModal = () => {
    const elapsed = fastStartTime ? ((Date.now() - fastStartTime.getTime()) / 3600000).toFixed(1) : 0;
    const remaining = Math.max(0, plan.fasting - Number(elapsed)).toFixed(1);
    return (
      <View style={styles.fastModalOverlay}><View style={styles.endFastSheet}><Text style={{fontSize: 40, marginBottom: 16}}>👎</Text><Text style={styles.endFastTitle}>End this fast?</Text>
        <Text style={styles.endFastDesc}>You've only fasted for {elapsed} hours so far. You still have {remaining} hours left to reach your {selectedPlan} goal. If less than 9h, it won't be saved.</Text>
        <TouchableOpacity style={styles.continueFastBtn} onPress={() => setShowEndFastModal(false)}><Text style={styles.continueFastText}>Continue fast</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelFastBtn} onPress={async () => { 
          setIsFasting(false); 
          setFastStartTime(null); 
          setShowEndFastModal(false); 
          await addDoc(collection(db, "userSettings"), { type: 'fasting', isFasting: false, startTime: null, updatedAt: Date.now() });
        }}><Text style={styles.cancelFastText}>Cancel this fast</Text></TouchableOpacity>
      </View></View>
    );
  };

  const renderAppearanceModal = () => (
    <View style={styles.modalContainer}>
      <View style={styles.patternBg}>{[...Array(6)].map((_, i) => (<Clover key={i} size={48} color="#f4f4f5" style={{position:'absolute', top: Math.random()*400, left: Math.random()*350, transform:[{rotate: `${Math.random()*90}deg`}]}} />))}</View>
      <View style={styles.modalHeader}><View style={{width: 24}} /><Text style={styles.modalTitle}>Appearance</Text><X size={24} color="#000" onPress={() => setShowAppearance(false)} /></View>
      <View style={styles.previewContainer}>
        <Text style={styles.charName}>{selectedChar === 'quacky' ? 'Quacky' : selectedChar === 'robbin' ? 'Robbin' : 'Bamboo'}</Text>
        <View style={{transform:[{scale: 1.5}], marginVertical: 40}}>{selectedChar === 'quacky' && renderBird()}{selectedChar === 'robbin' && renderRabbit()}{selectedChar === 'bamboo' && renderPanda()}</View>
        <View style={styles.previewData}><Text style={styles.previewNumbers}>2100 / 2100</Text><Text style={styles.previewLabel}>CALORIES EATEN</Text></View>
          </View>
      <View style={styles.selectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 24, gap: 12}}>
          <TouchableOpacity style={[styles.charCard, selectedChar==='quacky' && styles.charCardActive]} onPress={()=>setSelectedChar('quacky')}><View style={styles.cardThumb}><View style={[styles.birdBody, {width: 40, height: 40, borderRadius: 20, borderWidth: 2}]}><View style={[styles.beak, {width: 6, height: 6, top: 16, left: 16}]} /></View></View><Text style={styles.cardTitle}>Quacky</Text><Text style={styles.cardSub}>Unlocked</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.charCard, selectedChar==='robbin' && styles.charCardActive]} onPress={()=>setSelectedChar('robbin')}><View style={styles.premiumBadge}><Crown size={10} color="#000" fill="#fbbf24" /></View><View style={styles.cardThumb}><Rabbit size={32} color="#000" /></View><Text style={styles.cardTitle}>Robbin</Text><Text style={styles.cardSubPremium}>Premium</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.charCard, selectedChar==='bamboo' && styles.charCardActive]} onPress={()=>setSelectedChar('bamboo')}><View style={styles.premiumBadge}><Crown size={10} color="#000" fill="#fbbf24" /></View><View style={styles.cardThumb}><Rat size={32} color="#000" /></View><Text style={styles.cardTitle}>Bamboo</Text><Text style={styles.cardSubPremium}>Premium</Text></TouchableOpacity>
        </ScrollView>
        </View>
    </View>
  );

    const renderPickerModal = () => (

      <Modal transparent animationType="slide" visible={showPicker}>

        <View style={styles.pickerOverlay}><View style={styles.pickerSheet}>

          <View style={styles.pickerHeader}>

            <Text style={styles.pickerTitle}>

              {pickerOwner === 'fasting' ? 'Pick Start Time' : 'Select Date'}

            </Text>

            <X size={24} color="#000" onPress={() => setShowPicker(false)} />

             </View>

          

          <View style={styles.modernPickerRow}>

            <TouchableOpacity 

              style={[styles.modernPickerCard, pickerMode === 'date' && styles.modernPickerCardActive]} 

              onPress={() => setPickerMode('date')}

            >

              <Text style={styles.modernPickerLabel}>DATE</Text>

              <Text style={styles.modernPickerValue}>{dateList[selDateIdx].label}</Text>

            </TouchableOpacity>

  

            {pickerOwner === 'fasting' && (

              <TouchableOpacity 

                style={[styles.modernPickerCard, pickerMode === 'time' && styles.modernPickerCardActive]} 

                onPress={() => setPickerMode('time')}

              >

                <Text style={styles.modernPickerLabel}>TIME</Text>

                <Text style={styles.modernPickerValue}>{selHour.toString().padStart(2, '0')}:{selMin.toString().padStart(2, '0')}</Text>

              </TouchableOpacity>

            )}

          </View>

          <View style={{height: 200, marginBottom: 20}}>

            {pickerMode === 'date' ? (

              <ScrollPicker dataSource={dateList.map(d => d.label)} selectedIndex={selDateIdx} onValueChange={(_, i) => setSelDateIdx(i)} wrapperHeight={200} itemHeight={50} highlightColor="#000" highlightBorderWidth={2} />

            ) : (

              <View style={{flexDirection:'row'}}><ScrollPicker dataSource={hours} selectedIndex={selHour} onValueChange={(_, i) => setSelHour(i)} wrapperHeight={200} itemHeight={50} highlightColor="#000" highlightBorderWidth={2} /><ScrollPicker dataSource={minutes} selectedIndex={selMin} onValueChange={(_, i) => setSelMin(i)} wrapperHeight={200} itemHeight={50} highlightColor="#000" highlightBorderWidth={2} /></View>

            )}

                </View>

          <TouchableOpacity style={styles.continueFastBtn} onPress={() => { 

            const d = new Date(dateList[selDateIdx].value); 

            d.setHours(selHour, selMin); 

            if (pickerOwner === 'fasting') {

              startFasting(d); 

            } else {

              setLogDate(d);

            }

            setShowPicker(false); 

          }}><Text style={styles.continueFastText}>Confirm</Text></TouchableOpacity>

        </View></View>

      </Modal>

    );

  const renderEditWeightModal = () => (
    <Modal visible={showEditWeightModal} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.weightLogContainer}>
        <View style={styles.weightLogHeader}>
          <TouchableOpacity onPress={deleteWeightEntry}>
            <Trash2 size={24} color="#ef4444" />
          </TouchableOpacity>
          <Text style={styles.weightLogTitle}>Edit Weight</Text>
          <TouchableOpacity style={styles.weightLogClose} onPress={() => setShowEditWeightModal(false)}>
            <X size={20} color="#000" />
          </TouchableOpacity>
              </View>

        <TouchableOpacity 
          style={styles.todayLabelRow} 
          onPress={() => { setPickerOwner('weight'); setShowPicker(true); setPickerMode('date'); }}
        >
          <Calendar size={16} color="#f97316" />
          <Text style={styles.todayText}>
            {logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <View style={styles.photoSection}>
          <View style={styles.silhouetteContainer}>
            <User size={120} color="#d4d4d8" strokeWidth={1} />
              </View>
            </View>

        <View style={styles.wheelSelectorSection}>
          <View style={styles.activeWeightBar} />
          <View style={styles.wheelsContainer}>
            <View style={{flex: 1, height: 200}}>
              <ScrollPicker
                dataSource={weightWholeList}
                selectedIndex={selWeightWhole - 30}
                renderItem={(data) => (
                  <Text style={[styles.wheelText, selWeightWhole === parseInt(data) && styles.wheelTextActive]}>{data}</Text>
                )}
                onValueChange={(data) => setSelWeightWhole(parseInt(data || '30'))}
                wrapperHeight={200}
                itemHeight={60}
                wrapperBackground="#fff"
                highlightColor="transparent"
              />
              </View>
            <Text style={styles.wheelDot}>.</Text>
            <View style={{flex: 1, height: 200}}>
              <ScrollPicker
                dataSource={weightFractionList}
                selectedIndex={selWeightFraction}
                renderItem={(data) => (
                  <Text style={[styles.wheelText, selWeightFraction === parseInt(data || '0') && styles.wheelTextActive]}>{data}</Text>
                )}
                onValueChange={(data) => setSelWeightFraction(parseInt(data || '0'))}
                wrapperHeight={200}
                itemHeight={60}
                wrapperBackground="#fff"
                highlightColor="transparent"
              />
            </View>
            <Text style={styles.wheelUnitLarge}>kg</Text>
          </View>
        </View>

        <View style={styles.weightLogFooter}>
          <TouchableOpacity style={styles.saveWeightBtn} onPress={saveWeightEdit}>
            <Text style={styles.saveWeightText}>Update Weight</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

      const renderWeightMenu = () => (
        <Modal visible={showWeightMenu} animationType="fade" transparent>
          <View style={styles.fastModalOverlay}>
            <View style={styles.weightMenuSheet}>
              <TouchableOpacity style={styles.menuOption} onPress={() => { setShowWeightMenu(false); setShowWeightModal(true); }}>
                <Text style={styles.menuOptionText}>Log Weight</Text>
              </TouchableOpacity>
              <View style={styles.menuSeparator} />
              <TouchableOpacity style={styles.menuOption} onPress={() => { 
                setShowWeightMenu(false); 
                const [whole, fraction] = weightGoal.toString().split('.');
                setSelWeightWhole(parseInt(whole));
                setSelWeightFraction(parseInt(fraction || '0'));
                setShowEditGoalModal(true); 
              }}>
                <Text style={styles.menuOptionText}>Edit Goal</Text>
              </TouchableOpacity>
              <View style={styles.menuSeparator} />
              <TouchableOpacity style={styles.menuOption} onPress={() => setShowWeightMenu(false)}>
                <Text style={[styles.menuOptionText, {color: '#3b82f6'}]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    
        const renderEditGoalModal = () => (
    
          <Modal visible={showEditGoalModal} animationType="slide" presentationStyle="fullScreen">
    
            <SafeAreaView style={styles.weightLogContainer}>
    
              <View style={styles.weightLogHeader}>
    
                <View style={{width: 40}} />
    
                <Text style={styles.weightLogTitle}>Weight Goal</Text>
    
                <TouchableOpacity style={styles.weightLogClose} onPress={() => setShowEditGoalModal(false)}>
    
                  <X size={20} color="#000" />
    
                </TouchableOpacity>
    
              </View>
    
      
    
              <View style={styles.wheelSelectorSection}>
    
                <View style={styles.activeWeightBar} />
    
                <View style={styles.wheelsContainer}>
    
                  <View style={{flex: 1, height: 200}}>
    
                    <ScrollPicker
    
                      dataSource={weightWholeList}
    
                      selectedIndex={selWeightWhole - 30}
    
                      renderItem={(data) => <Text style={[styles.wheelText, selWeightWhole === parseInt(data || '30') && styles.wheelTextActive]}>{data}</Text>}
    
                      onValueChange={(data) => setSelWeightWhole(parseInt(data || '30'))}
    
                      wrapperHeight={200} itemHeight={60} wrapperBackground="#fff" highlightColor="transparent"
    
                    />
    
                  </View>
    
                  <Text style={styles.wheelDot}>.</Text>
    
                  <View style={{flex: 1, height: 200}}>
    
                    <ScrollPicker
    
                      dataSource={weightFractionList}
    
                      selectedIndex={selWeightFraction}
    
                      renderItem={(data) => <Text style={[styles.wheelText, selWeightFraction === parseInt(data || '0') && styles.wheelTextActive]}>{data}</Text>}
    
                      onValueChange={(data) => setSelWeightFraction(parseInt(data || '0'))}
    
                      wrapperHeight={200} itemHeight={60} wrapperBackground="#fff" highlightColor="transparent"
    
                    />
    
                  </View>
    
                  <Text style={styles.wheelUnitLarge}>kg</Text>
    
                </View>
    
              </View>
    
      
    
              <View style={styles.weightLogFooter}>
    
                <TouchableOpacity style={styles.saveWeightBtn} onPress={async () => { 
    
                  const newGoal = parseFloat(`${selWeightWhole}.${selWeightFraction}`);
    
                  setWeightGoal(newGoal); 
    
                  const currentWeight = weightHistory[weightHistory.length - 1]?.weight || userProfile.weight;
    
                  const targets = calculateDynamicTargets(currentWeight, newGoal);
    
                  await addDoc(collection(db, "userSettings"), { type: 'weightGoal', value: newGoal, updatedAt: Date.now() });
                  await addDoc(collection(db, "userSettings"), { 
                    type: 'profile', 
                    profile: { ...userProfile, ...targets },
                    updatedAt: Date.now()
                  });

                  setShowEditGoalModal(false); 
    
                  Vibration.vibrate(20); 
    
                }}>
    
                  <Text style={styles.saveWeightText}>Save Goal</Text>
    
                </TouchableOpacity>
    
              </View>
    
            </SafeAreaView>
    
          </Modal>
    
        );  const renderLogWeightModal = () => (
    <Modal visible={showWeightModal} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.weightLogContainer}>
        <View style={styles.weightLogHeader}>
          <View style={{width: 40}} />
          <Text style={styles.weightLogTitle}>Weight Tracker</Text>
          <TouchableOpacity style={styles.weightLogClose} onPress={() => setShowWeightModal(false)}>
            <X size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.todayLabelRow} 
          onPress={() => { setPickerOwner('weight'); setShowPicker(true); setPickerMode('date'); }}
        >
          <Calendar size={16} color="#f97316" />
          <Text style={styles.todayText}>
            {logDate.toDateString() === new Date().toDateString() ? 'Today' : logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <View style={styles.photoSection}>
          <View style={styles.silhouetteContainer}>
            {weightPhoto ? (
              <Image source={{ uri: weightPhoto }} style={styles.silhouetteImg} />
            ) : (
              <User size={120} color="#d4d4d8" strokeWidth={1} />
          )}
        </View>
          <TouchableOpacity 
            style={styles.addPhotoPill} 
            onPress={async () => {
              let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [1, 1], quality: 0.5 } as any);
              if (!result.canceled) setWeightPhoto(result.assets[0].uri);
            }}
          >
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wheelSelectorSection}>
          <View style={styles.activeWeightBar} />
          <View style={styles.wheelsContainer}>
            <View style={{flex: 1, height: 200}}>
              <ScrollPicker
                dataSource={weightWholeList}
                selectedIndex={selWeightWhole - 30}
                renderItem={(data) => (
                  <Text style={[styles.wheelText, selWeightWhole === parseInt(data) && styles.wheelTextActive]}>{data}</Text>
                )}
                onValueChange={(data) => setSelWeightWhole(parseInt(data || '30'))}
                wrapperHeight={200}
                itemHeight={60}
                wrapperBackground="#fff"
                highlightColor="transparent"
              />
            </View>
            <Text style={styles.wheelDot}>.</Text>
            <View style={{flex: 1, height: 200}}>
              <ScrollPicker
                dataSource={weightFractionList}
                selectedIndex={selWeightFraction}
                renderItem={(data) => (
                  <Text style={[styles.wheelText, selWeightFraction === parseInt(data || '0') && styles.wheelTextActive]}>{data}</Text>
                )}
                onValueChange={(data) => setSelWeightFraction(parseInt(data || '0'))}
                wrapperHeight={200}
                itemHeight={60}
                wrapperBackground="#fff"
                highlightColor="transparent"
              />
            </View>
            <Text style={styles.wheelUnitLarge}>kg</Text>
          </View>
        </View>

        <View style={styles.weightLogFooter}>
          <TouchableOpacity style={styles.saveWeightBtn} onPress={submitWeight}>
            <Text style={styles.saveWeightText}>
              {weightPhoto ? "Save" : "Save without Photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderFastingPlanModal = () => (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => setShowFastingPlan(false)}><ChevronLeft size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.modalTitle}>Fasting Plans</Text>
        <View style={{width: 24}} />
      </View>
      <ScrollView contentContainerStyle={{padding: 24, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
        {[
          { title: '14:10', icon: <Apple size={20} color="#4ade80" />, desc: 'Easy your way into fasting for 14 hours...' },
          { title: '16:8', icon: <Citrus size={20} color="#fbbf24" />, desc: 'Our most popular tracker! 16 hours fasting...' },
          { title: '20:4', icon: <Egg size={20} color="#a3e635" />, desc: '20 hours of fasting...' },
          { title: '22:2', icon: <Citrus size={20} color="#facc15" />, desc: '22 hours of fasting...' },
          { title: '6:1', icon: <Nut size={20} color="#a8a29e" />, desc: 'One fasting day per week...' },
          { title: '5:2', icon: <Circle size={20} color="#4ade80" />, desc: 'Two fasting days per week...' },
        ].map((p, i) => (
          <TouchableOpacity key={i} style={styles.planCard} onPress={() => {setSelectedPlan(p.title); setShowFastingPlan(false);}}>
            <View style={styles.planHeader}><Text style={styles.planTitle}>{p.title}</Text>{p.icon}</View>
            <Text style={styles.planDesc}>{p.desc}</Text>
            <View style={selectedPlan === p.title ? styles.planToggleActive : styles.planToggle}>
              {selectedPlan === p.title && <View style={{width:10, height:10, borderRadius:5, backgroundColor:'#fff'}} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEditModal = () => (
    <Modal visible={showEdit} animationType="fade" transparent>
      <View style={styles.editOverlay}>
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Edit Meal</Text>
          <View style={styles.editInputRow}>
            <Text style={styles.editLabel}>Name</Text>
            <TextInput style={styles.editInput} value={editingMeal?.name} onChangeText={t => setEditingMeal(prev => prev ? {...prev, name: t} : null)} />
              </View>
          <View style={styles.editInputRow}>
            <Text style={styles.editLabel}>Calories</Text>
            <TextInput style={styles.editInput} keyboardType="numeric" value={String(editingMeal?.calories || 0)} onChangeText={t => setEditingMeal(prev => prev ? {...prev, calories: parseInt(t)||0} : null)} />
            </View>
          <View style={{flexDirection:'row', gap:12}}>
            <View style={{flex:1}}><Text style={styles.editLabel}>Protein</Text><TextInput style={styles.editInput} keyboardType="numeric" value={String(editingMeal?.macros.protein || 0)} onChangeText={t => setEditingMeal(prev => prev ? {...prev, macros: {...prev.macros, protein: parseInt(t)||0}} : null)} /></View>
            <View style={{flex:1}}><Text style={styles.editLabel}>Carbs</Text><TextInput style={styles.editInput} keyboardType="numeric" value={String(editingMeal?.macros.carbs || 0)} onChangeText={t => setEditingMeal(prev => prev ? {...prev, macros: {...prev.macros, carbs: parseInt(t)||0}} : null)} /></View>
            <View style={{flex:1}}><Text style={styles.editLabel}>Fat</Text><TextInput style={styles.editInput} keyboardType="numeric" value={String(editingMeal?.macros.fat || 0)} onChangeText={t => setEditingMeal(prev => prev ? {...prev, macros: {...prev.macros, fat: parseInt(t)||0}} : null)} /></View>
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.deleteBtn} onPress={deleteMeal}><Trash2 size={24} color="#ef4444" /></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}><Text style={{color:'#fff', fontWeight:'bold'}}>Save</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeEdit} onPress={() => setShowEdit(false)}><X size={24} color="#000" /></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderWellness = () => {
    const currentWaterIntake = waterLogs
      .filter(log => log.dateLabel === selectedDate)
      .reduce((sum, log) => sum + log.amount, 0);

    const currentStepsCount = stepsLogs
      .filter(log => log.dateLabel === selectedDate)
      .reduce((sum, log) => sum + log.count, 0);

    const currentActiveCalories = activityLogs
      .filter(log => log.dateLabel === selectedDate)
      .reduce((sum, log) => sum + log.calories, 0);

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={styles.well_headerContainer}>
          <Text style={styles.well_headerTitle}>Wellness</Text>
        </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.well_carouselContainer}>
        {[
          { 
            q: "Should I Skip Breakfast?", 
            bg: "#FFEDF2", 
            icon: <Apple size={40} color="#FF8FA3" />,
            fact: "Breakfast jumpstarts your metabolism and helps you burn more calories throughout the day. Skipping it often leads to overeating later!",
            motivation: "Fuel your body right from the start. You deserve to feel energetic all day long!",
            accent: "#FF8FA3"
          },
          { 
            q: "How much water is enough?", 
            bg: "#E6F4FF", 
            icon: <Droplets size={40} color="#69C0FF" />,
            fact: "Drinking enough water can increase the number of calories you burn by 24–30% within 10 minutes of drinking.",
            motivation: "Stay hydrated, stay sharp! Your brain is 75% water—keep it happy.",
            accent: "#69C0FF"
          },
          { 
            q: "Benefits of morning walks", 
            bg: "#F6FFED", 
            icon: <Activity size={40} color="#95DE64" />,
            fact: "A 30-minute morning walk can lower your blood pressure, improve blood circulation, and reduce the risk of heart disease.",
            motivation: "The morning breeze is a gift. Step outside and let the world inspire your first victory of the day!",
            accent: "#95DE64"
          },
          { 
            q: "Healthy snack options", 
            bg: "#FFF7E6", 
            icon: <Utensils size={40} color="#FFC069" />,
            fact: "Almonds and walnuts are packed with healthy fats and protein, keeping you full for longer than processed snacks.",
            motivation: "Small choices lead to big changes. Pick the nut, not the donut!",
            accent: "#FFC069"
          },
        ].map((tip, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.well_tipCard, { backgroundColor: tip.bg }]}
            onPress={() => { setSelectedTip(tip); setShowTipDetail(true); }}
          >
            <View style={styles.well_tipIcon}>{tip.icon}</View>
            <Text style={styles.well_tipText}>{tip.q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

        <View style={styles.well_section}>
          <Text style={styles.well_sectionTitle}>Today's Health</Text>
          
          <TouchableOpacity style={styles.well_waterCard} onPress={() => setShowAddWater(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.well_waterIconBox}><Droplets size={24} color="#3b82f6" /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.well_cardLabel}>Water Intake</Text>
                <Text style={styles.well_cardValue}>{currentWaterIntake} / {waterGoal} ml</Text>
              </View>
              <View style={styles.well_plusBtn}><Plus size={20} color="#fff" /></View>
            </View>
          </TouchableOpacity>

          <View style={styles.well_healthConnectBanner}>
            <Heart size={24} color="#6366f1" fill="#6366f1" />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.well_bannerTitle}>Health Connect</Text>
              <Text style={styles.well_bannerSub}>Sync activity automatically</Text>
            </View>
            <TouchableOpacity onPress={() => setHealthConnectEnabled(!healthConnectEnabled)}>
              <View style={[styles.well_toggle, healthConnectEnabled && styles.well_toggleActive]}>
                <View style={[styles.well_toggleDot, healthConnectEnabled && styles.well_toggleDotActive]} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.well_metricsGrid}>
            <TouchableOpacity style={styles.well_metricSquare} onPress={() => setShowStepTracker(true)}>
              <View style={[styles.well_metricIcon, { backgroundColor: '#F6FFED' }]}><ScanLine size={24} color="#52C41A" /></View>
              <Text style={styles.well_metricValue}>{currentStepsCount}</Text>
              <Text style={styles.well_metricLabel}>Steps</Text>
              <Text style={styles.well_metricGoal}>Goal: {stepsGoal}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.well_metricSquare} onPress={() => setShowActivityList(true)}>
              <View style={[styles.well_metricIcon, { backgroundColor: '#F9F0FF' }]}><Activity size={24} color="#722ED1" /></View>
              <Text style={styles.well_metricValue}>{currentActiveCalories} kcal</Text>
              <Text style={styles.well_metricLabel}>Activity</Text>
              <View style={styles.well_miniPlus}><Plus size={12} color="#722ED1" /></View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAddWaterModal = () => (
    <Modal visible={showAddWater} animationType="slide" transparent>
      <View style={styles.well_modalOverlay}>
        <View style={styles.well_modalSheet}>
          <Text style={styles.well_modalTitle}>Add Water</Text>
          <Text style={styles.well_modalSub}>Select your drink size to track water intake</Text>
          
          <View style={styles.well_pickerContainer}>
            <View style={styles.well_pickerSelectionBar} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ScrollPicker
                dataSource={Array.from({ length: 20 }, (_, i) => (i + 1) * 50)}
                selectedIndex={4}
                onValueChange={(data) => setSelWaterVolume(data || 250)}
                wrapperHeight={150}
                itemHeight={50}
                highlightColor="transparent"
                renderItem={(data, index, isSelected) => (
                  <Text style={[styles.well_pickerText, isSelected && styles.well_pickerTextActive]}>{data}</Text>
                )}
              />
              <Text style={styles.well_pickerUnit}>ml</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.well_primaryBtn} onPress={async () => { await addDoc(collection(db, "waterLogs"), { dateLabel: selectedDate, amount: selWaterVolume }); setShowAddWater(false); Vibration.vibrate(20); }}>
            <Text style={styles.well_primaryBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.well_secondaryBtn} onPress={() => setShowAddWater(false)}>
            <Text style={styles.well_secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStepTrackerModal = () => (
    <Modal visible={showStepTracker} animationType="slide" transparent>
      <View style={styles.well_modalOverlay}>
        <View style={styles.well_modalSheet}>
          <View style={styles.well_stepIconCircle}><ScanLine size={40} color="#52C41A" /></View>
          <Text style={styles.well_modalTitle}>Step Tracker</Text>
          <Text style={styles.well_stepDescText}>We've set an ideal daily step goal for you based on your profile and goals</Text>
          
          <View style={styles.well_stepGoalBox}>
            <Text style={styles.well_stepGoalLabel}>Daily Goal</Text>
            <Text style={styles.well_stepGoalValue}>{stepsGoal.toLocaleString()}</Text>
          </View>

          <TouchableOpacity style={styles.well_primaryBtnPill} onPress={() => setShowStepTracker(false)}>
            <Text style={styles.well_primaryBtnText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderActivityList = () => (
    <Modal visible={showActivityList} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.well_activityHeader}>
          <Text style={styles.well_activityHeaderTitle}>Activity Tracker</Text>
          <TouchableOpacity onPress={() => setShowActivityList(false)}><X size={24} color="#000" /></TouchableOpacity>
        </View>

        <View style={styles.well_activityInputSection}>
          <Text style={styles.well_activityPrompt}>Describe the Type of Exercise and the duration</Text>
          <TextInput 
            style={styles.well_activityInput} 
            placeholder="Examples: 45 min cycling" 
            placeholderTextColor="#bfbfbf"
            multiline
            value={activityDescription}
            onChangeText={setActivityDescription}
          />
          <TouchableOpacity 
            style={[styles.well_addActivityBtn, !activityDescription.trim() && { opacity: 0.5 }]} 
            onPress={() => analyzeActivity(activityDescription)}
            disabled={!activityDescription.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.well_addActivityBtnText}>Add Activity</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.well_activitySeparator}>
          <Text style={styles.well_activitySeparatorText}>or select from the list</Text>
        </View>

        <FlatList
          data={[
            { name: "Stretching", time: "30 min", cals: 120, icon: <Activity size={20} color="#fff" /> },
            { name: "Cycling", time: "45 min", cals: 350, icon: <Activity size={20} color="#fff" /> },
            { name: "Core Training", time: "30 min", cals: 215, icon: <Activity size={20} color="#fff" /> },
            { name: "Swimming", time: "60 min", cals: 500, icon: <Activity size={20} color="#fff" /> },
          ]}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.well_activityItem} onPress={() => { setSelectedActivity(item); setShowLogDuration(true); }}>
              <View style={styles.well_activityIconBox}>{item.icon}</View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.well_activityName}>{item.name}</Text>
                <Text style={styles.well_activitySub}>{item.time} • {item.cals} kcal</Text>
              </View>
              <View style={styles.well_activityPlus}><Plus size={16} color="#000" /></View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        />
      </SafeAreaView>
    </Modal>
  );

  const renderLogDurationModal = () => (
    <Modal visible={showLogDuration} animationType="slide" transparent>
      <View style={styles.well_modalOverlay}>
        <View style={styles.well_modalSheet}>
          <Text style={styles.well_modalTitle}>{selectedActivity?.name || "Activity"}</Text>
          <Text style={styles.well_modalSub}>Select the duration to log this activity</Text>
          
          <View style={styles.well_pickerContainer}>
            <View style={styles.well_pickerSelectionBar} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <ScrollPicker
                dataSource={Array.from({ length: 4 }, (_, i) => i)}
                selectedIndex={selDurationHour}
                onValueChange={(data) => setSelDurationHour(data || 0)}
                wrapperHeight={150}
                itemHeight={50}
                highlightColor="transparent"
                renderItem={(data, index, isSelected) => (
                  <Text style={[styles.well_pickerText, isSelected && styles.well_pickerTextActive]}>{data}</Text>
                )}
              />
              <Text style={styles.well_pickerUnitSmall}>hrs</Text>
              <ScrollPicker
                dataSource={Array.from({ length: 12 }, (_, i) => i * 5)}
                selectedIndex={6}
                onValueChange={(data) => setSelDurationMin(data || 30)}
                wrapperHeight={150}
                itemHeight={50}
                highlightColor="transparent"
                renderItem={(data, index, isSelected) => (
                  <Text style={[styles.well_pickerText, isSelected && styles.well_pickerTextActive]}>{data}</Text>
                )}
              />
              <Text style={styles.well_pickerUnitSmall}>min</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.well_primaryBtn} onPress={async () => { 
            await addDoc(collection(db, "activityLogs"), { dateLabel: selectedDate, calories: (selectedActivity?.cals || 0) });
            setShowLogDuration(false); 
            setShowActivityList(false); 
            Vibration.vibrate(20); 
          }}>
            <Text style={styles.well_primaryBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.well_secondaryBtn} onPress={() => setShowLogDuration(false)}>
            <Text style={styles.well_secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTipDetailModal = () => (
    <Modal visible={showTipDetail} animationType="fade" transparent>
      <View style={styles.well_tipDetailOverlay}>
        <Animated.View style={styles.well_tipDetailSheet}>
          <View style={[styles.well_tipDetailIconCircle, { backgroundColor: selectedTip?.bg || '#fff' }]}>
            {selectedTip?.icon}
          </View>
          
          <Text style={styles.well_tipDetailTitle}>{selectedTip?.q}</Text>
          
          <ScrollView style={styles.well_tipDetailContent}>
            <View style={styles.well_tipInfoSection}>
              <Text style={[styles.well_tipInfoLabel, { color: selectedTip?.accent || '#000' }]}>DID YOU KNOW?</Text>
              <Text style={styles.well_tipInfoText}>{selectedTip?.fact}</Text>
            </View>

            <View style={styles.well_tipInfoSection}>
              <Text style={[styles.well_tipInfoLabel, { color: selectedTip?.accent || '#000' }]}>MOTIVATION</Text>
              <Text style={styles.well_tipInfoText}>{selectedTip?.motivation}</Text>
        </View>
      </ScrollView>

          <TouchableOpacity 
            style={[styles.well_primaryBtnPill, { backgroundColor: selectedTip?.accent || '#000', marginTop: 20 }]} 
            onPress={() => setShowTipDetail(false)}
          >
            <Text style={styles.well_primaryBtnText}>Got it!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  // --- MAIN RENDER ---
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        {activeTab === 'home' && renderHome()}
        {activeTab === 'fasting' && renderFasting()}
        {activeTab === 'weight' && renderWeight()}
        {activeTab === 'wellness' && renderWellness()}
        {activeTab === 'profile' && <View style={{flex:1, alignItems:'center', justifyContent:'center'}}><Text>Profile</Text></View>}

        {activeTab === 'home' && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAppearance(true)}><PawPrint size={24} color="#000" /></TouchableOpacity>
            <View style={styles.headerCenter}><Text style={styles.headerTitle}>{dateTitle}</Text><Text style={styles.headerSubtitle}>{daySubtitle}</Text></View>
            <TouchableOpacity style={styles.iconBtn}><User size={24} color="#000" /></TouchableOpacity>
          </View>
        )}

        <View style={styles.tabBar}>
          <TabItem icon={<Home size={24} color={activeTab==='home'?'#000':'#a1a1aa'} />} label="Home" active={activeTab==='home'} onPress={()=>setActiveTab('home')} />
          <TabItem icon={<Utensils size={24} color={activeTab==='fasting'?'#000':'#a1a1aa'} />} label="Fasting" active={activeTab==='fasting'} onPress={()=>setActiveTab('fasting')} />
          <TabItem icon={<Scale size={24} color={activeTab==='weight'?'#000':'#a1a1aa'} />} label="Weight" active={activeTab==='weight'} onPress={()=>setActiveTab('weight')} />
          <TabItem icon={<Heart size={24} color={activeTab==='wellness'?'#000':'#a1a1aa'} />} label="Wellness" active={activeTab==='wellness'} onPress={()=>setActiveTab('wellness')} />
        </View>

        {activeTab === 'home' && (
      <View style={styles.fabContainer}>
             <Animated.View style={{ transform: [{ scale: fabAnim }] }}>
               <TouchableOpacity style={styles.fabPill} onPress={handleAddMeal} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <><View style={styles.scanIconFrame}><Plus size={16} color="#000" strokeWidth={3} /></View><Text style={styles.fabText}>Add Meal</Text></>}
        </TouchableOpacity>
             </Animated.View>
      </View>
        )}

        <Modal visible={showCamera} animationType="slide">{renderAddMealModal()}</Modal>
        <Modal visible={showAppearance} animationType="slide" presentationStyle="pageSheet">{renderAppearanceModal()}</Modal>
        <Modal visible={showFastingPlan} animationType="slide" presentationStyle="pageSheet">{renderFastingPlanModal()}</Modal>
        <Modal visible={showFastStartModal} transparent animationType="fade">{renderFastStartModal()}</Modal>
        <Modal visible={showEndFastModal} transparent animationType="fade">{renderEndFastModal()}</Modal>
        {renderWeightMenu()}
        {renderEditGoalModal()}
        {renderEditWeightModal()}
        {renderLogWeightModal()}
        {renderEditModal()}
        {renderPickerModal()}
        {renderAddWaterModal()}
        {renderStepTrackerModal()}
        {renderActivityList()}
        {renderLogDurationModal()}
        {renderTipDetailModal()}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabItem({ icon, label, active, onPress }: any) { return (<TouchableOpacity style={styles.tabItem} onPress={onPress}>{icon}<Text style={[styles.tabLabel, { color: active ? '#000' : '#a1a1aa' }]}>{label}</Text></TouchableOpacity>); }
function MealItem({ meal, onPress }: { meal: Meal; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.mealCard} onPress={onPress}>
      <Image source={{ uri: meal.image }} style={styles.mealImg} />
      <View style={styles.mealContent}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <View style={styles.macroTagRow}>
           <View style={styles.macroIndicatorRow}>
             <View style={[styles.smallMacroBar, {backgroundColor: '#34d399'}]} />
             <Text style={styles.macroText}>{meal.macros.protein}g P</Text>
      </View>
           <View style={styles.macroIndicatorRow}>
             <View style={[styles.smallMacroBar, {backgroundColor: '#60a5fa'}]} />
             <Text style={styles.macroText}>{meal.macros.carbs}g C</Text>
      </View>
           <View style={styles.macroIndicatorRow}>
             <View style={[styles.smallMacroBar, {backgroundColor: '#f472b6'}]} />
             <Text style={styles.macroText}>{meal.macros.fat}g F</Text>
      </View>
    </View>
      </View>
      <View style={{alignItems:'flex-end'}}><Text style={styles.mealCal}>{meal.calories}</Text><Text style={styles.mealUnit}>kcal</Text></View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f4f4f5', backgroundColor: '#fff', position: 'absolute', bottom: 0, width: '100%' },
  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  header: { position: 'absolute', top: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, zIndex: 100, backgroundColor: '#fff' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: '#71717a' },
  calendarStrip: { height: 80, borderBottomWidth: 1, borderBottomColor: '#f4f4f5', marginBottom: 20 },
  calendarItem: { width: 50, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  calDay: { color: '#a1a1aa', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  calDate: { color: '#18181b', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  calSub: { fontSize: 8, color: '#d4d4d8', fontWeight: 'bold' },
  calendarActive: { backgroundColor: '#18181b', borderRadius: 16, height: 60, marginTop: 10 },
  calDayActive: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  calDateActive: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  yellowDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fbbf24' },
  heroContainer: { alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 20 },
  birdPlaceholder: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  birdBody: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#000', backgroundColor: '#fff', position: 'relative' },
  birdBodyShadow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#000', top: 6, opacity: 0.2 },
  eyeLeft: { position: 'absolute', top: 40, left: 35, width: 12, height: 12, borderRadius: 6, backgroundColor: '#000' },
  eyeRight: { position: 'absolute', top: 40, right: 35, width: 12, height: 12, borderRadius: 6, backgroundColor: '#000' },
  beak: { position: 'absolute', top: 60, left: 60, width: 20, height: 20, backgroundColor: '#fbbf24', borderRadius: 4, transform: [{rotate: '45deg'}], borderWidth: 2, borderColor: '#000' },
  wing: { position: 'absolute', top: 80, right: -10, width: 40, height: 60, backgroundColor: '#fff', borderRadius: 20, borderWidth: 3, borderColor: '#000', transform: [{rotate: '-20deg'}] },
  fork: { position: 'absolute', right: 0, bottom: 40, transform: [{rotate: '20deg'}], zIndex: 10 },
  groundShadow: { width: 100, height: 20, borderRadius: 100, backgroundColor: '#000', opacity: 0.1, transform: [{scaleY: 0.3}], marginBottom: 20 },
  dataDisplay: { alignItems: 'center' },
  dataNumbers: { flexDirection: 'row', alignItems: 'baseline' },
  eatenNumber: { fontSize: 42, fontWeight: '900', color: '#000' },
  totalNumber: { fontSize: 42, fontWeight: '300', color: '#a1a1aa' },
  dataLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionTitle: { color: '#000', fontSize: 18, fontWeight: '700' },
  mealCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, marginHorizontal: 20, padding: 12, elevation: 3 },
  mealImg: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#f4f4f5' },
  mealContent: { flex: 1, marginLeft: 12 },
  mealName: { fontSize: 16, fontWeight: '700', color: '#18181b', marginBottom: 4 },
  macroTagRow: { flexDirection: 'row', marginTop: 8 },
  macroText: { fontSize: 12, color: '#71717a', fontWeight: '500' },
  macroIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  smallMacroBar: { width: 3, height: 12, borderRadius: 2, marginRight: 4 },
  macroSeparator: { fontSize: 12, color: '#d4d4d8', marginHorizontal: 4 },
  mealCal: { fontSize: 18, fontWeight: '900', color: '#18181b' },
  mealUnit: { fontSize: 10, color: '#a1a1aa', fontWeight: 'bold' },
  fabContainer: { position: 'absolute', bottom: 110, alignSelf: 'center', zIndex: 20 },
  fabPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 100 },
  scanIconFrame: { width: 24, height: 24, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16, marginTop: 20 },
  greetingText: { color: '#000', fontSize: 24, fontWeight: 'bold' },
  planBadge: { backgroundColor: '#f4f4f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  timeLabel: { fontWeight: '600', color: '#a1a1aa' },
  fastProgressBg: { height: 24, backgroundColor: '#f4f4f5', borderRadius: 12, overflow: 'hidden' },
  fastProgressFill: { height: '100%' },
  startFastBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, zIndex: 100 },
  weightTitle: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  summaryCard: { marginHorizontal: 24, backgroundColor: '#18181b', borderRadius: 24, padding: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  summaryValueLarge: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  goalLabel: { color: '#71717a', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  progressBarBg: { height: 12, backgroundColor: '#3f3f46', borderRadius: 6, overflow: 'hidden', marginTop: 20 },
  progressBarFill: { width: '0%', height: '100%', backgroundColor: '#71717a' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  progressLimit: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 16 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#f4f4f5', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentBtnActive: { backgroundColor: '#fff', elevation: 2 },
  segmentText: { fontSize: 14, color: '#71717a', fontWeight: '600' },
  segmentTextActive: { color: '#000', fontWeight: 'bold' },
  legendRow: { flexDirection: 'row', gap: 20, marginTop: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDash: { width: 12, height: 2, borderRadius: 1 },
  legendText: { fontSize: 12, color: '#71717a', fontWeight: '500' },
  historyHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f4f4f5', paddingBottom: 12, marginBottom: 16, marginTop: 20 },
  historyHeader: { fontSize: 12, color: '#a1a1aa', fontWeight: 'bold' },
  historyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  historyIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logWeightFab: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 30, gap: 8, elevation: 5 },
  logWeightText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  fastModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  endFastSheet: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center' },
  endFastTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 12, textAlign:'center' },
  endFastDesc: { fontSize: 14, color: '#71717a', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  continueFastBtn: { width: '100%', backgroundColor: '#000', paddingVertical: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  continueFastText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelFastBtn: { width: '100%', backgroundColor: '#f4f4f5', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  cancelFastText: { color: '#000', fontSize: 16, fontWeight: '600' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  modernPickerRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  modernPickerCard: { flex: 1, backgroundColor: '#f4f4f5', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  modernPickerCardActive: { borderColor: '#000', backgroundColor: '#fff' },
  modernPickerLabel: { fontSize: 10, fontWeight: 'bold', color: '#a1a1aa', marginBottom: 4 },
  modernPickerValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  camIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  camLogoText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  viewfinder: { flex: 1, margin: 40, justifyContent: 'space-between' },
  bracket: { position: 'absolute', width: 40, height: 40, borderColor: '#fff', borderWidth: 4 },
  bracketTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  bracketTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  bracketBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  bracketBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  camBottom: { paddingBottom: 50, alignItems: 'center' },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', paddingHorizontal: 40 },
  galleryBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  shutterOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  modeSwitcherContainer: { position: 'absolute', bottom: 20, width: '100%', alignItems: 'center' },
  modeSwitcher: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  modeText: { color: '#71717a', fontWeight: '600', fontSize: 12 },
  modeActive: { backgroundColor: '#333', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  modeTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  describeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 20 },
  describeHint: { fontSize: 12, color: '#a1a1aa', marginTop: 10 },
  manualTitleInput: { fontSize: 24, fontWeight: 'bold', color: '#000', flex: 1, marginRight: 10 },
  formSection: { paddingHorizontal: 24, marginBottom: 24 },
  formLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  inputRowFull: { width: '100%', height: 50, backgroundColor: '#f4f4f5', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingRight: 16 },
  textInput: { fontSize: 20, fontWeight: 'bold', width: '100%', textAlign: 'center' },
  textInputSmall: { fontSize: 16, fontWeight: 'bold', width: '100%', textAlign: 'center' },
  inputLabel: { fontWeight: '600', fontSize: 16 },
  inputBox: { width: 80, height: 40, backgroundColor: '#f4f4f5', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  macroInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f4f4f5', paddingBottom: 12 },
  continueBtn: { backgroundColor: '#f4f4f5', margin: 24, marginBottom: 100, padding: 16, borderRadius: 16, alignItems: 'center' },
  manualHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  describeContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 50, padding: 20 },
  manualContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 50 },
  describeHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  describeInput: { fontSize: 32, fontWeight: '300', textAlign: 'center', marginBottom: 40, color: '#000' },
  micButton: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center' },
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  editCard: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24 },
  editTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  editInputRow: { marginBottom: 16 },
  editLabel: { fontSize: 12, fontWeight: 'bold', color: '#a1a1aa', marginBottom: 4 },
  editInput: { borderBottomWidth: 1, borderBottomColor: '#e4e4e7', fontSize: 16, paddingVertical: 8 },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  deleteBtn: { padding: 12, borderRadius: 12, backgroundColor: '#fee2e2', width: 50, alignItems:'center' },
  saveBtn: { flex: 1, marginLeft: 12, backgroundColor: '#000', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  closeEdit: { position: 'absolute', top: 16, right: 16 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },  patternBg: { ...StyleSheet.absoluteFillObject, opacity: 0.5, zIndex: -1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  previewContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  charName: { fontSize: 32, fontWeight: '900', color: '#000' },
  previewData: { alignItems: 'center', opacity: 0.4 },
  previewNumbers: { fontSize: 24, fontWeight: 'bold' },
  previewLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  selectorContainer: { marginTop: 40, height: 200 },
  charCard: { width: 120, height: 160, backgroundColor: '#f4f4f5', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  charCardActive: { borderWidth: 3, borderColor: '#fbbf24', backgroundColor: '#fff' },
  cardThumb: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardSub: { fontSize: 12, color: '#a1a1aa' },
  cardSubPremium: { fontSize: 12, color: '#fbbf24', fontWeight: 'bold' },
  premiumBadge: { position: 'absolute', top: 8, right: 8 },
  planCard: { width: '48%', backgroundColor: '#f4f4f5', borderRadius: 20, padding: 16, marginBottom: 16 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planTitle: { fontWeight: 'bold', fontSize: 18 },
  planDesc: { color: '#71717a', fontSize: 12, marginBottom: 12 },
  planToggle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d4d4d8', alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center' },
  planToggleActive: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4ade80', alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center' },
  weightLogContainer: { flex: 1, backgroundColor: '#fff' },
  weightLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  weightLogTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  weightLogClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center' },
  todayLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  todayText: { fontSize: 14, color: '#f97316', fontWeight: '600' },
  photoSection: { alignItems: 'center', marginTop: 40, position: 'relative' },
  silhouetteContainer: { width: 200, height: 200, backgroundColor: '#f4f4f5', borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  silhouetteImg: { width: '100%', height: '100%' },
  addPhotoPill: { position: 'absolute', bottom: -20, backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, elevation: 4 },
  addPhotoText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  wheelSelectorSection: { marginTop: 80, height: 200, position: 'relative', justifyContent: 'center' },
  activeWeightBar: { position: 'absolute', left: 24, right: 24, height: 60, backgroundColor: '#f4f4f5', borderRadius: 16, zIndex: -1 },
  wheelsContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40 },
  wheelText: { fontSize: 32, fontWeight: 'bold', color: '#d4d4d8' },
  wheelTextActive: { color: '#000', fontSize: 40 },
  wheelDot: { fontSize: 40, fontWeight: 'bold', color: '#000', marginHorizontal: 10 },
  wheelUnitLarge: { fontSize: 24, fontWeight: 'bold', color: '#000', marginLeft: 10, marginTop: 10 },
  weightLogFooter: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  saveWeightBtn: { backgroundColor: '#000', paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  saveWeightText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  weightMenuSheet: { width: '85%', backgroundColor: '#fff', borderRadius: 24, paddingVertical: 10, overflow: 'hidden' },
  menuOption: { paddingVertical: 20, alignItems: 'center', width: '100%' },
  menuOptionText: { fontSize: 18, color: '#000', fontWeight: '500' },
  menuSeparator: { height: 1, backgroundColor: '#f4f4f5', width: '100%' },
  
  // --- WELLNESS STYLES ---
  well_headerContainer: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 20 },
  well_headerTitle: { fontSize: 34, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  well_carouselContainer: { paddingLeft: 24, paddingRight: 12, gap: 16, marginBottom: 32 },
  well_tipCard: { width: 160, height: 160, borderRadius: 24, padding: 20, justifyContent: 'space-between' },
  well_tipIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  well_tipText: { fontSize: 16, fontWeight: '700', color: '#000', lineHeight: 20 },
  well_section: { paddingHorizontal: 24 },
  well_sectionTitle: { fontSize: 20, fontWeight: '800', color: '#000', marginBottom: 16 },
  well_waterCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, marginBottom: 16 },
  well_waterIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#E6F4FF', alignItems: 'center', justifyContent: 'center' },
  well_cardLabel: { fontSize: 12, fontWeight: '700', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1 },
  well_cardValue: { fontSize: 24, fontWeight: '900', color: '#000', marginTop: 2 },
  well_plusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  well_healthConnectBanner: { backgroundColor: '#EEF2FF', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  well_bannerTitle: { fontSize: 16, fontWeight: '800', color: '#000' },
  well_bannerSub: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  well_toggle: { width: 44, height: 24, borderRadius: 22, backgroundColor: '#D1D5DB', padding: 2 },
  well_toggleActive: { backgroundColor: '#6366f1' },
  well_toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  well_toggleDotActive: { transform: [{ translateX: 20 }] },
  well_metricsGrid: { flexDirection: 'row', gap: 16 },
  well_metricSquare: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, alignItems: 'flex-start' },
  well_metricIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  well_metricValue: { fontSize: 28, fontWeight: '900', color: '#000' },
  well_metricLabel: { fontSize: 14, fontWeight: '700', color: '#8c8c8c' },
  well_metricGoal: { fontSize: 10, fontWeight: '600', color: '#bfbfbf', marginTop: 4 },
  well_miniPlus: { position: 'absolute', top: 20, right: 20, width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  well_modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  well_modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 50, alignItems: 'center' },
  well_modalTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 8 },
  well_modalSub: { fontSize: 14, color: '#8c8c8c', fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  well_pickerContainer: { width: '100%', height: 150, position: 'relative', justifyContent: 'center', marginBottom: 40 },
  well_pickerSelectionBar: { position: 'absolute', left: 0, right: 0, height: 50, backgroundColor: '#f5f5f5', borderRadius: 12, zIndex: -1 },
  well_pickerText: { fontSize: 24, fontWeight: '600', color: '#d9d9d9' },
  well_pickerTextActive: { color: '#000', fontSize: 32, fontWeight: '900' },
  well_pickerUnit: { fontSize: 20, fontWeight: '900', color: '#000', marginLeft: 10, marginTop: 4 },
  well_pickerUnitSmall: { fontSize: 14, fontWeight: '700', color: '#8c8c8c', marginHorizontal: 8 },
  well_primaryBtn: { width: '100%', height: 64, backgroundColor: '#000', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  well_primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  well_secondaryBtn: { width: '100%', height: 64, backgroundColor: '#f5f5f5', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  well_secondaryBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
  well_stepIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F6FFED', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  well_stepDescText: { fontSize: 16, color: '#595959', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  well_stepGoalBox: { alignItems: 'center', marginBottom: 40 },
  well_stepGoalLabel: { fontSize: 12, fontWeight: '800', color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1 },
  well_stepGoalValue: { fontSize: 56, fontWeight: '900', color: '#000', marginTop: 4 },
  well_primaryBtnPill: { width: '100%', height: 60, backgroundColor: '#000', borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  well_activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  well_activityHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#000' },
  well_activityInputSection: { padding: 24 },
  well_activityPrompt: { fontSize: 14, fontWeight: '700', color: '#000', marginBottom: 16 },
  well_activityInput: { backgroundColor: '#f5f5f5', borderRadius: 16, padding: 20, fontSize: 16, height: 100, textAlignVertical: 'top', color: '#000', marginBottom: 16 },
  well_addActivityBtn: { backgroundColor: '#000', borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center' },
  well_addActivityBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  well_activitySeparator: { paddingHorizontal: 24, marginBottom: 24 },
  well_activitySeparatorText: { fontSize: 14, fontWeight: '700', color: '#bfbfbf' },
  well_activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  well_activityIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#52C41A', alignItems: 'center', justifyContent: 'center' },
  well_activityName: { fontSize: 16, fontWeight: '800', color: '#000' },
  well_activitySub: { fontSize: 12, color: '#8c8c8c', fontWeight: '600', marginTop: 2 },
  well_activityPlus: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  well_tipDetailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  well_tipDetailSheet: { width: '100%', backgroundColor: '#fff', borderRadius: 32, padding: 32, alignItems: 'center', elevation: 10 },
  well_tipDetailIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  well_tipDetailTitle: { fontSize: 26, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 24 },
  well_tipDetailContent: { width: '100%', maxHeight: 300 },
  well_tipInfoSection: { marginBottom: 24, width: '100%' },
  well_tipInfoLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  well_tipInfoText: { fontSize: 16, color: '#434343', lineHeight: 24, fontWeight: '500' },
});
