import React, { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const C = {
  bg: '#0f1923',
  card: '#1a2634',
  cardBorder: '#243447',
  green: '#53d22c',
  greenDark: '#3aa81e',
  greenGlow: 'rgba(83,210,44,0.15)',
  text: '#ffffff',
  textMuted: '#8a9bb0',
  textDim: '#4a5f75',
  red: '#ff4757',
  yellow: '#ffa502',
  blue: '#1e90ff',
  purple: '#a855f7',
};

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}
function getTodayDayIndex() {
  return new Date().getDay();
}

// TDEE Calculator
function calculateTDEE(metrics) {
  const { weight, height, age, sex, activity, goal, pace } = metrics;
  const weightKg = weight * 0.453592;
  const heightCm = ((parseInt(height.split("'")[0]) * 12) + parseInt(height.split("'")[1] || 0)) * 2.54;
  let bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const activityMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  let tdee = bmr * (activityMap[activity] || 1.55);
  const paceCalories = { 0.5: 250, 1: 500, 1.5: 750, 2: 1000 };
  const adjustment = paceCalories[pace] || 500;
  if (goal === 'lose') tdee -= adjustment;
  if (goal === 'gain') tdee += adjustment;
  return Math.round(tdee);
}

function calculateMacros(calories, goal) {
  let proteinPct = 0.3, carbPct = 0.4, fatPct = 0.3;
  if (goal === 'lose') { proteinPct = 0.35; carbPct = 0.35; fatPct = 0.3; }
  if (goal === 'gain') { proteinPct = 0.3; carbPct = 0.45; fatPct = 0.25; }
  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
  };
}

function App() {
  const [page, setPage] = useState('home');
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [setupDone, setSetupDone] = useState(false);
  const [foodLog, setFoodLog] = useState({});

  function handleSetupComplete(metrics) {
    setHealthMetrics(metrics);
    setSetupDone(true);
    setPage('home');
  }

  if (!setupDone) {
    return <SetupFlow onComplete={handleSetupComplete} />;
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: '430px', margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, color: C.text }}>
      <Header />
      {page === 'home' && <HomePage setPage={setPage} />}
      {page === 'checkin' && <CheckInPage setPage={setPage} />}
      {page === 'todos' && <TodoPage setPage={setPage} />}
      {page === 'calories' && <CaloriePage setPage={setPage} metrics={healthMetrics} foodLog={foodLog} setFoodLog={setFoodLog} />}
      {page === 'weight' && <ComingSoon setPage={setPage} title="⚖️ Weight Monitor" />}
      {page === 'habits' && <ComingSoon setPage={setPage} title="🔥 Habit Tracker" />}
      {page === 'recipes' && <ComingSoon setPage={setPage} title="🥗 Recipes & Grocery" />}
      {page === 'settings' && <SettingsPage setPage={setPage} metrics={healthMetrics} setMetrics={setHealthMetrics} />}
    </div>
  );
}

// ─── SETUP FLOW ───────────────────────────────────────────────────────────────
function SetupFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [metrics, setMetrics] = useState({
    name: 'Henry', age: '', sex: 'male', weight: '', height: "'", heightFt: '', heightIn: '',
    activity: 'moderate', goal: 'lose', pace: 1,
  });

  function update(key, val) {
    setMetrics(prev => ({ ...prev, [key]: val }));
  }

  function next() { setStep(s => s + 1); }
  function back() { setStep(s => s - 1); }

  function finish() {
    const finalMetrics = {
      ...metrics,
      height: `${metrics.heightFt}'${metrics.heightIn}`,
      weight: parseFloat(metrics.weight),
      age: parseInt(metrics.age),
      pace: parseFloat(metrics.pace),
    };
    onComplete(finalMetrics);
  }

  const steps = [
    // Step 0 - Welcome
    <div style={setupCard}>
      <p style={setupEmoji}>👋</p>
      <p style={setupTitle}>Welcome to Your Life App</p>
      <p style={setupSub}>Let's set up your health profile so we can personalize everything for you. This only takes 2 minutes.</p>
      <GreenButton onClick={next}>LET'S GO</GreenButton>
    </div>,

    // Step 1 - Basic Info
    <div style={setupCard}>
      <p style={setupStep}>Step 1 of 4</p>
      <p style={setupTitle}>Basic Info</p>
      <SetupLabel>Your Name</SetupLabel>
      <SetupInput placeholder="First name" value={metrics.name} onChange={e => update('name', e.target.value)} />
      <SetupLabel>Age</SetupLabel>
      <SetupInput placeholder="e.g. 28" type="number" value={metrics.age} onChange={e => update('age', e.target.value)} />
      <SetupLabel>Sex</SetupLabel>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {[['male', '♂ Male'], ['female', '♀ Female']].map(([val, label]) => (
          <button key={val} onClick={() => update('sex', val)}
            style={pillBtn(metrics.sex === val)}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <OutlineButton onClick={back}>Back</OutlineButton>
        <GreenButton onClick={next}>Next</GreenButton>
      </div>
    </div>,

    // Step 2 - Body Metrics
    <div style={setupCard}>
      <p style={setupStep}>Step 2 of 4</p>
      <p style={setupTitle}>Body Metrics</p>
      <SetupLabel>Current Weight (lbs)</SetupLabel>
      <SetupInput placeholder="e.g. 185" type="number" value={metrics.weight} onChange={e => update('weight', e.target.value)} />
      <SetupLabel>Height</SetupLabel>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <SetupInput placeholder="ft" type="number" value={metrics.heightFt} onChange={e => update('heightFt', e.target.value)} style={{ marginBottom: 0 }} />
        <SetupInput placeholder="in" type="number" value={metrics.heightIn} onChange={e => update('heightIn', e.target.value)} style={{ marginBottom: 0 }} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <OutlineButton onClick={back}>Back</OutlineButton>
        <GreenButton onClick={next}>Next</GreenButton>
      </div>
    </div>,

    // Step 3 - Activity Level
    <div style={setupCard}>
      <p style={setupStep}>Step 3 of 4</p>
      <p style={setupTitle}>Activity Level</p>
      <p style={{ color: C.textMuted, fontSize: '14px', marginBottom: '16px' }}>How active are you on a typical day?</p>
      {[
        ['sedentary', '🪑 Sedentary', 'Little or no exercise'],
        ['light', '🚶 Lightly Active', 'Exercise 1-3 days/week'],
        ['moderate', '🏃 Moderately Active', 'Exercise 3-5 days/week'],
        ['active', '💪 Very Active', 'Exercise 6-7 days/week'],
        ['very_active', '🔥 Extremely Active', 'Physical job + daily exercise'],
      ].map(([val, label, sub]) => (
        <button key={val} onClick={() => update('activity', val)}
          style={{ width: '100%', padding: '12px 14px', marginBottom: '8px', backgroundColor: metrics.activity === val ? C.greenGlow : '#0f1923', border: `1px solid ${metrics.activity === val ? C.green : C.cardBorder}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', color: C.text }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: metrics.activity === val ? C.green : C.text }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMuted }}>{sub}</p>
        </button>
      ))}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <OutlineButton onClick={back}>Back</OutlineButton>
        <GreenButton onClick={next}>Next</GreenButton>
      </div>
    </div>,

    // Step 4 - Goal
    <div style={setupCard}>
      <p style={setupStep}>Step 4 of 4</p>
      <p style={setupTitle}>Your Goal</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[['lose', '📉 Lose Weight'], ['maintain', '⚖️ Maintain'], ['gain', '📈 Gain Weight']].map(([val, label]) => (
          <button key={val} onClick={() => update('goal', val)}
            style={{ flex: 1, padding: '12px 6px', borderRadius: '10px', border: `1px solid ${metrics.goal === val ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: metrics.goal === val ? C.greenGlow : '#0f1923', color: metrics.goal === val ? C.green : C.textMuted, fontWeight: '700', fontSize: '12px' }}>
            {label}
          </button>
        ))}
      </div>

      {metrics.goal !== 'maintain' && (
        <>
          <SetupLabel>Weekly Pace (lbs/week)</SetupLabel>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {['0.5', '1', '1.5', '2'].map(p => (
              <button key={p} onClick={() => update('pace', p)}
                style={{ flex: 1, padding: '10px 6px', borderRadius: '10px', border: `1px solid ${String(metrics.pace) === p ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: String(metrics.pace) === p ? C.greenGlow : '#0f1923', color: String(metrics.pace) === p ? C.green : C.textMuted, fontWeight: '700', fontSize: '13px' }}>
                {p} lb
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <OutlineButton onClick={back}>Back</OutlineButton>
        <GreenButton onClick={finish}>FINISH SETUP</GreenButton>
      </div>
    </div>,
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: '430px', margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {steps[step]}
    </div>
  );
}

const setupCard = { width: '100%', backgroundColor: C.card, borderRadius: '16px', padding: '28px 24px', border: `1px solid ${C.cardBorder}` };
const setupEmoji = { fontSize: '48px', textAlign: 'center', margin: '0 0 16px' };
const setupTitle = { fontSize: '22px', fontWeight: '800', color: C.text, margin: '0 0 10px', textAlign: 'center' };
const setupSub = { fontSize: '14px', color: C.textMuted, textAlign: 'center', margin: '0 0 24px', lineHeight: '1.6' };
const setupStep = { fontSize: '12px', fontWeight: '700', color: C.green, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px', textAlign: 'center' };

function SetupLabel({ children }) {
  return <p style={{ fontSize: '12px', fontWeight: '700', color: C.textMuted, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>{children}</p>;
}
function SetupInput({ placeholder, value, onChange, type = 'text', style = {} }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0f1923', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', fontSize: '15px', color: C.text, boxSizing: 'border-box', marginBottom: '14px', outline: 'none', ...style }} />
  );
}

// ─── CALORIE PAGE ─────────────────────────────────────────────────────────────
function CaloriePage({ setPage, metrics, foodLog, setFoodLog }) {
  const today = getTodayStr();
  const dailyCalories = calculateTDEE(metrics);
  const macros = calculateMacros(dailyCalories, metrics.goal);
  const [activeTab, setActiveTab] = useState('log');
  const [activeMeal, setActiveMeal] = useState('Breakfast');
  const [foodInput, setFoodInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const todayLog = foodLog[today] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };

  function getAllEntries() {
    return [...(todayLog.Breakfast || []), ...(todayLog.Lunch || []), ...(todayLog.Dinner || []), ...(todayLog.Snacks || [])];
  }

  const allEntries = getAllEntries();
  const totalCals = allEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = allEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = allEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = allEntries.reduce((s, e) => s + e.fat, 0);
  const remaining = dailyCalories - totalCals;

  function estimateFood(text) {
    const lower = text.toLowerCase();

    // Detect quantity at the start (e.g. "4 eggs", "2 cups rice", "3 slices bread")
    const quantityMatch = lower.match(/^(\d+\.?\d*)\s*/);
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1;

    const foods = [
      { keywords: ['chicken breast', 'grilled chicken'], cal: 165, p: 31, c: 0, f: 4 },
      { keywords: ['rice', 'white rice'], cal: 206, p: 4, c: 45, f: 0 },
      { keywords: ['brown rice'], cal: 216, p: 5, c: 45, f: 2 },
      { keywords: ['egg', 'eggs'], cal: 78, p: 6, c: 1, f: 5 },
      { keywords: ['oatmeal', 'oats'], cal: 150, p: 5, c: 27, f: 3 },
      { keywords: ['banana'], cal: 105, p: 1, c: 27, f: 0 },
      { keywords: ['apple'], cal: 95, p: 0, c: 25, f: 0 },
      { keywords: ['salmon'], cal: 208, p: 20, c: 0, f: 13 },
      { keywords: ['steak', 'beef'], cal: 271, p: 26, c: 0, f: 18 },
      { keywords: ['pasta', 'spaghetti'], cal: 220, p: 8, c: 43, f: 1 },
      { keywords: ['pizza'], cal: 285, p: 12, c: 36, f: 10 },
      { keywords: ['burger', 'hamburger'], cal: 354, p: 20, c: 29, f: 17 },
      { keywords: ['salad'], cal: 120, p: 3, c: 10, f: 7 },
      { keywords: ['sandwich'], cal: 300, p: 15, c: 35, f: 10 },
      { keywords: ['protein shake', 'protein powder'], cal: 130, p: 25, c: 5, f: 2 },
      { keywords: ['greek yogurt', 'yogurt'], cal: 100, p: 17, c: 6, f: 0 },
      { keywords: ['coffee'], cal: 5, p: 0, c: 1, f: 0 },
      { keywords: ['orange juice', 'oj'], cal: 112, p: 2, c: 26, f: 0 },
      { keywords: ['milk'], cal: 122, p: 8, c: 12, f: 5 },
      { keywords: ['bread', 'toast'], cal: 79, p: 3, c: 15, f: 1 },
      { keywords: ['avocado'], cal: 160, p: 2, c: 9, f: 15 },
      { keywords: ['sweet potato'], cal: 103, p: 2, c: 24, f: 0 },
      { keywords: ['broccoli'], cal: 55, p: 4, c: 11, f: 1 },
      { keywords: ['almonds', 'almond'], cal: 164, p: 6, c: 6, f: 14 },
      { keywords: ['peanut butter'], cal: 188, p: 8, c: 6, f: 16 },
      { keywords: ['tuna'], cal: 179, p: 39, c: 0, f: 1 },
      { keywords: ['chips'], cal: 152, p: 2, c: 15, f: 10 },
      { keywords: ['cookie', 'cookies'], cal: 148, p: 2, c: 21, f: 7 },
      { keywords: ['soda', 'coke', 'pepsi'], cal: 140, p: 0, c: 39, f: 0 },
      { keywords: ['water'], cal: 0, p: 0, c: 0, f: 0 },
    ];

    for (const food of foods) {
      if (food.keywords.some(k => lower.includes(k))) {
        return {
          calories: Math.round(food.cal * quantity),
          protein: Math.round(food.p * quantity),
          carbs: Math.round(food.c * quantity),
          fat: Math.round(food.f * quantity),
        };
      }
    }
    return { calories: Math.round(200 * quantity), protein: Math.round(8 * quantity), carbs: Math.round(25 * quantity), fat: Math.round(7 * quantity) };
  }

  function addFood() {
    if (!foodInput.trim()) return;
    const estimate = estimateFood(foodInput);
    const entry = { id: Date.now(), name: foodInput, ...estimate };
    const updated = { ...todayLog, [activeMeal]: [...(todayLog[activeMeal] || []), entry] };
    setFoodLog({ ...foodLog, [today]: updated });
    setFoodInput('');
    setAdding(false);
  }

  function removeEntry(meal, id) {
    const updated = { ...todayLog, [meal]: todayLog[meal].filter(e => e.id !== id) };
    setFoodLog({ ...foodLog, [today]: updated });
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAnalyzing(true);
    setPhotoMode(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1];
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
                { type: 'text', text: 'Look at this meal photo and estimate the nutrition. Respond ONLY with a JSON object like this: {"description":"what you see","items":[{"name":"food item","calories":200,"protein":10,"carbs":25,"fat":8}],"total":{"calories":200,"protein":10,"carbs":25,"fat":8}}. No other text.' }
              ]
            }]
          })
        });
        const data = await response.json();
        const text = data.content[0].text;
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        setAnalysisResult(parsed);
      } catch (err) {
        setAnalysisResult({ error: true });
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  }

  function addPhotoMeal() {
    if (!analysisResult || analysisResult.error) return;
    const entry = {
      id: Date.now(),
      name: analysisResult.description,
      calories: analysisResult.total.calories,
      protein: analysisResult.total.protein,
      carbs: analysisResult.total.carbs,
      fat: analysisResult.total.fat,
    };
    const updated = { ...todayLog, [activeMeal]: [...(todayLog[activeMeal] || []), entry] };
    setFoodLog({ ...foodLog, [today]: updated });
    setPhotoMode(false);
    setAnalysisResult(null);
  }

  function ProgressBar({ value, max, color }) {
    const pct = Math.min((value / max) * 100, 100);
    const over = value > max;
    return (
      <div style={{ backgroundColor: '#0f1923', borderRadius: '6px', height: '8px', overflow: 'hidden', marginTop: '4px' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: over ? C.red : color, borderRadius: '6px', transition: 'width 0.3s' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <BackButton setPage={setPage} to="home" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>🍎 Calorie Tracker</p>
        <button onClick={() => setPage('settings')} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '22px' }}>⚙️</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: C.card, borderRadius: '10px', padding: '4px', border: `1px solid ${C.cardBorder}` }}>
        {[['log', '📋 Log'], ['stats', '📊 Stats']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '8px', backgroundColor: activeTab === key ? C.green : 'transparent', color: activeTab === key ? C.bg : C.textMuted, fontWeight: '700', fontSize: '14px' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'log' && (
        <>
          {/* Daily Summary Card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: C.textMuted, fontWeight: '700' }}>CALORIES TODAY</p>
                <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: '800', color: remaining < 0 ? C.red : C.green, lineHeight: 1 }}>{totalCals}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.textMuted }}>of {dailyCalories} goal</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '13px', color: C.textMuted, fontWeight: '700' }}>{remaining < 0 ? 'OVER BY' : 'REMAINING'}</p>
                <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: remaining < 0 ? C.red : C.text }}>{Math.abs(remaining)}</p>
              </div>
            </div>
            <ProgressBar value={totalCals} max={dailyCalories} color={C.green} />

            {/* Macros */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              {[
                { label: 'Protein', val: totalProtein, goal: macros.protein, color: C.blue },
                { label: 'Carbs', val: totalCarbs, goal: macros.carbs, color: C.yellow },
                { label: 'Fat', val: totalFat, goal: macros.fat, color: C.purple },
              ].map(m => (
                <div key={m.label} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: C.textMuted, fontWeight: '700' }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: m.color, fontWeight: '700' }}>{m.val}g</p>
                  </div>
                  <ProgressBar value={m.val} max={m.goal} color={m.color} />
                  <p style={{ margin: '3px 0 0', fontSize: '10px', color: C.textDim }}>goal: {m.goal}g</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Meal Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
              <button key={meal} onClick={() => setActiveMeal(meal)}
                style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${activeMeal === meal ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: activeMeal === meal ? C.greenGlow : C.card, color: activeMeal === meal ? C.green : C.textMuted, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {meal}
                {todayLog[meal]?.length > 0 && <span style={{ marginLeft: '6px', backgroundColor: C.green, color: C.bg, borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>{todayLog[meal].length}</span>}
              </button>
            ))}
          </div>

          {/* Meal Entries */}
          {(todayLog[activeMeal] || []).length === 0 && !adding && (
            <p style={{ textAlign: 'center', color: C.textMuted, padding: '20px 0', fontSize: '14px' }}>Nothing logged for {activeMeal} yet</p>
          )}
          {(todayLog[activeMeal] || []).map(entry => (
            <div key={entry.id} style={{ backgroundColor: C.card, borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', border: `1px solid ${C.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: C.text }}>{entry.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: C.textMuted }}>
                  <span style={{ color: C.blue }}>P: {entry.protein}g</span> · <span style={{ color: C.yellow }}>C: {entry.carbs}g</span> · <span style={{ color: C.purple }}>F: {entry.fat}g</span>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: C.green }}>{entry.calories}</p>
                <button onClick={() => removeEntry(activeMeal, entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, fontSize: '16px' }}>✕</button>
              </div>
            </div>
          ))}

          {/* Add Food */}
          {adding && !photoMode && (
            <Card>
              <SectionLabel>Log Food</SectionLabel>
              <StyledInput placeholder="e.g. chicken breast, 2 eggs, oatmeal..." value={foodInput}
                onChange={e => setFoodInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFood()} />
              <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>Type what you ate and we'll estimate the nutrition automatically.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <OutlineButton onClick={() => setAdding(false)}>Cancel</OutlineButton>
                <GreenButton onClick={addFood}>ADD</GreenButton>
              </div>
            </Card>
          )}

          {/* Photo Mode */}
          {photoMode && (
            <Card>
              <SectionLabel>📸 Meal Photo Analysis</SectionLabel>
              {analyzing && <p style={{ textAlign: 'center', color: C.textMuted, padding: '20px' }}>🔍 Analyzing your meal...</p>}
              {analysisResult && !analysisResult.error && (
                <>
                  <p style={{ color: C.text, fontWeight: '600', marginBottom: '8px' }}>{analysisResult.description}</p>
                  {analysisResult.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                      <p style={{ margin: 0, fontSize: '14px', color: C.text }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: '14px', color: C.green, fontWeight: '700' }}>{item.calories} cal</p>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: '4px' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: C.text }}>Total</p>
                    <p style={{ margin: 0, fontWeight: '800', color: C.green }}>{analysisResult.total.calories} cal</p>
                  </div>
                  <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>
                    <span style={{ color: C.blue }}>P: {analysisResult.total.protein}g</span> · <span style={{ color: C.yellow }}>C: {analysisResult.total.carbs}g</span> · <span style={{ color: C.purple }}>F: {analysisResult.total.fat}g</span>
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <OutlineButton onClick={() => { setPhotoMode(false); setAnalysisResult(null); setAdding(false); }}>Cancel</OutlineButton>
                    <GreenButton onClick={addPhotoMeal}>ADD TO LOG</GreenButton>
                  </div>
                </>
              )}
              {analysisResult?.error && (
                <>
                  <p style={{ color: C.red, textAlign: 'center' }}>Could not analyze photo. Try typing your meal instead.</p>
                  <OutlineButton onClick={() => { setPhotoMode(false); setAnalysisResult(null); }}>Go Back</OutlineButton>
                </>
              )}
            </Card>
          )}

          {!adding && !photoMode && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <OutlineButton onClick={() => setAdding(true)}>+ Type Food</OutlineButton>
              <label style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', color: C.green, border: `1px solid ${C.green}`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}>
                📸 Photo
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </>
      )}

      {activeTab === 'stats' && (
        <Card style={{ textAlign: 'center', padding: '30px 20px' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📊</p>
          <p style={{ color: C.text, fontWeight: '700', fontSize: '16px' }}>Weekly stats coming soon!</p>
          <p style={{ color: C.textMuted, fontSize: '14px' }}>Keep logging your meals and we'll show your trends here.</p>
        </Card>
      )}
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ setPage, metrics, setMetrics }) {
  const [local, setLocal] = useState({ ...metrics, heightFt: metrics.height.split("'")[0], heightIn: metrics.height.split("'")[1] || '0' });
  const [saved, setSaved] = useState(false);

  function update(key, val) { setLocal(prev => ({ ...prev, [key]: val })); }

  function save() {
    setMetrics({ ...local, height: `${local.heightFt}'${local.heightIn}`, weight: parseFloat(local.weight), age: parseInt(local.age), pace: parseFloat(local.pace) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <BackButton setPage={setPage} to="calories" />
      <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>⚙️ Update Your Goals</p>

      <Card>
        <SectionLabel>Body Metrics</SectionLabel>
        <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px' }}>Weight (lbs)</p>
        <StyledInput type="number" placeholder="lbs" value={local.weight} onChange={e => update('weight', e.target.value)} />
        <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px' }}>Age</p>
        <StyledInput type="number" placeholder="age" value={local.age} onChange={e => update('age', e.target.value)} />
      </Card>

      <Card>
        <SectionLabel>Activity Level</SectionLabel>
        {[['sedentary', '🪑 Sedentary'], ['light', '🚶 Light'], ['moderate', '🏃 Moderate'], ['active', '💪 Active'], ['very_active', '🔥 Very Active']].map(([val, label]) => (
          <button key={val} onClick={() => update('activity', val)}
            style={{ width: '100%', padding: '10px 14px', marginBottom: '6px', backgroundColor: local.activity === val ? C.greenGlow : '#0f1923', border: `1px solid ${local.activity === val ? C.green : C.cardBorder}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', color: local.activity === val ? C.green : C.textMuted, fontWeight: '700', fontSize: '14px' }}>
            {label}
          </button>
        ))}
      </Card>

      <Card>
        <SectionLabel>Goal</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[['lose', '📉 Lose'], ['maintain', '⚖️ Maintain'], ['gain', '📈 Gain']].map(([val, label]) => (
            <button key={val} onClick={() => update('goal', val)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${local.goal === val ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: local.goal === val ? C.greenGlow : '#0f1923', color: local.goal === val ? C.green : C.textMuted, fontWeight: '700', fontSize: '12px' }}>
              {label}
            </button>
          ))}
        </div>
        {local.goal !== 'maintain' && (
          <>
            <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '8px' }}>Weekly Pace (lbs/week)</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['0.5', '1', '1.5', '2'].map(p => (
                <button key={p} onClick={() => update('pace', p)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${String(local.pace) === p ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: String(local.pace) === p ? C.greenGlow : '#0f1923', color: String(local.pace) === p ? C.green : C.textMuted, fontWeight: '700', fontSize: '13px' }}>
                  {p}
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      <GreenButton onClick={save}>{saved ? '✅ SAVED!' : 'SAVE CHANGES'}</GreenButton>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Header() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div style={{ background: `linear-gradient(135deg, #0f1923 0%, #1a2634 100%)`, padding: '24px 20px 20px', borderBottom: `2px solid ${C.green}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '1px', color: C.text }}>MY LIFE <span style={{ color: C.green }}>APP</span></h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.textMuted }}>{dateStr}</p>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: C.bg }}>H</div>
      </div>
    </div>
  );
}

function HomePage({ setPage }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const buttons = [
    { key: 'checkin', icon: '🌅', label: 'Morning Check-in', sub: 'Sleep · Gratitude · Goals' },
    { key: 'calories', icon: '🍎', label: 'Calorie Tracker', sub: 'Log meals & nutrition' },
    { key: 'weight', icon: '⚖️', label: 'Weight Monitor', sub: 'Track your progress' },
    { key: 'todos', icon: '✅', label: 'To-Do List', sub: 'Daily & long term tasks' },
    { key: 'habits', icon: '🔥', label: 'Habit Tracker', sub: 'Build winning streaks' },
    { key: 'recipes', icon: '🥗', label: 'Recipes & Grocery', sub: 'Healthy meals & lists' },
  ];
  return (
    <div style={{ padding: '24px 16px' }}>
      <p style={{ fontSize: '20px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>{greeting}, Henry 👋</p>
      <p style={{ fontSize: '14px', color: C.textMuted, marginBottom: '24px' }}>What are we working on today?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {buttons.map(b => (
          <button key={b.key} onClick={() => setPage(b.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '16px 18px', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.backgroundColor = C.greenGlow; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.backgroundColor = C.card; }}>
            <span style={{ fontSize: '26px' }}>{b.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: C.text }}>{b.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMuted }}>{b.sub}</p>
            </div>
            <span style={{ marginLeft: 'auto', color: C.green, fontSize: '18px' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackButton({ setPage, to }) {
  return (
    <button onClick={() => setPage(to)} style={{ background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: C.green, fontWeight: '600', marginBottom: '16px', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
      ← Back
    </button>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '12px', padding: '16px', marginBottom: '14px', ...style }}>
      {children}
    </div>
  );
}

function GreenButton({ onClick, children, style = {} }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', padding: '16px', backgroundColor: C.green, color: C.bg, border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px', ...style }}>
      {children}
    </button>
  );
}

function OutlineButton({ onClick, children, style = {} }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: C.green, border: `1px solid ${C.green}`, borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}

function StyledInput({ placeholder, value, onChange, onKeyDown, type = 'text' }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown}
      style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0f1923', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', fontSize: '15px', color: C.text, boxSizing: 'border-box', marginBottom: '10px', outline: 'none' }} />
  );
}

function SectionLabel({ children }) {
  return <p style={{ fontSize: '12px', fontWeight: '700', color: C.green, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 10px' }}>{children}</p>;
}

function pillBtn(active) {
  return { flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${active ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: active ? C.greenGlow : '#0f1923', color: active ? C.green : C.textMuted, fontWeight: '700', fontSize: '14px' };
}

function ComingSoon({ setPage, title }) {
  return (
    <div style={{ padding: '20px 16px' }}>
      <BackButton setPage={setPage} to="home" />
      <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: '48px', margin: '0 0 16px' }}>{title.split(' ')[0]}</p>
        <p style={{ fontSize: '18px', fontWeight: '700', color: C.text, margin: '0 0 8px' }}>{title.split(' ').slice(1).join(' ')}</p>
        <p style={{ fontSize: '14px', color: C.textMuted, margin: 0 }}>Coming soon — we're building this next!</p>
      </Card>
    </div>
  );
}

function CheckInPage({ setPage }) {
  const [sleep, setSleep] = useState(7);
  const [grateful1, setGrateful1] = useState('');
  const [grateful2, setGrateful2] = useState('');
  const [grateful3, setGrateful3] = useState('');
  const [physical, setPhysical] = useState('');
  const [mental, setMental] = useState('');
  const [spiritual, setSpiritual] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  const sleepColor = sleep < 6 ? C.red : sleep < 7 ? C.yellow : C.green;

  return (
    <div style={{ padding: '20px 16px' }}>
      <BackButton setPage={setPage} to="home" />
      <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>🌅 Morning Check-in</p>
      <Card>
        <SectionLabel>Sleep</SectionLabel>
        <p style={{ textAlign: 'center', fontSize: '48px', fontWeight: '800', color: sleepColor, margin: '8px 0' }}>{sleep}<span style={{ fontSize: '20px', color: C.textMuted }}> hrs</span></p>
        <input type="range" min="1" max="12" value={sleep} onChange={e => setSleep(e.target.value)} style={{ width: '100%', accentColor: C.green }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMuted, marginTop: '4px' }}>
          <span>1 hr</span><span>12 hrs</span>
        </div>
      </Card>
      <Card>
        <SectionLabel>Gratitude</SectionLabel>
        <StyledInput placeholder="I'm grateful for..." value={grateful1} onChange={e => setGrateful1(e.target.value)} />
        <StyledInput placeholder="I'm grateful for..." value={grateful2} onChange={e => setGrateful2(e.target.value)} />
        <StyledInput placeholder="I'm grateful for..." value={grateful3} onChange={e => setGrateful3(e.target.value)} />
      </Card>
      <Card>
        <SectionLabel>Today's Goals</SectionLabel>
        <p style={{ fontSize: '12px', color: C.textMuted, margin: '0 0 6px' }}>💪 Physical</p>
        <StyledInput placeholder="e.g. Walk 10,000 steps" value={physical} onChange={e => setPhysical(e.target.value)} />
        <p style={{ fontSize: '12px', color: C.textMuted, margin: '4px 0 6px' }}>🧠 Mental</p>
        <StyledInput placeholder="e.g. Read for 20 minutes" value={mental} onChange={e => setMental(e.target.value)} />
        <p style={{ fontSize: '12px', color: C.textMuted, margin: '4px 0 6px' }}>🕊️ Spiritual</p>
        <StyledInput placeholder="e.g. Meditate for 10 minutes" value={spiritual} onChange={e => setSpiritual(e.target.value)} />
      </Card>
      <GreenButton onClick={handleSave}>{saved ? '✅ CHECK-IN SAVED!' : 'SAVE CHECK-IN'}</GreenButton>
    </div>
  );
}

function TodoPage({ setPage }) {
  const [tab, setTab] = useState('daily');
  const today = getTodayStr();
  const todayDayIndex = getTodayDayIndex();
  const [dailyTodos, setDailyTodos] = useState([
    { id: 1, text: 'Drink 8 glasses of water', done: false, repeatType: 'everyday', repeatDays: [], repeatEvery: 1, startDate: today },
    { id: 2, text: 'Take vitamins', done: false, repeatType: 'everyday', repeatDays: [], repeatEvery: 1, startDate: today },
  ]);
  const [longTodos, setLongTodos] = useState([{ id: 1, text: 'Read a book this month', done: false, dueDate: '' }]);
  const [newTask, setNewTask] = useState('');
  const [repeatType, setRepeatType] = useState('everyday');
  const [repeatDays, setRepeatDays] = useState([]);
  const [repeatEvery, setRepeatEvery] = useState(2);
  const [newLongTask, setNewLongTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const longTermDueToday = longTodos.filter(t => t.dueDate === today && !t.done);

  function showsToday(todo) {
    if (todo.repeatType === 'everyday') return true;
    if (todo.repeatType === 'days') return todo.repeatDays.includes(todayDayIndex);
    if (todo.repeatType === 'interval') {
      const diff = Math.round((new Date(today) - new Date(todo.startDate)) / (1000 * 60 * 60 * 24));
      return diff % todo.repeatEvery === 0;
    }
    return true;
  }

  const visibleDailyTodos = dailyTodos.filter(showsToday);
  function toggleRepeatDay(i) { setRepeatDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]); }

  function addDailyTask() {
    if (!newTask.trim()) return;
    setDailyTodos([...dailyTodos, { id: Date.now(), text: newTask, done: false, repeatType, repeatDays: repeatType === 'days' ? repeatDays : [], repeatEvery: repeatType === 'interval' ? repeatEvery : 1, startDate: today }]);
    setNewTask(''); setRepeatType('everyday'); setRepeatDays([]); setRepeatEvery(2);
  }

  function addLongTask() {
    if (!newLongTask.trim()) return;
    setLongTodos([...longTodos, { id: Date.now(), text: newLongTask, done: false, dueDate: newDueDate }]);
    setNewLongTask(''); setNewDueDate('');
  }

  function repeatLabel(todo) {
    if (todo.repeatType === 'everyday') return 'Every day';
    if (todo.repeatType === 'days') return todo.repeatDays.map(d => DAYS[d]).join(', ');
    if (todo.repeatType === 'interval') return `Every ${todo.repeatEvery} days`;
    return '';
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <BackButton setPage={setPage} to="home" />
      <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>✅ To-Do List</p>
      <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: C.card, borderRadius: '10px', padding: '4px', border: `1px solid ${C.cardBorder}` }}>
        {[['daily', '📅 Daily'], ['longterm', '🎯 Long Term']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '8px', backgroundColor: tab === key ? C.green : 'transparent', color: tab === key ? C.bg : C.textMuted, fontWeight: '700', fontSize: '14px' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <>
          <OutlineButton onClick={() => setDailyTodos(dailyTodos.map(t => ({ ...t, done: false })))} style={{ marginBottom: '16px' }}>🔄 Reset All Daily Tasks</OutlineButton>
          {longTermDueToday.length > 0 && (
            <Card style={{ border: `1px solid ${C.yellow}`, backgroundColor: 'rgba(255,165,2,0.08)' }}>
              <SectionLabel>📌 Due Today</SectionLabel>
              {longTermDueToday.map(todo => (
                <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <input type="checkbox" checked={todo.done} onChange={() => setLongTodos(longTodos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} style={{ width: '20px', height: '20px', accentColor: C.yellow }} />
                  <span style={{ color: C.text, fontSize: '15px' }}>{todo.text}</span>
                </div>
              ))}
            </Card>
          )}
          {visibleDailyTodos.length === 0 && <p style={{ textAlign: 'center', color: C.textMuted, padding: '30px 0' }}>No tasks for today!</p>}
          {visibleDailyTodos.map(todo => (
            <div key={todo.id} style={{ backgroundColor: C.card, borderRadius: '10px', padding: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${C.cardBorder}` }}>
              <input type="checkbox" checked={todo.done} onChange={() => setDailyTodos(dailyTodos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} style={{ width: '22px', height: '22px', accentColor: C.green, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: todo.done ? C.textDim : C.text, textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</p>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: C.green }}>🔁 {repeatLabel(todo)}</p>
              </div>
              <button onClick={() => setDailyTodos(dailyTodos.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, fontSize: '18px' }}>✕</button>
            </div>
          ))}
          <Card>
            <SectionLabel>Add Daily Task</SectionLabel>
            <StyledInput placeholder="Task name..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDailyTask()} />
            <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '8px', fontWeight: '600' }}>REPEAT</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[['everyday', 'Every Day'], ['days', 'Specific Days'], ['interval', 'Every X Days']].map(([val, label]) => (
                <button key={val} onClick={() => setRepeatType(val)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${repeatType === val ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: repeatType === val ? C.greenGlow : 'transparent', color: repeatType === val ? C.green : C.textMuted, fontSize: '11px', fontWeight: '700' }}>
                  {label}
                </button>
              ))}
            </div>
            {repeatType === 'days' && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {DAYS.map((day, i) => (
                  <button key={i} onClick={() => toggleRepeatDay(i)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${repeatDays.includes(i) ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: repeatDays.includes(i) ? C.greenGlow : 'transparent', color: repeatDays.includes(i) ? C.green : C.textMuted, fontSize: '12px', fontWeight: '700' }}>
                    {day}
                  </button>
                ))}
              </div>
            )}
            {repeatType === 'interval' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: C.textMuted }}>Every</span>
                <input type="number" min="2" max="30" value={repeatEvery} onChange={e => setRepeatEvery(Number(e.target.value))}
                  style={{ width: '60px', padding: '8px', borderRadius: '8px', border: `1px solid ${C.cardBorder}`, fontSize: '16px', textAlign: 'center', backgroundColor: '#0f1923', color: C.text }} />
                <span style={{ fontSize: '14px', color: C.textMuted }}>days</span>
              </div>
            )}
            <GreenButton onClick={addDailyTask}>+ ADD TASK</GreenButton>
          </Card>
        </>
      )}

      {tab === 'longterm' && (
        <>
          {longTodos.length === 0 && <p style={{ textAlign: 'center', color: C.textMuted, padding: '30px 0' }}>No long term tasks yet!</p>}
          {longTodos.map(todo => (
            <div key={todo.id} style={{ backgroundColor: C.card, borderRadius: '10px', padding: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${todo.dueDate === today ? C.yellow : C.cardBorder}` }}>
              <input type="checkbox" checked={todo.done} onChange={() => setLongTodos(longTodos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))} style={{ width: '22px', height: '22px', accentColor: C.green, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: todo.done ? C.textDim : C.text, textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</p>
                {todo.dueDate && <p style={{ margin: '3px 0 0', fontSize: '11px', color: todo.dueDate === today ? C.yellow : C.textMuted }}>📅 {todo.dueDate === today ? 'Due Today!' : `Due: ${todo.dueDate}`}</p>}
              </div>
              <button onClick={() => setLongTodos(longTodos.filter(t => t.id !== todo.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, fontSize: '18px' }}>✕</button>
            </div>
          ))}
          <Card>
            <SectionLabel>Add Long Term Task</SectionLabel>
            <StyledInput placeholder="Task name..." value={newLongTask} onChange={e => setNewLongTask(e.target.value)} />
            <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px', fontWeight: '600' }}>DUE DATE (OPTIONAL)</p>
            <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', backgroundColor: '#0f1923', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', fontSize: '15px', color: C.text, boxSizing: 'border-box', marginBottom: '12px', outline: 'none' }} />
            <GreenButton onClick={addLongTask}>+ ADD TASK</GreenButton>
          </Card>
        </>
      )}
    </div>
  );
}

export default App;