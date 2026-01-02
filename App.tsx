import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform, Vibration, Modal, Animated, Easing, TextInput, FlatList, Dimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
const FileSystem = require('expo-file-system/legacy');
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import ScrollPicker from 'react-native-wheel-scrollview-picker';
import LineChart from 'react-native-chart-kit/dist/line-chart/LineChart';
import { Plus, Activity, Zap, Droplets, Camera, Flame, Home, User, ScanLine, ChevronRight, Settings, Target, Ruler, Weight, PawPrint, Utensils, Heart, Scale, Scan, X, Crown, Clover, Rabbit, Rat, Carrot, Info, Apple, Image as ImageIcon, Barcode, Mic, Wheat, Beef, Trash2, Save, ChevronLeft, Citrus, Egg, Nut, Circle, MoreVertical, ArrowRight } from 'lucide-react-native';

const GEMINI_API_KEY = "AIzaSyDc5wCtTu4zeTLDN3ihJXdhTxDJV5CqLIo"; 

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
  const [weightHistory, setWeightHistory] = useState([{ id: '1', weight: 75, date: '01 Jan', change: '' }]);
  const [weightUnit, setWeightUnit] = useState('Days');

  // Appearance / Character
  const [selectedChar, setSelectedChar] = useState('quacky');
  const [scanMode, setScanMode] = useState<'describe' | 'photo' | 'manual'>('photo');
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

  // --- DYNAMIC CALCULATIONS ---
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
  useEffect(() => {
    startBreathing(); startBlinking(); startFabBounce(); startWaving();
  }, []);

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
  const startFasting = (startTime: Date) => { setFastStartTime(startTime); setIsFasting(true); Vibration.vibrate(50); setShowFastStartModal(false); };
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
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const data = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
      const newMeal: Meal = { id: Date.now().toString(), name: data.food_name, calories: data.calories, macros: data.macros, image: input.uri || 'https://via.placeholder.com/100', dateLabel: currentDayLabel };
      setMeals(prev => [newMeal, ...prev]); Vibration.vibrate(50);
    } catch (e) { Alert.alert("AI Error", "Failed to connect to Google AI."); } finally { setLoading(false); }
  };

  const openEdit = (meal: Meal) => { setEditingMeal({...meal}); setShowEdit(true); };
  const saveEdit = () => { if (!editingMeal) return; setMeals(prev => prev.map(m => m.id === editingMeal.id ? editingMeal : m)); setShowEdit(false); Vibration.vibrate(20); };
  const deleteMeal = () => { if (!editingMeal) return; setMeals(prev => prev.filter(m => m.id !== editingMeal.id)); setShowEdit(false); Vibration.vibrate(50); };

  // --- RENDERS ---
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
      {scanMode === 'photo' && (<>{permission?.granted && <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />}<SafeAreaView style={styles.cameraHeader}><TouchableOpacity style={styles.camIconBtn}><Info size={24} color="#fff" /></TouchableOpacity><View style={{flexDirection:'row', alignItems:'center'}}><Apple size={20} color="#fff" fill="#fff" style={{marginRight:8}} /><Text style={styles.camLogoText}>Calz</Text></View><TouchableOpacity style={styles.camIconBtn} onPress={() => setShowCamera(false)}><X size={24} color="#fff" /></TouchableOpacity></SafeAreaView><View style={styles.viewfinder}><View style={[styles.bracket, styles.bracketTL]} /><View style={[styles.bracket, styles.bracketTR]} /><View style={[styles.bracket, styles.bracketBL]} /><View style={[styles.bracket, styles.bracketBR]} /></View><View style={styles.camBottom}><View style={styles.shutterRow}><TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}><ImageIcon size={24} color="#fff" /></TouchableOpacity><TouchableOpacity style={styles.shutterOuter} onPress={takePicture}><View style={styles.shutterInner} /></TouchableOpacity><View style={{width: 50}} /></View></View></>)}
      {scanMode === 'describe' && (<View style={styles.describeContainer}><View style={styles.describeHeader}><X size={24} color="#000" onPress={() => setShowCamera(false)} /></View><TextInput style={styles.describeInput} placeholder="Describe..." value={describeText} onChangeText={setDescribeText} multiline /><TouchableOpacity style={styles.micButton} onPress={submitDescription}><Mic size={40} color="#000" /></TouchableOpacity></View>)}
      {scanMode === 'manual' && (<View style={styles.manualContainer}><View style={styles.manualHeader}><TextInput style={styles.manualTitleInput} placeholder="Food name..." value={manualData.name} onChangeText={(t) => setManualData({...manualData, name: t})} /><X size={24} color="#000" onPress={() => setShowCamera(false)} /></View></View>)}
      <View style={styles.modeSwitcherContainer}><View style={styles.modeSwitcher}><TouchableOpacity onPress={() => setScanMode('describe')}><Text style={{color:'#fff', fontWeight:'600'}}>DESCRIBE</Text></TouchableOpacity><TouchableOpacity onPress={() => setScanMode('photo')}><Text style={{color:'#fff', fontWeight:'600'}}>PHOTO</Text></TouchableOpacity><TouchableOpacity onPress={() => setScanMode('manual')}><Text style={{color:'#fff', fontWeight:'600'}}>MANUAL</Text></TouchableOpacity></View></View>
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

  const renderWeight = () => (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.weightHeader}><Text style={styles.weightTitle}>Weight</Text><MoreVertical size={24} color="#000" /></View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View><Text style={styles.summaryLabel}>YOU'VE GAINED</Text><Text style={styles.summaryValue}>0 kg</Text></View>
            <View style={{alignItems: 'flex-end'}}><Text style={styles.summaryLabel}>CURRENT WEIGHT</Text><Text style={styles.summaryValueLarge}>75 kg</Text></View>
          </View>
          <View style={{marginTop: 20}}><Text style={styles.goalLabel}>0% GOAL REACHED</Text>
            <View style={styles.progressBarBg}><View style={styles.progressBarFill} /></View>
            <View style={styles.progressLabels}><Text style={styles.progressLimit}>75 kg</Text><ArrowRight size={14} color="#fff" /><Text style={styles.progressLimit}>75 kg</Text></View>
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
              data={{ labels: ["28.12", "01.01", "02.01"], datasets: [{ data: [75], color: () => '#3b82f6' }, { data: [75, 75, 75], withDots: false, color: () => '#ef4444' }] }}
              width={Dimensions.get("window").width} height={220}
              chartConfig={{ backgroundColor: "#fff", backgroundGradientFrom: "#fff", backgroundGradientTo: "#fff", color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, labelColor: () => '#a1a1aa', propsForBackgroundLines: { strokeDasharray: "" } }}
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
          {weightHistory.map(item => (
            <View key={item.id} style={styles.historyItem}><View style={styles.historyIconBox}><User size={20} color="#71717a" /></View><Text style={{flex: 1, fontWeight:'bold'}}>{item.weight} kg</Text><Text style={{flex: 1, textAlign:'center', color:'#a1a1aa'}}>{item.change}</Text><Text style={{flex: 1, textAlign:'right', color:'#a1a1aa'}}>{item.date}</Text></View>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.logWeightFab}><Plus size={20} color="#fff" /><Text style={styles.logWeightText}>Log Weight</Text></TouchableOpacity>
    </View>
  );

  const renderFastStartModal = () => (
    <View style={styles.fastModalOverlay}><View style={styles.endFastSheet}>
      <Text style={styles.endFastTitle}>When was your last meal?</Text>
      <TouchableOpacity style={styles.continueFastBtn} onPress={() => startFasting(new Date())}><Text style={styles.continueFastText}>Now</Text></TouchableOpacity>
      <TouchableOpacity style={styles.cancelFastBtn} onPress={() => { setShowFastStartModal(false); setShowPicker(true); setPickerMode('date'); }}><Text style={styles.cancelFastText}>Choose exact time & date</Text></TouchableOpacity>
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
        <TouchableOpacity style={styles.cancelFastBtn} onPress={() => { setIsFasting(false); setFastStartTime(null); setShowEndFastModal(false); }}><Text style={styles.cancelFastText}>Cancel this fast</Text></TouchableOpacity>
      </View></View>
    );
  };

  const renderPickerModal = () => (
    <Modal transparent animationType="slide" visible={showPicker}>
      <View style={styles.pickerOverlay}><View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}><Text style={styles.pickerTitle}>Set Fasting Start</Text><X size={24} color="#000" onPress={() => setShowPicker(false)} /></View>
        <View style={styles.modernPickerRow}>
          <TouchableOpacity style={[styles.modernPickerCard, pickerMode === 'date' && styles.modernPickerCardActive]} onPress={() => setPickerMode('date')}><Text style={styles.modernPickerLabel}>DATE</Text><Text style={styles.modernPickerValue}>{dateList[selDateIdx].label}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.modernPickerCard, pickerMode === 'time' && styles.modernPickerCardActive]} onPress={() => setPickerMode('time')}><Text style={styles.modernPickerLabel}>TIME</Text><Text style={styles.modernPickerValue}>{selHour.toString().padStart(2, '0')}:{selMin.toString().padStart(2, '0')}</Text></TouchableOpacity>
        </View>
        <View style={{height: 200, marginBottom: 20}}>
          {pickerMode === 'date' ? (
            <ScrollPicker dataSource={dateList.map(d => d.label)} selectedIndex={selDateIdx} onValueChange={(_, i) => setSelDateIdx(i)} wrapperHeight={200} itemHeight={50} highlightColor="#000" highlightBorderWidth={2} />
          ) : (
            <View style={{flexDirection:'row'}}><ScrollPicker dataSource={hours} selectedIndex={selHour} onValueChange={(_, i) => setSelHour(i)} wrapperHeight={200} itemHeight={50} highlightColor="#000" highlightBorderWidth={2} /><ScrollPicker dataSource={minutes} selectedIndex={selMin} onValueChange={(_, i) => setSelMin(i)} wrapperHeight={200} itemHeight={50} highlightColor="#000" highlightBorderWidth={2} /></View>
          )}
        </View>
        <TouchableOpacity style={styles.continueFastBtn} onPress={() => { const d = new Date(dateList[selDateIdx].value); d.setHours(selHour, selMin); startFasting(d); setShowPicker(false); }}><Text style={styles.continueFastText}>Confirm & Start Fast</Text></TouchableOpacity>
      </View></View>
    </Modal>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        {activeTab === 'home' && renderHome()}
        {activeTab === 'fasting' && renderFasting()}
        {activeTab === 'weight' && renderWeight()}
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
        <Modal visible={showFastStartModal} transparent animationType="fade">{renderFastStartModal()}</Modal>
        <Modal visible={showEndFastModal} transparent animationType="fade">{renderEndFastModal()}</Modal>
        {renderPickerModal()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function TabItem({ icon, label, active, onPress }: any) { return (<TouchableOpacity style={styles.tabItem} onPress={onPress}>{icon}<Text style={[styles.tabLabel, { color: active ? '#000' : '#a1a1aa' }]}>{label}</Text></TouchableOpacity>); }
function MealItem({ meal, onPress }: { meal: Meal; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.mealCard} onPress={onPress}>
      <Image source={{ uri: meal.image }} style={styles.mealImg} />
      <View style={styles.mealContent}><Text style={styles.mealName}>{meal.name}</Text><Text style={styles.macroText}>{meal.macros.protein}p {meal.macros.carbs}c {meal.macros.fat}f</Text></View>
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
  macroText: { fontSize: 12, color: '#71717a' },
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
  weightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
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
  modeSwitcher: { flexDirection: 'row', gap: 20 },
  describeContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 50, padding: 20 },
  describeHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  describeInput: { fontSize: 32, fontWeight: '300', textAlign: 'center', marginBottom: 40 },
  micButton: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: '#f4f4f5', alignItems: 'center', justifyContent: 'center' },
});