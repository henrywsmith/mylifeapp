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
  const [weightLog, setWeightLog] = useState([]);
  const [checkIns, setCheckIns] = useState({});

  function handleSetupComplete(metrics) {
    setHealthMetrics(metrics);
    setSetupDone(true);
    setPage('home');
  }

  if (!setupDone) {
    return <SetupFlow onComplete={handleSetupComplete} />;
  }

  const sharedProps = {
    setPage, healthMetrics, setHealthMetrics,
    foodLog, setFoodLog,
    weightLog, setWeightLog,
    checkIns, setCheckIns,
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", maxWidth: '430px', margin: '0 auto', minHeight: '100vh', backgroundColor: C.bg, color: C.text, paddingBottom: '80px' }}>
      {page === 'home' && <DashboardPage {...sharedProps} />}
      {page === 'checkin' && <CheckInPage {...sharedProps} />}
      {page === 'todos' && <TodoPage {...sharedProps} />}
      {page === 'calories' && <CaloriePage {...sharedProps} />}
      {page === 'weight' && <WeightPage {...sharedProps} />}
      {page === 'settings' && <SettingsPage {...sharedProps} />}
      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ page, setPage }) {
  const tabs = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'calories', icon: '🍎', label: 'Calories' },
    { key: 'weight', icon: '⚖️', label: 'Weight' },
    { key: 'todos', icon: '✅', label: 'Todos' },
    { key: 'checkin', icon: '🌅', label: 'Check-in' },
  ];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', backgroundColor: C.card, borderTop: `2px solid ${C.cardBorder}`, display: 'flex', zIndex: 100 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setPage(t.key)}
          style={{ flex: 1, padding: '10px 4px 8px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '20px' }}>{t.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: '700', color: page === t.key ? C.green : C.textDim, letterSpacing: '0.5px' }}>{t.label.toUpperCase()}</span>
          {page === t.key && <div style={{ width: '20px', height: '2px', backgroundColor: C.green, borderRadius: '2px' }} />}
        </button>
      ))}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ setPage, healthMetrics, foodLog, weightLog, checkIns }) {
  const today = getTodayStr();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayCheckIn = checkIns[today];
  const dailyCalories = calculateTDEE(healthMetrics);
  const todayLog = foodLog[today] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  const allEntries = [...(todayLog.Breakfast || []), ...(todayLog.Lunch || []), ...(todayLog.Dinner || []), ...(todayLog.Snacks || [])];
  const totalCals = allEntries.reduce((s, e) => s + e.calories, 0);
  const calPct = Math.min(100, Math.round((totalCals / dailyCalories) * 100));
  const remaining = dailyCalories - totalCals;
  const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : healthMetrics.weight;
  const weightChange = currentWeight - healthMetrics.weight;

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, #0f1923 0%, #1a2634 100%)`, padding: '24px 20px 20px', borderBottom: `2px solid ${C.green}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '1px', color: C.text }}>MY LIFE <span style={{ color: C.green }}>APP</span></h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: C.textMuted }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: C.bg }}>
            {healthMetrics.name ? healthMetrics.name[0].toUpperCase() : 'H'}
          </div>
        </div>
        <p style={{ margin: '16px 0 0', fontSize: '18px', fontWeight: '700', color: C.text }}>{greeting}, {healthMetrics.name}! 👋</p>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Morning Check-in Prompt */}
        {!todayCheckIn && (
          <button onClick={() => setPage('checkin')}
            style={{ width: '100%', padding: '14px 16px', backgroundColor: C.greenGlow, border: `1px solid ${C.green}`, borderRadius: '12px', cursor: 'pointer', textAlign: 'left', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: C.green }}>🌅 Complete Morning Check-in</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMuted }}>Log your sleep, gratitude & goals</p>
            </div>
            <span style={{ color: C.green, fontSize: '20px' }}>›</span>
          </button>
        )}

        {/* Sleep Card */}
        {todayCheckIn && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <DashCard label="SLEEP" style={{ flex: 1 }}>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: todayCheckIn.sleep < 6 ? C.red : todayCheckIn.sleep < 7 ? C.yellow : C.green }}>
                {todayCheckIn.sleep}<span style={{ fontSize: '14px', color: C.textMuted }}> hrs</span>
              </p>
            </DashCard>
            <DashCard label="WEIGHT" style={{ flex: 1 }}>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: C.text }}>
                {currentWeight}<span style={{ fontSize: '14px', color: C.textMuted }}> lbs</span>
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: weightChange <= 0 ? C.green : C.red }}>
                {weightChange <= 0 ? '▼' : '▲'} {Math.abs(weightChange).toFixed(1)} from start
              </p>
            </DashCard>
          </div>
        )}

        {!todayCheckIn && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <DashCard label="SLEEP" style={{ flex: 1 }}>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: C.textDim }}>Not logged</p>
            </DashCard>
            <DashCard label="WEIGHT" style={{ flex: 1 }}>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '800', color: C.text }}>
                {currentWeight}<span style={{ fontSize: '14px', color: C.textMuted }}> lbs</span>
              </p>
            </DashCard>
          </div>
        )}

        {/* Calories Card */}
        <DashCard label="CALORIES TODAY" style={{ marginBottom: '14px' }} onPress={() => setPage('calories')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
            <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: remaining < 0 ? C.red : C.green }}>
              {totalCals}<span style={{ fontSize: '14px', color: C.textMuted' }}>/{dailyCalories}</span>
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: remaining < 0 ? C.red : C.textMuted, fontWeight: '700' }}>
              {remaining < 0 ? `${Math.abs(remaining)} over` : `${remaining} left`}
            </p>
          </div>
          <div style={{ backgroundColor: '#0f1923', borderRadius: '6px', height: '8px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ width: `${calPct}%`, height: '100%', backgroundColor: remaining < 0 ? C.red : C.green, borderRadius: '6px' }} />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMuted }}>{calPct}% of daily goal</p>
        </DashCard>

        {/* Today's Goals */}
        {todayCheckIn && (todayCheckIn.physical || todayCheckIn.mental || todayCheckIn.spiritual) && (
          <DashCard label="TODAY'S GOALS" style={{ marginBottom: '14px' }}>
            {todayCheckIn.physical && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: '16px' }}>💪</span>
                <p style={{ margin: 0, fontSize: '14px', color: C.text, flex: 1 }}>{todayCheckIn.physical}</p>
              </div>
            )}
            {todayCheckIn.mental && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontSize: '16px' }}>🧠</span>
                <p style={{ margin: 0, fontSize: '14px', color: C.text, flex: 1 }}>{todayCheckIn.mental}</p>
              </div>
            )}
            {todayCheckIn.spiritual && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                <span style={{ fontSize: '16px' }}>🕊️</span>
                <p style={{ margin: 0, fontSize: '14px', color: C.text, flex: 1 }}>{todayCheckIn.spiritual}</p>
              </div>
            )}
          </DashCard>
        )}

        {/* Weight Progress */}
        <DashCard label="WEIGHT GOAL" style={{ marginBottom: '14px' }} onPress={() => setPage('weight')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: C.textMuted }}>Current</p>
              <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: C.text }}>{currentWeight} lbs</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', color: C.textMuted }}>Goal</p>
              <p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: C.yellow }}>{healthMetrics.goalWeight} lbs</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#0f1923', borderRadius: '6px', height: '8px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (Math.abs(weightChange) / Math.abs(healthMetrics.weight - healthMetrics.goalWeight)) * 100))}%`, height: '100%', backgroundColor: C.yellow, borderRadius: '6px' }} />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMuted }}>
            {Math.abs(currentWeight - healthMetrics.goalWeight).toFixed(1)} lbs to go
          </p>
        </DashCard>

      </div>
    </div>
  );
}

function DashCard({ label, children, style = {}, onPress }) {
  return (
    <div onClick={onPress}
      style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '12px', padding: '14px 16px', cursor: onPress ? 'pointer' : 'default', ...style }}>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: C.green, letterSpacing: '1px' }}>{label}</p>
      {children}
    </div>
  );
}

// ─── SETUP FLOW ───────────────────────────────────────────────────────────────
function SetupFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [metrics, setMetrics] = useState({
    name: '', age: '', sex: 'male', weight: '', heightFt: '', heightIn: '',
    activity: 'moderate', goal: 'lose', pace: 1, goalWeight: '',
  });

  function update(key, val) { setMetrics(prev => ({ ...prev, [key]: val })); }
  function next() { setStep(s => s + 1); }
  function back() { setStep(s => s - 1); }

  function finish() {
    const finalMetrics = {
      ...metrics,
      height: `${metrics.heightFt}'${metrics.heightIn}`,
      weight: parseFloat(metrics.weight),
      age: parseInt(metrics.age),
      pace: parseFloat(metrics.pace),
      goalWeight: parseFloat(metrics.goalWeight),
    };
    onComplete(finalMetrics);
  }

  const steps = [
    <div style={setupCard}>
      <p style={setupEmoji}>👋</p>
      <p style={setupTitle}>Welcome to Your Life App</p>
      <p style={setupSub}>Let's set up your health profile so we can personalize everything for you. This only takes 2 minutes.</p>
      <GreenButton onClick={next}>LET'S GO</GreenButton>
    </div>,

    <div style={setupCard}>
      <p style={setupStep}>Step 1 of 5</p>
      <p style={setupTitle}>Basic Info</p>
      <SetupLabel>Your Name</SetupLabel>
      <SetupInput placeholder="First name" value={metrics.name} onChange={e => update('name', e.target.value)} />
      <SetupLabel>Age</SetupLabel>
      <SetupInput placeholder="e.g. 28" type="number" value={metrics.age} onChange={e => update('age', e.target.value)} />
      <SetupLabel>Sex</SetupLabel>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {[['male', '♂ Male'], ['female', '♀ Female']].map(([val, label]) => (
          <button key={val} onClick={() => update('sex', val)} style={pillBtn(metrics.sex === val)}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <OutlineButton onClick={back}>Back</OutlineButton>
        <GreenButton onClick={next}>Next</GreenButton>
      </div>
    </div>,

    <div style={setupCard}>
      <p style={setupStep}>Step 2 of 5</p>
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

    <div style={setupCard}>
      <p style={setupStep}>Step 3 of 5</p>
      <p style={setupTitle}>Activity Level</p>
      {[
        ['sedentary', '🪑 Sedentary', 'Little or no exercise'],
        ['light', '🚶 Lightly Active', 'Exercise 1-3 days/week'],
        ['moderate', '🏃 Moderately Active', 'Exercise 3-5 days/week'],
        ['active', '💪 Very Active', 'Exercise 6-7 days/week'],
        ['very_active', '🔥 Extremely Active', 'Physical job + daily exercise'],
      ].map(([val, label, sub]) => (
        <button key={val} onClick={() => update('activity', val)}
          style={{ width: '100%', padding: '12px 14px', marginBottom: '8px', backgroundColor: metrics.activity === val ? C.greenGlow : '#0f1923', border: `1px solid ${metrics.activity === val ? C.green : C.cardBorder}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: metrics.activity === val ? C.green : C.text }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMuted }}>{sub}</p>
        </button>
      ))}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <OutlineButton onClick={back}>Back</OutlineButton>
        <GreenButton onClick={next}>Next</GreenButton>
      </div>
    </div>,

    <div style={setupCard}>
      <p style={setupStep}>Step 4 of 5</p>
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
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
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
        <GreenButton onClick={next}>Next</GreenButton>
      </div>
    </div>,

    <div style={setupCard}>
      <p style={setupStep}>Step 5 of 5</p>
      <p style={setupTitle}>Goal Weight</p>
      <p style={{ color: C.textMuted, fontSize: '14px', marginBottom: '20px', textAlign: 'center', lineHeight: '1.6' }}>
        What's your target weight? This shows as a goal line on your weight chart.
      </p>
      <SetupLabel>Goal Weight (lbs)</SetupLabel>
      <SetupInput placeholder="e.g. 160" type="number" value={metrics.goalWeight} onChange={e => update('goalWeight', e.target.value)} />
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
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

// ─── CHECK IN PAGE ────────────────────────────────────────────────────────────
function CheckInPage({ setPage, checkIns, setCheckIns }) {
  const today = getTodayStr();
  const existing = checkIns[today] || {};
  const [sleep, setSleep] = useState(existing.sleep || 7);
  const [grateful1, setGrateful1] = useState(existing.grateful1 || '');
  const [grateful2, setGrateful2] = useState(existing.grateful2 || '');
  const [grateful3, setGrateful3] = useState(existing.grateful3 || '');
  const [physical, setPhysical] = useState(existing.physical || '');
  const [mental, setMental] = useState(existing.mental || '');
  const [spiritual, setSpiritual] = useState(existing.spiritual || '');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  function handleSave() {
    setCheckIns(prev => ({
      ...prev,
      [today]: { sleep, grateful1, grateful2, grateful3, physical, mental, spiritual, date: today }
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const sleepColor = sleep < 6 ? C.red : sleep < 7 ? C.yellow : C.green;
  const history = Object.values(checkIns).sort((a, b) => b.date.localeCompare(a.date));
  const sleepData = history.slice(0, 7).reverse();

  return (
    <div style={{ padding: '20px 16px' }}>
      <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>🌅 Morning Check-in</p>

      <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: C.card, borderRadius: '10px', padding: '4px', border: `1px solid ${C.cardBorder}` }}>
        {[['today', "Today's Check-in"], ['history', '📋 History']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '8px', backgroundColor: activeTab === key ? C.green : 'transparent', color: activeTab === key ? C.bg : C.textMuted, fontWeight: '700', fontSize: '13px' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'today' && (
        <>
          <Card>
            <SectionLabel>Sleep</SectionLabel>
            <p style={{ textAlign: 'center', fontSize: '48px', fontWeight: '800', color: sleepColor, margin: '8px 0' }}>{sleep}<span style={{ fontSize: '20px', color: C.textMuted }}> hrs</span></p>
            <input type="range" min="1" max="12" value={sleep} onChange={e => setSleep(Number(e.target.value))} style={{ width: '100%', accentColor: C.green }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: C.textMuted, marginTop: '4px' }}>
              <span>1 hr</span><span>12 hrs</span>
            </div>
          </Card>

          {/* Sleep History Mini Chart */}
          {sleepData.length > 1 && (
            <Card>
              <SectionLabel>Sleep This Week</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '60px', marginTop: '8px' }}>
                {sleepData.map((entry, i) => {
                  const pct = (entry.sleep / 12) * 100;
                  const color = entry.sleep < 6 ? C.red : entry.sleep < 7 ? C.yellow : C.green;
                  const d = new Date(entry.date + 'T00:00:00');
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: C.textMuted, fontWeight: '700' }}>{entry.sleep}h</p>
                      <div style={{ width: '100%', height: `${pct}%`, backgroundColor: color, borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                      <p style={{ margin: 0, fontSize: '9px', color: C.textDim }}>{DAYS[d.getDay()].slice(0, 1)}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

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
        </>
      )}

      {activeTab === 'history' && (
        <>
          {history.length === 0 && (
            <p style={{ textAlign: 'center', color: C.textMuted, padding: '40px 0' }}>No check-ins yet — complete your first one!</p>
          )}
          {history.map(entry => {
            const d = new Date(entry.date + 'T00:00:00');
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            const sleepColor = entry.sleep < 6 ? C.red : entry.sleep < 7 ? C.yellow : C.green;
            return (
              <Card key={entry.date}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text }}>{dateStr}</p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: sleepColor }}>{entry.sleep}h sleep</p>
                </div>
                {(entry.grateful1 || entry.grateful2 || entry.grateful3) && (
                  <div style={{ marginBottom: '8px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: C.green, fontWeight: '700', letterSpacing: '1px' }}>GRATEFUL FOR</p>
                    {[entry.grateful1, entry.grateful2, entry.grateful3].filter(Boolean).map((g, i) => (
                      <p key={i} style={{ margin: '2px 0', fontSize: '13px', color: C.textMuted }}>• {g}</p>
                    ))}
                  </div>
                )}
                {(entry.physical || entry.mental || entry.spiritual) && (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: C.green, fontWeight: '700', letterSpacing: '1px' }}>GOALS</p>
                    {entry.physical && <p style={{ margin: '2px 0', fontSize: '13px', color: C.textMuted }}>💪 {entry.physical}</p>}
                    {entry.mental && <p style={{ margin: '2px 0', fontSize: '13px', color: C.textMuted }}>🧠 {entry.mental}</p>}
                    {entry.spiritual && <p style={{ margin: '2px 0', fontSize: '13px', color: C.textMuted }}>🕊️ {entry.spiritual}</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── WEIGHT PAGE ──────────────────────────────────────────────────────────────
function WeightPage({ setPage, healthMetrics, weightLog, setWeightLog }) {
  const today = getTodayStr();
  const [weightInput, setWeightInput] = useState('');
  const [activeTab, setActiveTab] = useState('log');
  const goalWeight = healthMetrics.goalWeight;
  const startWeight = healthMetrics.weight;
  const todayEntry = weightLog.find(e => e.date === today);
  const currentWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : startWeight;
  const totalChange = currentWeight - startWeight;
  const toGoal = currentWeight - goalWeight;

  function logWeight() {
    if (!weightInput) return;
    const w = parseFloat(weightInput);
    if (todayEntry) {
      setWeightLog(weightLog.map(e => e.date === today ? { ...e, weight: w } : e));
    } else {
      setWeightLog([...weightLog, { date: today, weight: w }]);
    }
    setWeightInput('');
  }

  function getWeeklyAvgChange() {
    if (weightLog.length < 2) return null;
    const first = weightLog[0];
    const last = weightLog[weightLog.length - 1];
    const days = Math.max(1, (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24));
    return ((last.weight - first.weight) / (days / 7)).toFixed(1);
  }

  function getProjectedDate() {
    const weeklyChange = parseFloat(getWeeklyAvgChange());
    if (!weeklyChange || weeklyChange === 0) return null;
    const weeksNeeded = toGoal / weeklyChange;
    if (weeksNeeded < 0 || weeksNeeded > 200) return null;
    const projected = new Date();
    projected.setDate(projected.getDate() + Math.round(weeksNeeded * 7));
    return projected.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getInsights() {
    const insights = [];
    const weeklyChange = parseFloat(getWeeklyAvgChange());
    if (weightLog.length < 2) {
      insights.push({ icon: '📝', text: "Log your weight for a few days and we'll start giving you personalized insights!" });
      return insights;
    }
    if (healthMetrics.goal === 'lose') {
      if (weeklyChange > 0) insights.push({ icon: '⚠️', text: 'Your weight is trending up. Try reducing calories by 200-300 per day or increasing activity.' });
      else if (weeklyChange < -2) insights.push({ icon: '⚠️', text: `You're losing ${Math.abs(weeklyChange)} lbs/week which is faster than recommended. Consider eating a little more to preserve muscle.` });
      else insights.push({ icon: '✅', text: `Great pace! You're losing about ${Math.abs(weeklyChange)} lbs/week.` });
    }
    if (healthMetrics.goal === 'gain') {
      if (weeklyChange < 0) insights.push({ icon: '⚠️', text: 'Your weight is trending down. Try increasing your daily calories by 200-300.' });
      else insights.push({ icon: '✅', text: `Solid progress! You're gaining ${weeklyChange} lbs/week at a healthy pace.` });
    }
    if (healthMetrics.goal === 'maintain') {
      if (Math.abs(weeklyChange) < 0.5) insights.push({ icon: '✅', text: 'Your weight is very stable. Great job maintaining!' });
      else insights.push({ icon: '📊', text: `Your weight is fluctuating by ${Math.abs(weeklyChange)} lbs/week.` });
    }
    if (weightLog.length >= 7) {
      const avg = weightLog.slice(-7).reduce((s, e) => s + e.weight, 0) / 7;
      insights.push({ icon: '📊', text: `Your 7-day average weight is ${avg.toFixed(1)} lbs.` });
    }
    const projected = getProjectedDate();
    if (projected) insights.push({ icon: '🎯', text: `At your current pace you'll reach your goal weight of ${goalWeight} lbs around ${projected}.` });
    return insights;
  }

  function WeightChart() {
    if (weightLog.length < 2) {
      return <div style={{ textAlign: 'center', padding: '30px', color: C.textMuted, fontSize: '14px' }}>Log at least 2 days of weight to see your chart</div>;
    }
    const allValues = [...weightLog.map(e => e.weight), goalWeight];
    const minW = Math.min(...allValues) - 2;
    const maxW = Math.max(...allValues) + 2;
    const W = 340, H = 180, padL = 40, padR = 20, padT = 10, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    function xPos(i) { return padL + (i / (weightLog.length - 1)) * chartW; }
    function yPos(w) { return padT + ((maxW - w) / (maxW - minW)) * chartH; }
    const points = weightLog.map((e, i) => `${xPos(i)},${yPos(e.weight)}`).join(' ');
    const goalY = yPos(goalWeight);
    const yLabels = [];
    const step = Math.ceil((maxW - minW) / 4);
    for (let w = Math.ceil(minW); w <= maxW; w += step) yLabels.push(w);
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {yLabels.map(w => (
          <g key={w}>
            <line x1={padL} y1={yPos(w)} x2={W - padR} y2={yPos(w)} stroke={C.cardBorder} strokeWidth="1" />
            <text x={padL - 4} y={yPos(w)} textAnchor="end" fill={C.textMuted} fontSize="10" dominantBaseline="middle">{w}</text>
          </g>
        ))}
        <line x1={padL} y1={goalY} x2={W - padR} y2={goalY} stroke={C.yellow} strokeWidth="1.5" strokeDasharray="6,4" />
        <text x={W - padR + 2} y={goalY} fill={C.yellow} fontSize="9" dominantBaseline="middle">Goal</text>
        <polyline points={points} fill="none" stroke={C.green} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {weightLog.map((e, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(e.weight)} r="4" fill={C.green} stroke={C.bg} strokeWidth="2" />
        ))}
        {weightLog.map((e, i) => {
          if (weightLog.length > 7 && i % 2 !== 0) return null;
          const d = new Date(e.date + 'T00:00:00');
          return <text key={i} x={xPos(i)} y={H - 4} textAnchor="middle" fill={C.textMuted} fontSize="9">{`${d.getMonth() + 1}/${d.getDate()}`}</text>;
        })}
      </svg>
    );
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>⚖️ Weight Monitor</p>
      <div style={{ display: 'flex', marginBottom: '20px', backgroundColor: C.card, borderRadius: '10px', padding: '4px', border: `1px solid ${C.cardBorder}` }}>
        {[['log', '📋 Log'], ['insights', '💡 Insights']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '8px', backgroundColor: activeTab === key ? C.green : 'transparent', color: activeTab === key ? C.bg : C.textMuted, fontWeight: '700', fontSize: '14px' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'log' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'Current', val: `${currentWeight} lbs`, color: C.text },
              { label: totalChange <= 0 ? 'Lost' : 'Gained', val: `${Math.abs(totalChange).toFixed(1)} lbs`, color: healthMetrics.goal === 'lose' ? (totalChange <= 0 ? C.green : C.red) : (totalChange >= 0 ? C.green : C.red) },
              { label: 'To Goal', val: `${Math.abs(toGoal).toFixed(1)} lbs`, color: C.yellow },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, backgroundColor: C.card, borderRadius: '10px', padding: '12px', border: `1px solid ${C.cardBorder}`, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '11px', color: C.textMuted, fontWeight: '700' }}>{s.label.toUpperCase()}</p>
                <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '800', color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
          <Card>
            <SectionLabel>Weight Trend</SectionLabel>
            <WeightChart />
          </Card>
          <Card>
            <SectionLabel>{todayEntry ? "Update Today's Weight" : "Log Today's Weight"}</SectionLabel>
            {todayEntry && <p style={{ fontSize: '14px', color: C.textMuted, marginBottom: '10px' }}>Today: <span style={{ color: C.green, fontWeight: '700' }}>{todayEntry.weight} lbs</span></p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" placeholder="lbs" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', backgroundColor: '#0f1923', border: `1px solid ${C.cardBorder}`, borderRadius: '8px', fontSize: '18px', color: C.text, outline: 'none', fontWeight: '700' }} />
              <GreenButton onClick={logWeight} style={{ width: 'auto', padding: '12px 24px' }}>LOG</GreenButton>
            </div>
          </Card>
          {weightLog.length > 0 && (
            <Card>
              <SectionLabel>History</SectionLabel>
              {[...weightLog].reverse().map((entry, i) => {
                const prev = weightLog[weightLog.length - 2 - i];
                const diff = prev ? entry.weight - prev.weight : null;
                const d = new Date(entry.date + 'T00:00:00');
                return (
                  <div key={entry.date} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', color: C.text, fontWeight: '600' }}>{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      {diff !== null && <p style={{ margin: '2px 0 0', fontSize: '12px', color: diff < 0 ? C.green : diff > 0 ? C.red : C.textMuted }}>{diff < 0 ? '▼' : diff > 0 ? '▲' : '—'} {Math.abs(diff).toFixed(1)} lbs</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: C.green }}>{entry.weight}</p>
                      <button onClick={() => setWeightLog(weightLog.filter(e => e.date !== entry.date))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, fontSize: '16px' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}

      {activeTab === 'insights' && (
        <>
          <Card>
            <SectionLabel>Your Goal</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: C.textMuted }}>Start</p>
                <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: '800', color: C.text }}>{startWeight} lbs</p>
              </div>
              <span style={{ fontSize: '24px' }}>{healthMetrics.goal === 'lose' ? '📉' : healthMetrics.goal === 'gain' ? '📈' : '⚖️'}</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '13px', color: C.textMuted }}>Goal</p>
                <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: '800', color: C.yellow }}>{goalWeight} lbs</p>
              </div>
            </div>
            <div style={{ marginTop: '12px', backgroundColor: '#0f1923', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, (Math.abs(totalChange) / Math.abs(startWeight - goalWeight)) * 100))}%`, height: '100%', backgroundColor: C.green, borderRadius: '6px' }} />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: C.textMuted, textAlign: 'right' }}>
              {Math.min(100, Math.max(0, Math.round((Math.abs(totalChange) / Math.abs(startWeight - goalWeight)) * 100)))}% to goal
            </p>
          </Card>
          {getWeeklyAvgChange() && (
            <Card>
              <SectionLabel>Weekly Average</SectionLabel>
              <p style={{ fontSize: '32px', fontWeight: '800', color: parseFloat(getWeeklyAvgChange()) < 0 ? C.green : C.red, margin: '0 0 4px' }}>
                {parseFloat(getWeeklyAvgChange()) < 0 ? '▼' : '▲'} {Math.abs(getWeeklyAvgChange())} lbs/week
              </p>
              <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>Target: {healthMetrics.pace} lbs/week</p>
            </Card>
          )}
          <Card>
            <SectionLabel>Insights & Tips</SectionLabel>
            {getInsights().map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < getInsights().length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{insight.icon}</span>
                <p style={{ margin: 0, fontSize: '14px', color: C.textMuted, lineHeight: '1.6' }}>{insight.text}</p>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── CALORIE PAGE ─────────────────────────────────────────────────────────────
function CaloriePage({ setPage, healthMetrics, foodLog, setFoodLog }) {
  const today = getTodayStr();
  const dailyCalories = calculateTDEE(healthMetrics);
  const macros = calculateMacros(dailyCalories, healthMetrics.goal);
  const [activeTab, setActiveTab] = useState('log');
  const [activeMeal, setActiveMeal] = useState('Breakfast');
  const [foodInput, setFoodInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const todayLog = foodLog[today] || { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  const allEntries = [...(todayLog.Breakfast || []), ...(todayLog.Lunch || []), ...(todayLog.Dinner || []), ...(todayLog.Snacks || [])];
  const totalCals = allEntries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = allEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = allEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = allEntries.reduce((s, e) => s + e.fat, 0);
  const remaining = dailyCalories - totalCals;

  function estimateFood(text) {
    const lower = text.toLowerCase();
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
        return { calories: Math.round(food.cal * quantity), protein: Math.round(food.p * quantity), carbs: Math.round(food.c * quantity), fat: Math.round(food.f * quantity) };
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
            messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } }, { type: 'text', text: 'Look at this meal photo and estimate the nutrition. Respond ONLY with a JSON object like this: {"description":"what you see","items":[{"name":"food item","calories":200,"protein":10,"carbs":25,"fat":8}],"total":{"calories":200,"protein":10,"carbs":25,"fat":8}}. No other text.' }] }]
          })
        });
        const data = await response.json();
        const text = data.content[0].text;
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
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
    const entry = { id: Date.now(), name: analysisResult.description, calories: analysisResult.total.calories, protein: analysisResult.total.protein, carbs: analysisResult.total.carbs, fat: analysisResult.total.fat };
    const updated = { ...todayLog, [activeMeal]: [...(todayLog[activeMeal] || []), entry] };
    setFoodLog({ ...foodLog, [today]: updated });
    setPhotoMode(false);
    setAnalysisResult(null);
  }

  function ProgressBar({ value, max, color }) {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div style={{ backgroundColor: '#0f1923', borderRadius: '6px', height: '8px', overflow: 'hidden', marginTop: '4px' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: value > max ? C.red : color, borderRadius: '6px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>🍎 Calorie Tracker</p>
        <button onClick={() => setPage('settings')} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '22px' }}>⚙️</button>
      </div>
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              {[{ label: 'Protein', val: totalProtein, goal: macros.protein, color: C.blue }, { label: 'Carbs', val: totalCarbs, goal: macros.carbs, color: C.yellow }, { label: 'Fat', val: totalFat, goal: macros.fat, color: C.purple }].map(m => (
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

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
            {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => (
              <button key={meal} onClick={() => setActiveMeal(meal)}
                style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${activeMeal === meal ? C.green : C.cardBorder}`, cursor: 'pointer', backgroundColor: activeMeal === meal ? C.greenGlow : C.card, color: activeMeal === meal ? C.green : C.textMuted, fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {meal}
                {todayLog[meal]?.length > 0 && <span style={{ marginLeft: '6px', backgroundColor: C.green, color: C.bg, borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>{todayLog[meal].length}</span>}
              </button>
            ))}
          </div>

          {(todayLog[activeMeal] || []).length === 0 && !adding && (
            <p style={{ textAlign: 'center', color: C.textMuted, padding: '20px 0' }}>Nothing logged for {activeMeal} yet</p>
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

          {adding && !photoMode && (
            <Card>
              <SectionLabel>Log Food</SectionLabel>
              <StyledInput placeholder="e.g. chicken breast, 2 eggs..." value={foodInput} onChange={e => setFoodInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFood()} />
              <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '12px' }}>Type what you ate and we'll estimate the nutrition automatically.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <OutlineButton onClick={() => setAdding(false)}>Cancel</OutlineButton>
                <GreenButton onClick={addFood}>ADD</GreenButton>
              </div>
            </Card>
          )}

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
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

// ─── TODO PAGE ────────────────────────────────────────────────────────────────
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

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ setPage, healthMetrics, setHealthMetrics }) {
  const [local, setLocal] = useState({ ...healthMetrics, heightFt: healthMetrics.height.split("'")[0], heightIn: healthMetrics.height.split("'")[1] || '0' });
  const [saved, setSaved] = useState(false);
  function update(key, val) { setLocal(prev => ({ ...prev, [key]: val })); }
  function save() {
    setHealthMetrics({ ...local, height: `${local.heightFt}'${local.heightIn}`, weight: parseFloat(local.weight), age: parseInt(local.age), pace: parseFloat(local.pace), goalWeight: parseFloat(local.goalWeight) });
    setSaved(true);
    setTimeout(() => { setSaved(false); setPage('calories'); }, 1500);
  }
  return (
    <div style={{ padding: '20px 16px' }}>
      <BackButton setPage={setPage} to="calories" />
      <p style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>⚙️ Update Your Goals</p>
      <Card>
        <SectionLabel>Body Metrics</SectionLabel>
        <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px' }}>Current Weight (lbs)</p>
        <StyledInput type="number" placeholder="lbs" value={local.weight} onChange={e => update('weight', e.target.value)} />
        <p style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px' }}>Goal Weight (lbs)</p>
        <StyledInput type="number" placeholder="goal lbs" value={local.goalWeight} onChange={e => update('goalWeight', e.target.value)} />
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

export default App;
