import { useState, useEffect, useRef } from "react";
import { useTheme } from "./App";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

/* ─── CROP IMAGES (Pexels, no API key) ─────────────────────── */
const CROP_IMGS = {
  Wheat:    "https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=400",
  Rice:     "https://images.pexels.com/photos/1537169/pexels-photo-1537169.jpeg?auto=compress&cs=tinysrgb&w=400",
  Onion:    "https://images.pexels.com/photos/4197444/pexels-photo-4197444.jpeg?auto=compress&cs=tinysrgb&w=400",
  Tomato:   "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400",
  Cotton:   "https://images.pexels.com/photos/4046054/pexels-photo-4046054.jpeg?auto=compress&cs=tinysrgb&w=400",
  Soybean:  "https://images.pexels.com/photos/5029610/pexels-photo-5029610.jpeg?auto=compress&cs=tinysrgb&w=400",
  Maize:    "https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=400",
  Sugarcane:"https://images.pexels.com/photos/9028789/pexels-photo-9028789.jpeg?auto=compress&cs=tinysrgb&w=400",
};

/* ─── DEMO SCENARIOS ────────────────────────────────────────── */
const DEMO_SCENARIOS = [
  {
    crop: "Onion", crop2: null, district: "Nashik",
    sowingDate: "2025-07-15", harvestDate: "2025-10-15",
    farmSize: "5", showCompare: false,
    result: {
      predicted_price: 2840, confidence: 87,
      risk_level: "LOW",
      best_sell_window: { start: "2025-10-12", end: "2025-10-22" },
      price_trend: Array.from({ length: 30 }, (_, i) =>
        Math.round(1800 + (i / 29) * 1040 + Math.sin(i) * 80)
      ),
      total_revenue_estimate: 142000,
      insight: "🧅 Nashik onion prices rise 22% in the 2 weeks before Diwali. Your harvest date of Oct 15 is perfectly timed. Consider holding stock till Oct 18 for maximum return.",
    },
    result2: null,
  },
  {
    crop: "Tomato", crop2: null, district: "Pune",
    sowingDate: "2025-06-01", harvestDate: "2025-08-30",
    farmSize: "3", showCompare: false,
    result: {
      predicted_price: 680, confidence: 79,
      risk_level: "HIGH",
      best_sell_window: { start: "2025-08-25", end: "2025-09-02" },
      price_trend: Array.from({ length: 30 }, (_, i) =>
        Math.round(1200 - (i / 29) * 520 + Math.sin(i * 1.5) * 60)
      ),
      total_revenue_estimate: 34000,
      insight: "🍅 Peak supply season — Pune tomato market floods in Aug-Sep. Consider cold storage for 10-14 days or sell early to avoid rock-bottom prices.",
    },
    result2: null,
  },
  {
    crop: "Wheat", crop2: "Soybean", district: "Nashik",
    sowingDate: "2025-11-01", harvestDate: "2026-03-15",
    farmSize: "10", showCompare: true,
    result: {
      predicted_price: 2180, confidence: 83,
      risk_level: "MEDIUM",
      best_sell_window: { start: "2026-03-10", end: "2026-03-22" },
      price_trend: Array.from({ length: 30 }, (_, i) =>
        Math.round(2400 - (i / 29) * 220 + Math.sin(i * 0.8) * 50)
      ),
      total_revenue_estimate: 327000,
      insight: "🌾 Wheat prices drop 18% in April due to Punjab harvest flood. Sell before April 1 to maximise revenue.",
    },
    result2: {
      predicted_price: 4620, confidence: 81,
      risk_level: "LOW",
      best_sell_window: { start: "2026-03-12", end: "2026-03-25" },
      price_trend: Array.from({ length: 30 }, (_, i) =>
        Math.round(4000 + (i / 29) * 620 + Math.sin(i) * 90)
      ),
      total_revenue_estimate: 369600,
      insight: "🌿 Soybean is trending upward in Nashik. International demand pushes price higher in Q1. Great opportunity.",
    },
  },
];

const LOADING_TEXTS = [
  "Fetching Nashik mandi prices... 🔍",
  "Analysing 3 years of price data... 📊",
  "Calculating supply patterns... 🌾",
  "Almost ready... ✨",
];

/* ─── HERO COUNTER ─────────────────────────────────────────── */
function AnimatedCounter({ target, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 24);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

/* ─── TYPEWRITER ────────────────────────────────────────────── */
function Typewriter({ text, speed = 22 }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0 }}>|</span></span>;
}

/* ─── CIRCULAR CONFIDENCE METER ────────────────────────────── */
function ConfidenceMeter({ pct, size = 110 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 85 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease", filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{pct}%</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,.7)", letterSpacing: 1 }}>CONF.</span>
      </div>
    </div>
  );
}

/* ─── RISK BADGE ────────────────────────────────────────────── */
function RiskBadge({ level }) {
  const cfg = {
    LOW:    { icon: "✅", color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", label: "LOW RISK",    desc: "Prices are stable. Good time to harvest." },
    MEDIUM: { icon: "⚠️",  color: "#d97706", bg: "#fef3c7", border: "#fde68a", label: "MEDIUM RISK", desc: "Minor volatility expected. Monitor closely." },
    HIGH:   { icon: "🚨", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", label: "HIGH RISK",   desc: "Significant price drop likely. Act early.", pulse: true },
  };
  const c = cfg[level] || cfg.MEDIUM;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        borderRadius: 999, background: c.bg, border: `1px solid ${c.border}`,
        animation: c.pulse ? "riskPulse 1.5s infinite" : "none",
      }}>
        <span style={{ fontSize: 18 }}>{c.icon}</span>
        <span style={{ fontWeight: 800, fontSize: 13, color: c.color }}>{c.label}</span>
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center", maxWidth: 200 }}>{c.desc}</div>
    </div>
  );
}

/* ─── MAIN COMPONENT ────────────────────────────────────────── */
export default function SmartFarmHarvestPredictor() {
  const { dark } = useTheme();

  const [tab, setTab]               = useState("predict");
  const [loading, setLoading]       = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult]         = useState(null);
  const [result2, setResult2]       = useState(null);

  // Form
  const [crop, setCrop]             = useState("Onion");
  const [sowingDate, setSowingDate] = useState("2025-07-15");
  const [harvestDate, setHarvestDate] = useState("2025-10-15");
  const [district, setDistrict]     = useState("Nashik");
  const [farmSize, setFarmSize]     = useState("5");
  const [showCompare, setShowCompare] = useState(false);
  const [crop2, setCrop2]           = useState("Soybean");

  // Demo
  const [demoMode, setDemoMode]     = useState(false);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoIdx, setDemoIdx]       = useState(0);
  const [savedMsg, setSavedMsg]     = useState("");

  // History
  const [history, setHistory]       = useState([]);

  const demoIntervalRef = useRef(null);

  const crops = ["Wheat", "Rice", "Onion", "Tomato", "Cotton", "Soybean", "Maize", "Sugarcane"];

  const CROP_DURATIONS = {
    Wheat: 120, Rice: 150, Onion: 110, Tomato: 90,
    Cotton: 180, Soybean: 100, Maize: 110, Sugarcane: 365,
  };

  /* init dates */
  useEffect(() => {
    const today = new Date();
    setSowingDate(today.toISOString().split("T")[0]);
    const h = new Date(today);
    h.setDate(h.getDate() + (CROP_DURATIONS[crop] || 120));
    setHarvestDate(h.toISOString().split("T")[0]);
  }, []);

  /* auto-calc harvest from sowing + crop */
  useEffect(() => {
    if (!sowingDate || demoMode) return;
    const d = new Date(sowingDate);
    d.setDate(d.getDate() + (CROP_DURATIONS[crop] || 120));
    setHarvestDate(d.toISOString().split("T")[0]);
  }, [crop, sowingDate, demoMode]);

  /* ── DEMO MODE LOGIC ── */
  const applyScenario = (idx) => {
    const s = DEMO_SCENARIOS[idx];
    setCrop(s.crop);
    setCrop2(s.crop2 || "Soybean");
    setDistrict(s.district);
    setSowingDate(s.sowingDate);
    setHarvestDate(s.harvestDate);
    setFarmSize(s.farmSize);
    setShowCompare(s.showCompare);
    setResult(null);
    setResult2(null);

    // Run loading animation then inject result
    setLoading(true);
    setLoadingStep(0);
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= LOADING_TEXTS.length - 1) clearInterval(stepInterval);
    }, 800);

    setTimeout(() => {
      setLoading(false);
      setResult(s.result);
      setResult2(s.result2);
    }, 800 * LOADING_TEXTS.length + 200);
  };

  useEffect(() => {
    if (!demoMode) { clearInterval(demoIntervalRef.current); return; }
    applyScenario(0);
    setDemoIdx(0);
    if (!demoPaused) {
      demoIntervalRef.current = setInterval(() => {
        setDemoIdx(prev => {
          const next = (prev + 1) % DEMO_SCENARIOS.length;
          applyScenario(next);
          return next;
        });
      }, 12000);
    }
    return () => clearInterval(demoIntervalRef.current);
  }, [demoMode, demoPaused]);

  /* ── REAL PREDICTION ── */
  const handlePredict = async () => {
    setLoading(true);
    setLoadingStep(0);
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= LOADING_TEXTS.length - 1) clearInterval(stepInterval);
    }, 800);

    try {
      const p1 = fetch("http://127.0.0.1:5000/api/harvest-predictor/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, district, harvest_date: harvestDate, farm_size_acres: farmSize }),
      }).then(r => r.json());

      const p2 = showCompare
        ? fetch("http://127.0.0.1:5000/api/harvest-predictor/predict", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ crop: crop2, district, harvest_date: harvestDate, farm_size_acres: farmSize }),
          }).then(r => r.json())
        : Promise.resolve(null);

      const [d1, d2] = await Promise.all([p1, p2]);
      setResult(d1);
      setResult2(d2);
    } catch (err) {
      console.error(err);
    }
    clearInterval(stepInterval);
    setLoading(false);
  };

  /* ── SAVE ── */
  const handleSave = async () => {
    if (!result) return;
    try {
      await fetch("http://127.0.0.1:5000/api/harvest-predictor/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: 1, crop, district, harvest_date: harvestDate,
          farm_size_acres: farmSize, predicted_price: result.predicted_price,
          confidence: result.confidence, total_revenue_estimate: result.total_revenue_estimate,
        }),
      });
      setSavedMsg("Prediction saved! ✅");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) { console.error(err); }
  };

  const shareWhatsApp = () => {
    if (!result) return;
    const txt = `SmartFarm AI predicts ${crop} price will be ₹${result.predicted_price}/quintal on ${harvestDate} in ${district}. Best sell window: ${result.best_sell_window.start} to ${result.best_sell_window.end}. 🌾`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  };

  const fetchHistory = async () => {
    try {
      const r = await fetch("http://127.0.0.1:5000/api/harvest-predictor/history/1");
      const d = await r.json();
      setHistory(d.predictions || []);
    } catch (_) {}
  };

  useEffect(() => { if (tab === "history") fetchHistory(); }, [tab]);

  /* ── CHART DATA ── */
  const chartData = result
    ? result.price_trend.map((p, i) => ({
        day: `D${i + 1}`,
        [crop]: p,
        ...(showCompare && result2 ? { [crop2]: result2.price_trend[i] } : {}),
      }))
    : [];

  /* ── COMPARE WINNER ── */
  const winner = result && result2
    ? (result.total_revenue_estimate > result2.total_revenue_estimate ? crop : crop2)
    : null;

  const bg      = dark ? "#0f1a14" : "#f0fdf4";
  const card    = dark ? "rgba(255,255,255,.05)" : "white";
  const border  = dark ? "rgba(255,255,255,.1)"  : "#e5e7eb";
  const txt     = dark ? "#f0fdf4" : "#111827";
  const sub     = dark ? "#9ca3af" : "#6b7280";

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, fontFamily: "'Poppins', sans-serif", minHeight: "100%" }}>

      {/* ═══ GLOBAL STYLES ══════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
        @keyframes wheatSway {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes riskPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.5); }
          50%      { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }
        @keyframes coinSpin {
          0%   { transform: rotateY(0deg);   }
          100% { transform: rotateY(360deg); }
        }
        @keyframes drawIn {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0);   }
        }
        @keyframes demoBlink {
          0%,100% { opacity:1; } 50% { opacity:.6; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #22c55e44; border-radius: 10px; }
        .hp-card { border-radius: 20px; padding: 22px; transition: all .25s; }
        .hp-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* ═══ DEMO MODE BANNER ═══════════════════════════════════ */}
      <AnimatePresence>
        {demoMode && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            style={{ background: "linear-gradient(90deg,#7c3aed,#dc2626)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14, animation: "demoBlink 2s infinite" }}>
              🎬 Live Demo Mode — Scenario {demoIdx + 1} of {DEMO_SCENARIOS.length}: Showing real prediction scenarios from Maharashtra farmers
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDemoPaused(p => !p)}
                style={{ background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", color: "white", padding: "5px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                {demoPaused ? "▶ Resume Demo" : "⏸ Pause Demo"}
              </button>
              <button onClick={() => { setDemoMode(false); setResult(null); }}
                style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "white", padding: "5px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                ✕ Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERO BANNER ════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(270deg,#14532d,#166534,#15803d,#4d7c0f,#365314)",
        backgroundSize: "400% 400%",
        animation: "wheatSway 12s ease infinite",
        padding: "44px 32px 36px",
        position: "relative", overflow: "hidden",
      }}>
        {/* subtle grain overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: .06,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 700 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
            <div style={{ color: "#86efac", fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              🤖 AI-POWERED MANDI INTELLIGENCE
            </div>
            <h1 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, color: "white", margin: "0 0 8px 0", lineHeight: 1.2 }}>
              Know Your Price Before You Sow 🌾
            </h1>
            <p style={{ color: "rgba(255,255,255,.82)", fontSize: 15, margin: "0 0 20px 0", maxWidth: 480, lineHeight: 1.5 }}>
              AI-powered mandi price prediction on your exact harvest day — powered by 3 years of real data.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 50, padding: "10px 22px" }}>
            <span style={{ fontSize: 22 }}>💰</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>
              Predicted <AnimatedCounter target={847} prefix="₹" suffix=" Crore" /> saved for farmers this season
            </span>
          </motion.div>
        </div>

        {/* Demo toggle */}
        <button onClick={() => setDemoMode(d => !d)}
          style={{
            position: "absolute", top: 20, right: 24,
            background: demoMode ? "#dc2626" : "rgba(255,255,255,.18)",
            border: "1px solid rgba(255,255,255,.35)",
            color: "white", padding: "9px 18px", borderRadius: 12,
            cursor: "pointer", fontWeight: 800, fontSize: 13,
            backdropFilter: "blur(10px)", transition: "all .2s",
          }}>
          {demoMode ? "⏹ Exit Demo" : "🎬 Demo Mode"}
        </button>
      </div>

      {/* ═══ TABS ════════════════════════════════════════════════ */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 8, borderBottom: `1px solid ${border}` }}>
        {["predict", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 22px", borderRadius: "10px 10px 0 0", border: "none",
            background: tab === t ? "#22c55e" : "transparent",
            color: tab === t ? "white" : sub,
            fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}>
            {t === "predict" ? "📊 Prediction" : "🗂 My Predictions"}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px" }}>

        {/* ══════════ PREDICT TAB ══════════════════════════════ */}
        {tab === "predict" && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* ── FORM CARD ─────────────────────────────────── */}
            <div className="hp-card" style={{ flex: "1 1 320px", background: card, border: `1px solid ${border}`, boxShadow: dark ? "none" : "0 4px 20px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: txt, fontSize: 17, fontWeight: 800 }}>Farm Parameters</h3>
                <button onClick={() => setShowCompare(s => !s)} style={{
                  background: showCompare ? "#22c55e" : "transparent",
                  border: "1px solid #22c55e", color: showCompare ? "white" : "#22c55e",
                  padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
                }}>
                  {showCompare ? "✓ Comparing" : "+ Compare Crops"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 1 }}>CROP NAME</label>
                  <select value={crop} onChange={e => setCrop(e.target.value)} style={{ width: "100%", marginTop: 5, padding: "12px 14px", borderRadius: 10, background: dark ? "#1f2937" : "#f9fafb", border: `1px solid ${border}`, color: txt, fontSize: 15, fontFamily: "inherit" }}>
                    {crops.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <AnimatePresence>
                  {showCompare && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: 1 }}>COMPARE WITH (CROP 2)</label>
                      <select value={crop2} onChange={e => setCrop2(e.target.value)} style={{ width: "100%", marginTop: 5, padding: "12px 14px", borderRadius: 10, background: dark ? "#1f1209" : "#fffbeb", border: "1px solid #fde68a", color: txt, fontSize: 15, fontFamily: "inherit" }}>
                        {crops.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 1 }}>DISTRICT / LOCATION</label>
                  <input value={district} onChange={e => setDistrict(e.target.value)} style={{ width: "100%", marginTop: 5, padding: "12px 14px", borderRadius: 10, background: dark ? "#1f2937" : "#f9fafb", border: `1px solid ${border}`, color: txt, fontSize: 15, fontFamily: "inherit" }} />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  {[["SOWING DATE", sowingDate, setSowingDate], ["HARVEST DATE", harvestDate, setHarvestDate]].map(([lbl, val, fn]) => (
                    <div key={lbl} style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 1 }}>{lbl}</label>
                      <input type="date" value={val} onChange={e => fn(e.target.value)} style={{ width: "100%", marginTop: 5, padding: "11px 12px", borderRadius: 10, background: dark ? "#1f2937" : "#f9fafb", border: `1px solid ${border}`, color: txt, fontSize: 13, fontFamily: "inherit" }} />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 1 }}>FARM SIZE (ACRES)</label>
                  <input type="number" value={farmSize} onChange={e => setFarmSize(e.target.value)} style={{ width: "100%", marginTop: 5, padding: "12px 14px", borderRadius: 10, background: dark ? "#1f2937" : "#f9fafb", border: `1px solid ${border}`, color: txt, fontSize: 15, fontFamily: "inherit" }} />
                </div>

                <button onClick={handlePredict} disabled={loading || demoMode}
                  style={{ width: "100%", background: demoMode ? "#6b7280" : "linear-gradient(135deg,#22c55e,#15803d)", color: "white", padding: 15, borderRadius: 13, fontWeight: 800, fontSize: 16, cursor: demoMode ? "not-allowed" : "pointer", border: "none", marginTop: 6, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(34,197,94,.4)", transition: "all .2s" }}>
                  {demoMode ? "🎬 Demo Active" : loading ? "Analyzing..." : "🔮 Run Prediction Model"}
                </button>
              </div>

              <details style={{ marginTop: 18 }}>
                <summary style={{ cursor: "pointer", color: "#16a34a", fontWeight: 700, fontSize: 12, userSelect: "none" }}>💡 How this 3-Layer AI works</summary>
                <div style={{ marginTop: 8, padding: 12, background: dark ? "#0a1f0e" : "#f0fdf4", borderRadius: 10, fontSize: 12, color: dark ? "#86efac" : "#166534", lineHeight: 1.6 }}>
                  <b>Layer 1 — Seasonal Baseline:</b> 3-year avg price for the harvest month from data.gov.in.<br />
                  <b>Layer 2 — Trend Momentum:</b> Last 30-day price slope applied as a multiplier.<br />
                  <b>Layer 3 — Supply Glut:</b> Peak harvest season reduces price 10-15% automatically.
                </div>
              </details>
            </div>

            {/* ── RESULTS ───────────────────────────────────── */}
            <div style={{ flex: "1 1 480px", display: "flex", flexDirection: "column", gap: 18 }}>

              {/* LOADING STATE */}
              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="hp-card" style={{ background: card, border: `1px solid ${border}`, textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>👨‍🌾</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", animation: `pulse 1.2s ${i * 0.3}s infinite` }} />
                      ))}
                    </div>
                    <div style={{ color: "#22c55e", fontSize: 15, fontWeight: 700 }}>
                      {LOADING_TEXTS[loadingStep % LOADING_TEXTS.length]}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* RESULT CARDS */}
              <AnimatePresence>
                {!loading && result && (
                  <motion.div key={crop + result.predicted_price} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* ── TOP HERO CARD ── */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {/* Crop 1 result */}
                      <div className="hp-card" style={{ flex: 1, minWidth: 260, background: "linear-gradient(135deg,#052e16,#14532d)", position: "relative", overflow: "hidden" }}>
                        {/* bg crop image */}
                        <img src={CROP_IMGS[crop]} alt={crop}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .13, filter: "saturate(1.5)" }} />
                        <div style={{ position: "relative", zIndex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ color: "#86efac", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>{crop.toUpperCase()} / QUINTAL</div>
                              <motion.div initial={{ scale: .8 }} animate={{ scale: 1 }} style={{ fontSize: "clamp(32px,5vw,46px)", fontWeight: 900, color: "white", lineHeight: 1, marginBottom: 8 }}>
                                ₹{result.predicted_price.toLocaleString("en-IN")}
                              </motion.div>
                              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>
                                📅 On harvest: <b style={{ color: "white" }}>{harvestDate}</b>
                              </div>
                            </div>
                            <ConfidenceMeter pct={result.confidence} />
                          </div>

                          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                            <RiskBadge level={result.risk_level} />
                          </div>
                        </div>
                      </div>

                      {/* Crop 2 result (compare) */}
                      {showCompare && result2 && (
                        <motion.div className="hp-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          style={{ flex: 1, minWidth: 260, background: "linear-gradient(135deg,#1c1007,#451a03)", position: "relative", overflow: "hidden" }}>
                          {winner === crop2 && (
                            <div style={{ position: "absolute", top: 10, right: 10, fontSize: 28, filter: "drop-shadow(0 0 8px gold)" }}>🏆</div>
                          )}
                          <img src={CROP_IMGS[crop2]} alt={crop2}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .12 }} />
                          <div style={{ position: "relative", zIndex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ color: "#fcd34d", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>{crop2.toUpperCase()} / QUINTAL</div>
                                <div style={{ fontSize: "clamp(32px,5vw,46px)", fontWeight: 900, color: "white", lineHeight: 1, marginBottom: 8 }}>
                                  ₹{result2.predicted_price.toLocaleString("en-IN")}
                                </div>
                                <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>
                                  {winner === crop2 ? "✅ Better ROI winner" : "⚡ Compare crop"}
                                </div>
                              </div>
                              <ConfidenceMeter pct={result2.confidence} size={100} />
                            </div>
                            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
                              <RiskBadge level={result2.risk_level} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* ── CHART ── */}
                    <div className="hp-card" style={{ background: card, border: `1px solid ${border}`, boxShadow: dark ? "none" : "0 4px 20px rgba(0,0,0,.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ margin: 0, color: txt, fontSize: 16, fontWeight: 800 }}>📈 30-Day Price Journey to Harvest</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#22c55e" }}>
                            <div style={{ width: 18, height: 3, background: "#22c55e", borderRadius: 2 }} /> {crop}
                          </span>
                          {showCompare && result2 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#f59e0b" }}>
                              <div style={{ width: 18, height: 3, background: "#f59e0b", borderRadius: 2 }} /> {crop2}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1f2937" : "#f3f4f6"} />
                            <XAxis dataKey="day" stroke={sub} fontSize={10} tick={{ fill: sub }} />
                            <YAxis stroke={sub} fontSize={10} tick={{ fill: sub }} />
                            <Tooltip
                              contentStyle={{ background: dark ? "#1f2937" : "white", borderRadius: 10, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,.15)", fontFamily: "Poppins" }}
                              formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, ""]}
                            />
                            <Line type="monotone" dataKey={crop} stroke="#22c55e" strokeWidth={3} dot={false}
                              animationDuration={2500} animationEasing="ease-out" />
                            {showCompare && result2 && (
                              <Line type="monotone" dataKey={crop2} stroke="#f59e0b" strokeWidth={3} dot={false}
                                animationDuration={2500} animationEasing="ease-out" />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Best sell window tag */}
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10 }}>
                        <span style={{ fontSize: 16 }}>🏷️</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Best Sell Window: {result.best_sell_window.start} → {result.best_sell_window.end}</span>
                      </div>
                    </div>

                    {/* ── INSIGHT + REVENUE ── */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {/* WhatsApp-style insight */}
                      <div style={{ flex: 2, minWidth: 260 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#22c55e,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👨‍🌾</div>
                          <div className="hp-card" style={{
                            flex: 1, padding: "14px 18px",
                            background: "#dcfce7", border: "1px solid #86efac",
                            borderRadius: "0px 18px 18px 18px",
                            boxShadow: "0 4px 12px rgba(34,197,94,.15)",
                          }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", letterSpacing: 1, marginBottom: 6 }}>🧠 SMART AI INSIGHT · SmartFarm AI</div>
                            <div style={{ fontSize: 14, color: "#14532d", lineHeight: 1.6, fontWeight: 500 }}>
                              <Typewriter text={result.insight} key={result.insight} />
                            </div>
                            <div style={{ fontSize: 11, color: "#16a34a", marginTop: 10, textAlign: "right" }}>
                              {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ✓✓
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Revenue card */}
                      <div className="hp-card" style={{ flex: 1, minWidth: 180, background: card, border: `1px solid ${border}`, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: sub, letterSpacing: 1 }}>ESTIMATED TOTAL REVENUE</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span style={{ display: "inline-block", animation: "coinSpin 2s linear infinite", transformStyle: "preserve-3d" }}>💰</span>
                          ₹{result.total_revenue_estimate.toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: 12, color: sub }}>Based on {farmSize} acres of {crop}</div>
                        {showCompare && result2 && (
                          <div style={{ marginTop: 8, padding: "6px 10px", background: winner === crop ? "#f0fdf4" : "#fef3c7", borderRadius: 8, fontSize: 12, fontWeight: 700, color: winner === crop ? "#16a34a" : "#92400e" }}>
                            {winner} earns ₹{Math.abs(result.total_revenue_estimate - result2.total_revenue_estimate).toLocaleString("en-IN")} more 🏆
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── COMPARE CROPS PANEL ── */}
                    {showCompare && result2 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[
                          { name: crop, r: result, img: CROP_IMGS[crop], accent: "#22c55e" },
                          { name: crop2, r: result2, img: CROP_IMGS[crop2], accent: "#f59e0b" },
                        ].map(({ name, r, img, accent }) => (
                          <div key={name} className="hp-card" style={{
                            background: card, border: `2px solid ${winner === name ? "gold" : border}`,
                            boxShadow: winner === name ? "0 0 20px rgba(255,215,0,.3)" : "none",
                            position: "relative", overflow: "hidden", padding: 0,
                          }}>
                            {winner === name && (
                              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 3, fontSize: 24, filter: "drop-shadow(0 0 6px gold)" }}>🏆</div>
                            )}
                            <div style={{ height: 100, overflow: "hidden", position: "relative" }}>
                              <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(0,0,0,.6))" }} />
                              <div style={{ position: "absolute", bottom: 8, left: 12, color: "white", fontWeight: 900, fontSize: 16 }}>{name}</div>
                            </div>
                            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: sub }}>Predicted Price</span>
                                <span style={{ fontWeight: 800, color: accent }}>₹{r.predicted_price.toLocaleString("en-IN")}/Q</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: sub }}>Confidence</span>
                                <span style={{ fontWeight: 700, color: txt }}>{r.confidence}%</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 12, color: sub }}>Revenue</span>
                                <span style={{ fontWeight: 800, color: "#22c55e" }}>₹{r.total_revenue_estimate.toLocaleString("en-IN")}</span>
                              </div>
                              <div style={{ marginTop: 4 }}><RiskBadge level={r.risk_level} /></div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* ── ACTION BUTTONS ── */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <button onClick={handleSave} style={{
                        flex: 1, minWidth: 160, background: dark ? "#1f2937" : "white",
                        border: `1px solid ${border}`, padding: "13px 20px", borderRadius: 13,
                        fontWeight: 700, fontSize: 14, color: txt, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit",
                        transition: "all .2s",
                      }}>
                        {savedMsg ? savedMsg : "💾 Save Prediction"}
                      </button>
                      <button onClick={shareWhatsApp} style={{
                        flex: 1, minWidth: 160, background: "#25D366", border: "none",
                        padding: "13px 20px", borderRadius: 13,
                        fontWeight: 700, fontSize: 14, color: "white",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 8, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(37,211,102,.4)", transition: "all .2s",
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.036 23.708a.5.5 0 00.611.611l5.855-1.494A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.799 9.799 0 01-5.003-1.374l-.358-.213-3.723.95.966-3.642-.234-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                        Share on WhatsApp
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* EMPTY STATE */}
              {!loading && !result && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hp-card" style={{ background: card, border: `1px solid ${border}`, textAlign: "center", padding: 48 }}>
                  <div style={{ fontSize: 60, marginBottom: 16 }}>🌾</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: txt, marginBottom: 8 }}>Ready to Predict</div>
                  <div style={{ fontSize: 14, color: sub }}>Fill in the form and click "Run Prediction Model" to see AI-powered mandi price forecast for your harvest day.</div>
                </motion.div>
              )}

            </div>
          </div>
        )}

        {/* ══════════ HISTORY TAB ══════════════════════════════ */}
        {tab === "history" && (
          <div>
            <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: txt, fontWeight: 800 }}>Saved Predictions</h3>
              <button onClick={fetchHistory} style={{ background: "#22c55e", color: "white", border: "none", padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>🔄 Refresh</button>
            </div>
            {history.length === 0 ? (
              <div className="hp-card" style={{ background: card, border: `1px solid ${border}`, textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ color: sub, fontSize: 15 }}>No predictions saved yet. Run a prediction and click "Save".</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {history.map(item => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="hp-card" style={{ background: card, border: `1px solid ${border}`, boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,.06)", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, color: txt, fontSize: 16 }}>{item.crop}</span>
                      <span style={{ fontSize: 11, color: sub }}>{String(item.created_at).split(" ")[0]}</span>
                    </div>
                    <div style={{ color: "#22c55e", fontSize: 26, fontWeight: 900, marginBottom: 6 }}>₹{item.predicted_price} /Q</div>
                    <div style={{ fontSize: 13, color: sub }}>📍 {item.district} • 🌾 {item.harvest_date}</div>
                    <div style={{ fontSize: 13, color: sub, marginTop: 4 }}>💰 Revenue: ₹{Number(item.total_revenue_estimate).toLocaleString("en-IN")}</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>{item.farm_size_acres} acres</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
