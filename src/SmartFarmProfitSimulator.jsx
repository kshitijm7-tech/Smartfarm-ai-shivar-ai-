import { useState, useEffect, useRef } from "react";
import { useLang } from "./App";
import { TRANSLATIONS } from "./translations";


// ── recharts-free mini bar chart ─────────────────────────────────
// ── Premium Bar Chart ──────────────────────────────────────────
function BarChart({ data, height = 130 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height, padding: "0 8px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ 
            width: "100%", 
            borderRadius: "4px 4px 1px 1px", 
            background: `linear-gradient(180deg, ${d.color || "#4ade80"}, ${d.color}22)`, 
            height: `${(d.value / max) * 100}%`, 
            transition: "height 1.2s cubic-bezier(.34, 1.56, .64, 1)", 
            minHeight: 4,
            boxShadow: `0 0 15px ${d.color}33`
          }} />
          <span style={{ fontSize: 9, color: "var(--sub-text)", fontWeight: 700, textTransform: "uppercase" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── animated number counter ──────────────────────────────────────
// ── Animated Number Counter ──────────────────────────────────────
function AnimNum({ value, prefix = "", suffix = "", style: s = {} }) {
  const [disp, setDisp] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    const dur = 1000;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisp(Math.round(from + (to - from) * ease));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span style={{ ...s, fontVariantNumeric: "tabular-nums" }}>{prefix}{disp.toLocaleString()}{suffix}</span>;
}

// ── horizontal slider ────────────────────────────────────────────
function Slider({ label, icon, min, max, step = 1, value, onChange, format, color = "#4ade80", hint }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sub-text)", opacity: 0.9 }}>{label}</span>
          {hint && <span style={{ fontSize: 10, color: "#fff", background: "var(--accent-green)", opacity: 0.9, borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{hint}</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent-green)", fontFamily: "'JetBrains Mono', monospace" }}>{format ? format(value) : value}</span>
      </div>
      <div style={{ position: "relative", height: 8, background: "var(--sidebar-border)", borderRadius: 999, cursor: "pointer" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}22, ${color})`, borderRadius: 999 }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: "-6px 0", opacity: 0, cursor: "pointer", width: "100%", zIndex: 2 }} />
        <div style={{ 
          position: "absolute", 
          top: "50%", 
          left: `${pct}%`, 
          transform: "translate(-50%,-50%)", 
          width: 18, 
          height: 18, 
          borderRadius: "50%", 
          background: "white", 
          border: `4px solid ${color}`, 
          boxShadow: `0 0 15px ${color}66`, 
          transition: "left .1s ease-out", 
          pointerEvents: "none" 
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "var(--sub-text)" }}>{format ? format(min) : min}</span>
        <span style={{ fontSize: 10, color: "var(--sub-text)" }}>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

// ── ring gauge ───────────────────────────────────────────────────
// ── Premium Ring Gauge ──────────────────────────────────────────
function Gauge({ value, max = 100, color, size = 120, label, sublabel }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sidebar-border)" strokeWidth={12} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={12}
            strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.5s cubic-bezier(.34, 1.56, .64, 1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size > 90 ? 22 : 16, fontWeight: 900, color: "var(--text-main)", lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
          <span style={{ fontSize: 10, color: "var(--sub-text)", marginTop: 2, fontWeight: 700 }}>MAX {max}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10, color: "var(--text-main)", fontWeight: 600 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ── CROPS DATA ────────────────────────────────────────────────────
const CROPS = [
  { name: "Wheat", icon: "🌾", yieldPerAcre: 18, pricePerQ: 2340, seedCost: 1200, waterNeed: "Medium", riskBase: 20, season: "Rabi" },
  { name: "Rice", icon: "🍚", yieldPerAcre: 22, pricePerQ: 1980, seedCost: 1800, waterNeed: "High", riskBase: 28, season: "Kharif" },
  { name: "Soybean", icon: "🫘", yieldPerAcre: 12, pricePerQ: 4800, seedCost: 2400, waterNeed: "Low", riskBase: 22, season: "Kharif" },
  { name: "Tomato", icon: "🍅", yieldPerAcre: 80, pricePerQ: 1050, seedCost: 3200, waterNeed: "High", riskBase: 42, season: "All" },
  { name: "Sugarcane", icon: "🎋", yieldPerAcre: 300, pricePerQ: 310, seedCost: 4000, waterNeed: "High", riskBase: 18, season: "Annual" },
  { name: "Cotton", icon: "☁️", yieldPerAcre: 8, pricePerQ: 7200, seedCost: 2800, waterNeed: "Medium", riskBase: 35, season: "Kharif" },
  { name: "Onion", icon: "🧅", yieldPerAcre: 60, pricePerQ: 1100, seedCost: 1600, waterNeed: "Low", riskBase: 48, season: "Rabi" },
  { name: "Mustard", icon: "🌻", yieldPerAcre: 10, pricePerQ: 5400, seedCost: 800, waterNeed: "Low", riskBase: 16, season: "Rabi" },
];

const SEASONS = { en: ["Rabi (Nov–Mar)", "Kharif (Jun–Oct)", "Zaid (Mar–Jun)"], hi: ["रबी (नवंबर-मार्च)", "खरीफ (जून-अक्टूबर)", "ज़ैद (मार्च-जून)"] };
const SOIL_TYPES = { en: ["Loamy", "Black (Regur)", "Red Laterite", "Sandy", "Clay"], hi: ["दोमट", "काली", "लाल लेटराइट", "रेतीली", "चिकनी"] };

export default function ProfitSimulator() {
  // ── inputs ────
  const [cropIdx, setCropIdx] = useState(0);
  const [area, setArea] = useState(3);
  const [season, setSeason] = useState(0);
  const [soilType, setSoilType] = useState(0);
  const [irrigated, setIrrigated] = useState(true);
  const [organic, setOrganic] = useState(false);
  const [labourCost, setLabourCost] = useState(4500);
  const [fertCost, setFertCost] = useState(2800);
  const [pestiCost, setPestiCost] = useState(1200);
  const [sellPrice, setSellPrice] = useState(CROPS[0].pricePerQ);
  const [weatherRisk, setWeatherRisk] = useState(20);
  const [analysisContext, setAnalysisContext] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [saved, setSaved] = useState(false);

  const { lang } = useLang();
  const s = TRANSLATIONS[lang];

  // ── LOAD CONTEXT FROM BRIDGE ───────────────────────────────────
  useEffect(() => {
    // 1. Get farm size from user or latest farm
    const user = JSON.parse(localStorage.getItem("sfai_user") || '{}');
    const farm = JSON.parse(localStorage.getItem("sfai_latest_farm") || '{}');
    const acreage = parseFloat(farm.area_acres || user.farmSize || 3);
    setArea(acreage);

    // 2. Get latest analysis for recommended crop & risks
    const analysisRaw = localStorage.getItem("sfai_latest_analysis");
    if (analysisRaw) {
      try {
        const analysis = JSON.parse(analysisRaw);
        setAnalysisContext(analysis);
        
        // Auto-select recommended crop if found in our CROPS list
        if (analysis.crop?.name) {
          const idx = CROPS.findIndex(c => c.name.toLowerCase() === analysis.crop.name.toLowerCase());
          if (idx !== -1) setCropIdx(idx);
        }
        
        // Auto-adjust weather risk if climate results are present
        if (analysis.daily_manager?.financial_warning?.includes("risk")) {
          setWeatherRisk(prev => Math.max(prev, 40));
        }
      } catch (e) { console.error("Error parsing analysis context", e); }
    }
  }, []);

  const crop = CROPS[cropIdx];

  // ── derived calculations ──────────────────────────────────────
  useEffect(() => { setSellPrice(crop.pricePerQ); }, [cropIdx, crop.pricePerQ]);

  const yieldMulti = irrigated ? 1.18 : 0.88;
  const organicBonus = organic ? 1.22 : 1;
  const soilMulti = [1.05, 1.12, 0.92, 0.78, 0.95][soilType];

  const expectedYield = Math.round(crop.yieldPerAcre * yieldMulti * soilMulti * area);
  const grossRevenue = Math.round(expectedYield * sellPrice * organicBonus); // Added organic bonus to revenue
  const totalInputCost = Math.round((crop.seedCost + labourCost + fertCost + pestiCost) * area);
  const netProfit = grossRevenue - totalInputCost;
  const profitPerAcre = Math.round(netProfit / area);
  const roi = Math.round((netProfit / totalInputCost) * 100);

  const riskScore = Math.min(99, Math.round(
    crop.riskBase
    + weatherRisk * 0.4
    + (organic ? -5 : 0)
    + (!irrigated ? 12 : 0)
    + [0, -3, 5, 10, 3][soilType]
    + (analysisContext?.disease?.severity === "High" ? 15 : 0) // Inject disease risk
  ));

  const bestCase = Math.round(netProfit * 1.28);
  const worstCase = Math.round(netProfit * 0.62);

  const monthlyData = [
    { label: "Nov", value: Math.round(totalInputCost * 0.3 * -1 + 1000), color: "var(--accent-red)" },
    { label: "Dec", value: Math.round(totalInputCost * 0.2 * -1 + 2000), color: "var(--accent-red)" },
    { label: "Jan", value: Math.round(totalInputCost * 0.3 * -1 + 3000), color: "var(--accent-gold)" },
    { label: "Feb", value: Math.round(grossRevenue * 0.15), color: "var(--accent-green)" },
    { label: "Mar", value: Math.round(grossRevenue * 0.85), color: "var(--accent-green)" },
  ].map(d => ({ ...d, value: Math.abs(d.value) }));

  const compareData = CROPS.map(c => ({
    name: c.name, icon: c.icon,
    profit: Math.round((c.yieldPerAcre * c.pricePerQ - c.seedCost - labourCost - fertCost - pestiCost) * area),
    risk: c.riskBase,
  })).sort((a, b) => b.profit - a.profit);

  const riskColor = riskScore < 30 ? "var(--accent-green)" : riskScore < 55 ? "var(--accent-gold)" : "var(--accent-red)";
  const riskLabel = riskScore < 30 ? "Low Risk 🟢" : riskScore < 55 ? "Medium Risk 🟡" : "High Risk 🔴";

  return (
    <div className="profit-simulator-root" style={{
      minHeight: "100vh",
      background: "var(--bg-main, #07100c)",
      fontFamily: "'Syne', 'Poppins', sans-serif",
      color: "var(--text-main, white)"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
        
        .profit-simulator-root {
          --bg-main: #040806;
          --text-main: #ffffff;
          --glass-bg: rgba(255,255,255,.03);
          --glass-border: rgba(255,255,255,.08);
          --sidebar-border: rgba(255,255,255,.06);
          --sub-text: rgba(255,255,255,.45);
          --text-muted: rgba(255,255,255,.35);
          --text-sub: rgba(255,255,255,.6);
          --accent-green: #4ade80;
          --accent-gold: #fbbf24;
          --accent-red: #f87171;
          --accent-purple: #c084fc;
          --accent-blue: #60a5fa;
          
          --bg-hover: rgba(255,255,255,.05);
          --bg-active: rgba(74,222,128,.15);
          --border-light: rgba(255,255,255,.12);
          --border-green: rgba(74,222,128,.2);
          --ai-box-bg: linear-gradient(135deg,#0a2e1f,#0c3b26);
        }

        [data-theme='light'] .profit-simulator-root {
          --bg-main: #f9fafb;
          --text-main: #111827;
          --glass-bg: #ffffff;
          --glass-border: #e5e7eb;
          --sidebar-border: #e5e7eb;
          --sub-text: #374151;
          --text-muted: #6b7280;
          --text-sub: #4b5563;
          --accent-green: #15803d;
          --accent-gold: #ea580c;
          --accent-red: #dc2626;
          --accent-purple: #9333ea;
          --accent-blue: #2563eb;
          
          --bg-hover: #f3f4f6;
          --bg-active: #dcfce7;
          --border-light: #e5e7eb;
          --border-green: #22c55e;
          --ai-box-bg: #166534;
        }

        .profit-simulator-root * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--accent-green); border-radius: 10px; }
        
        .glass { 
          background: var(--glass-bg); 
          backdrop-filter: blur(24px);
          border: 1px solid var(--glass-border); 
          border-radius: 24px; 
          transition: transform .3s cubic-bezier(.34, 1.56, .64, 1), box-shadow .3s;
        }
        .glass:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.2); }
        
        .glass-green { 
          background: linear-gradient(135deg, rgba(74,222,128,.1), rgba(74,222,128,.04)); 
          border: 1px solid rgba(74,222,128,.2); 
          border-radius: 20px; 
        }

        .crop-pill { 
          cursor: pointer; 
          border: 1px solid var(--border-green); 
          background: var(--glass-bg);
          font-family: inherit; 
          transition: all .3s cubic-bezier(.34, 1.56, .64, 1); 
          border-radius: 18px; 
          position: relative;
          overflow: hidden;
        }
        .crop-pill:hover { transform: scale(1.05); border-color: var(--accent-green); }
        .crop-pill.active {
          background: var(--bg-active);
          border-color: var(--border-green);
        }
        [data-theme='light'] .crop-pill.active {
          background: var(--accent-green);
        }
        
        .crop-pill .crop-name { color: var(--text-main); }
        .crop-pill.active .crop-name { color: var(--accent-green); }
        [data-theme='light'] .crop-pill.active .crop-name { color: #ffffff !important; }

        .slide-up { animation: slideUp .7s cubic-bezier(.22, 1, .36, 1) both; }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        
        .pop { animation: pop .5s cubic-bezier(.34, 1.56, .64, 1) both; }
        @keyframes pop { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        
        .num { font-family: 'JetBrains Mono', monospace; letter-spacing: -1px; }
        
        .stagger-1{animation-delay:.1s} .stagger-2{animation-delay:.2s} .stagger-3{animation-delay:.3s} .stagger-4{animation-delay:.4s}
        
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header style={{ padding: "16px 32px", borderBottom: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-main)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#4ade80,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.3px", color: "var(--text-main)" }}>Profit Simulator</div>
            <div style={{ fontSize: 11, color: "var(--sub-text)", fontFamily: "'JetBrains Mono', monospace" }}>Smart Farm AI • Real-time forecast engine</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setComparing(c => !c)}
            style={{ padding: "9px 18px", borderRadius: 12, border: "1px solid var(--border-green)", background: comparing ? "var(--bg-active)" : "var(--glass-bg)", color: comparing ? "#ffffff" : "var(--accent-green)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            ⚖️ {lang==='hi'?'फसलें तुलना करें':'Compare Crops'}
          </button>
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            style={{ padding: "9px 18px", borderRadius: 12, border: "1px solid var(--border-green)", background: saved ? "var(--bg-active)" : "var(--glass-bg)", color: saved ? "#ffffff" : "var(--accent-green)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {saved ? (lang==='hi'?"✓ सहेजा गया!":"✓ Saved!") : `💾 ${lang==='hi'?'रिपोर्ट सहेजें':'Save Report'}`}
          </button>
          <div style={{ background: "var(--bg-active)", border: "1px solid var(--border-green)", borderRadius: 999, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, background: "var(--accent-green)", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: "var(--accent-green)", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>LIVE CALC</span>
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 71px)", overflow: "hidden" }}>

        {/* ── LEFT: CONTROLS ──────────────────────────────────── */}
        <aside style={{ borderRight: "1px solid var(--sidebar-border)", padding: "24px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, background: "var(--bg-main)" }}>

          {/* Crop Selector */}
          <div>
            <div style={{ fontSize: 10, color: "var(--sub-text)", textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 800, marginBottom: 14 }}>Select Crop Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {CROPS.map((c, i) => (
                <button key={i} className={`crop-pill ${cropIdx === i ? 'active' : ''}`} onClick={() => setCropIdx(i)}
                  style={{ padding: "12px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, marginBottom: 4, filter: cropIdx === i ? "none" : "grayscale(0.4)" }}>{c.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase" }} className="crop-name">{c.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Season + Soil */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>{lang==='hi'?'मौसम':'Season'}</div>
              <select value={season} onChange={e => setSeason(Number(e.target.value))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: "var(--bg-hover)", border: "1px solid var(--border-light)", color: "var(--text-main)", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                {SEASONS[lang].map((s, i) => <option key={i} value={i} style={{ background: "var(--bg-main)" }}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>{lang==='hi'?'मिट्टी का प्रकार':'Soil Type'}</div>
              <select value={soilType} onChange={e => setSoilType(Number(e.target.value))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: "var(--bg-hover)", border: "1px solid var(--border-light)", color: "var(--text-main)", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                {SOIL_TYPES[lang].map((s, i) => <option key={i} value={i} style={{ background: "var(--bg-main)" }}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: lang==='hi'?"सिंचाई":"Irrigation", icon: "💧", val: irrigated, set: setIrrigated, hint: lang==='hi'? "+18% उपज":"+18% yield" },
              { label: lang==='hi'?"जैविक":"Organic", icon: "🌿", val: organic, set: setOrganic, hint: lang==='hi'? "+22% मूल्य":"+22% price" },
            ].map((t, i) => (
              <div key={i} onClick={() => t.set(v => !v)}
                style={{ 
                  background: t.val ? "var(--bg-active)" : "var(--glass-bg)", 
                  border: `1px solid ${t.val ? "var(--border-green)" : "var(--glass-border)"}`, 
                  borderRadius: 20, 
                  padding: "16px", 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  transition: "all .3s ease"
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  <div style={{ width: 34, height: 18, borderRadius: 999, background: t.val ? "var(--accent-green)" : "var(--sidebar-border)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 2, left: t.val ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left .25s" }} />
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 600 }}>{t.hint}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: "var(--sidebar-border)" }} />

          {/* Sliders */}
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 3, fontWeight: 600, marginBottom: 16 }}>{lang==='hi'?"खेत के पैरामीटर":"Farm Parameters"}</div>
            <Slider label={lang==='hi'?"जमीन का क्षेत्रफल":"Land Area"} icon="🗺️" min={0.5} max={20} step={0.5} value={area} onChange={setArea} format={v => `${v} ${lang==='hi'?"एकड़":"acres"}`} color="var(--accent-green)" />
            <Slider label={lang==='hi'?"बिक्री मूल्य":"Selling Price"} icon="💰" min={Math.round(crop.pricePerQ * 0.6)} max={Math.round(crop.pricePerQ * 1.5)} step={10} value={sellPrice} onChange={setSellPrice} format={v => `₹${v}/q`} color="var(--accent-green)" hint={lang==='hi'?"मंडी भाव":"Mandi rate"} />
            <Slider label={lang==='hi'?"मौसम जोखिम":"Weather Risk"} icon="🌩️" min={0} max={80} step={5} value={weatherRisk} onChange={setWeatherRisk} format={v => `${v}%`} color={weatherRisk > 50 ? "var(--accent-red)" : "var(--accent-gold)"} />
          </div>

          <div style={{ height: 1, background: "var(--sidebar-border)" }} />

          {/* Cost inputs */}
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 3, fontWeight: 600, marginBottom: 16 }}>{lang==='hi'?"लागत इनपुट (प्रति एकड़)":"Cost Inputs (per acre)"}</div>
            <Slider label={lang==='hi'?"श्रम लागत":"Labour Cost"} icon="👷" min={1000} max={12000} step={100} value={labourCost} onChange={setLabourCost} format={v => `₹${v.toLocaleString()}`} color="var(--accent-purple)" />
            <Slider label={lang==='hi'?"उर्वरक लागत":"Fertilizer Cost"} icon="🧪" min={500} max={8000} step={100} value={fertCost} onChange={setFertCost} format={v => `₹${v.toLocaleString()}`} color="var(--accent-blue)" />
            <Slider label={lang==='hi'?"कीटनाशक लागत":"Pesticide Cost"} icon="🐛" min={0} max={4000} step={100} value={pestiCost} onChange={setPestiCost} format={v => `₹${v.toLocaleString()}`} color="var(--accent-gold)" />
          </div>

          <div className="glass" style={{ background: "var(--bg-active)", border: "1px solid var(--border-green)", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--accent-green)", fontWeight: 800, marginBottom: 10 }}>📋 {crop.name} {lang==='hi'?"त्वरित तथ्य":"Quick Facts"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[[lang==='hi'?"औसत उपज":"Avg Yield", `${crop.yieldPerAcre} q/acre`], [lang==='hi'?"पानी की जरूरत":"Water Need", lang==='hi'? (crop.waterNeed==="Low"?"कम":crop.waterNeed==="High"?"उच्च":"मध्यम") : crop.waterNeed], [lang==='hi'?"मौसम":"Season", crop.season], [lang==='hi'?"मूल जोखिम":"Base Risk", `${crop.riskBase}/100`]].map(([l, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: "var(--sub-text)" }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── RIGHT: RESULTS ──────────────────────────────────── */}
        <main style={{ padding: "24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Big profit headline */}
          <div className="slide-up glass" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 20px 60px rgba(0,0,0,.05)" }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-main)", fontWeight: 900, textTransform: "uppercase", letterSpacing: 4, marginBottom: 12 }}>{crop.icon} {crop.name} • {lang === "hi" ? "अनुमानित लाभ" : "ESTIMATED PROFIT"}</div>
              <div className="num" style={{ fontSize: 62, fontWeight: 900, lineHeight: 1, color: netProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                <AnimNum value={Math.abs(netProfit)} prefix={netProfit < 0 ? "-₹" : "₹"} style={{ fontSize: 62, fontWeight: 900 }} />
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-green)" }} />
                  <span style={{ fontSize: 14, color: "var(--sub-text)", fontWeight: 600 }}>{lang==='hi'?'प्रति एकड़:':'Per acre:'} <span style={{ color: "var(--text-main)", fontWeight: 800 }}>₹{profitPerAcre.toLocaleString()}</span></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-gold)" }} />
                  <span style={{ fontSize: 14, color: "var(--sub-text)", fontWeight: 600 }}>ROI: <span style={{ color: "var(--text-main)", fontWeight: 800 }}>{roi}%</span></span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <Gauge value={riskScore} color={riskColor} label={lang === "hi" ? "जोखिम स्कोर" : "Risk Score"} sublabel={riskScore < 30 ? (lang==='hi'?"कम जोखिम 🟢":"Low Risk 🟢") : riskScore < 55 ? (lang==='hi'?"मध्यम जोखिम 🟡":"Medium Risk 🟡") : (lang==='hi'?"उच्च जोखिम 🔴":"High Risk 🔴")} />
              <Gauge value={Math.min(99, roi)} max={150} color="var(--accent-gold)" label="ROI %" sublabel={lang === "hi" ? "निवेश पर प्रतिफल" : "Return on invest"} />
            </div>
          </div>

          {/* Best / Worst / Expected */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="slide-up stagger-1">
            {[
              { label: lang === "hi" ? "🚀 आदर्श स्थिति" : "🚀 Best Case", val: bestCase, sub: lang === "hi" ? "आदर्श मौसम + उच्चतम मूल्य" : "Ideal weather + peak prices", color: "var(--accent-green)" },
              { label: lang === "hi" ? "🎯 अनुमानित" : "🎯 Expected", val: netProfit, sub: lang === "hi" ? "वर्तमान इनपुट के आधार पर" : "Based on current inputs", color: "var(--accent-gold)" },
              { label: lang === "hi" ? "📉 निराशाजनक स्थिति" : "📉 Worst Case", val: worstCase, sub: lang === "hi" ? "खराब मौसम + कम मूल्य" : "Bad weather + low prices", color: "var(--accent-red)" },
            ].map((s, i) => (
              <div key={i} className="glass" style={{ background: "var(--glass-bg)", border: `1px solid ${s.color}`, borderRadius: 24, padding: "24px" }}>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>{s.label}</div>
                <div className="num" style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 8 }}>
                  <AnimNum value={Math.abs(s.val)} prefix={s.val < 0 ? "-₹" : "₹"} style={{ fontSize: 32, fontWeight: 900 }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{s.sub}</div>
                <div style={{ height: 4, background: "var(--sidebar-border)", borderRadius: 999, marginTop: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, Math.abs(s.val) / Math.abs(bestCase) * 100)}%`, background: s.color, borderRadius: 999, transition: "width 1.2s cubic-bezier(.34, 1.56, .64, 1)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Revenue breakdown + Monthly chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="slide-up stagger-2">

            {/* Revenue vs Cost */}
            <div className="glass" style={{ padding: "26px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20 }}>💹 {lang==='hi'?"राजस्व बनाम लागत":"Revenue vs Cost"}</div>
              <div style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 24 }}>
                {[{ label: lang==='hi'?"सकल राजस्व":"GROSS REVENUE", val: grossRevenue, color: "var(--accent-green)" }, { label: lang==='hi'?"कुल लागत":"TOTAL COST", val: totalInputCost, color: "var(--accent-red)" }].map((b, i) => (
                  <div key={i} style={{ flex: 1, background: "var(--bg-main)", border: `1px solid var(--glass-border)`, borderRadius: 18, padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "var(--sub-text)", fontWeight: 800, marginBottom: 6 }}>{b.label}</div>
                    <div className="num" style={{ fontSize: 24, fontWeight: 900, color: b.color }}>
                      <AnimNum value={b.val} prefix="₹" style={{ fontSize: 24, color: b.color, fontWeight: 900 }} />
                    </div>
                  </div>
                ))}
              </div>

              {[
                { label: lang==='hi'?"बीज लागत":"Seed Cost", val: crop.seedCost * area, color: "var(--accent-blue)" },
                { label: lang==='hi'?"श्रम":"Labour", val: labourCost * area, color: "var(--accent-purple)" },
                { label: lang==='hi'?"उर्वरक":"Fertilizer", val: fertCost * area, color: "var(--accent-blue)" },
                { label: lang==='hi'?"कीटनाशक":"Pesticide", val: pestiCost * area, color: "var(--accent-gold)" },
              ].map((c, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--text-main)", fontWeight: 700 }}>{c.label}</span>
                    <span className="num" style={{ fontSize: 12, color: "var(--text-main)", fontWeight: 800 }}>₹{c.val.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--sidebar-border)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(c.val / totalInputCost) * 100}%`, background: c.color, borderRadius: 999, transition: "width 1s cubic-bezier(.34, 1.56, .64, 1)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly cash flow */}
            <div className="glass" style={{ padding: "22px 24px", background: "var(--glass-bg)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 6 }}>📅 Monthly Cash Flow Projection</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 18 }}>Rabi season: Nov → Mar</div>
              <BarChart data={monthlyData} height={130} />
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { m: "Nov–Jan", desc: "Input costs: seeds, fertilizers, labour", c: "var(--accent-red)", val: `-₹${totalInputCost.toLocaleString()}` },
                  { m: "Feb", desc: "Partial harvest sales begin", c: "var(--accent-gold)", val: `+₹${Math.round(grossRevenue * 0.15).toLocaleString()}` },
                  { m: "Mar", desc: "Main harvest + marketplace sales", c: "var(--accent-green)", val: `+₹${Math.round(grossRevenue * 0.85).toLocaleString()}` },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-hover)", borderRadius: 10 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.c }}>{r.m}</span>
                      <span style={{ fontSize: 11, color: "var(--text-main)", marginLeft: 8 }}>{r.desc}</span>
                    </div>
                    <span className="num" style={{ fontSize: 13, fontWeight: 700, color: r.c, fontFamily: "'JetBrains Mono', monospace" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Yield + Key metrics row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="slide-up stagger-3">
            {[
              { icon: "🌾", label: lang==='hi'?"अनुमानित उपज":"Expected Yield", val: `${expectedYield} q`, sub: `${crop.yieldPerAcre} q/acre ${lang==='hi'?"आधार":"base"}`, color: "var(--accent-green)" },
              { icon: "💰", label: lang==='hi'?"बिक्री मूल्य":"Sell Price", val: `₹${sellPrice}/q`, sub: `${lang==='hi'?"मंडी":"Mandi"}: ₹${Math.round(crop.pricePerQ * 0.93)}/q`, color: "var(--accent-gold)" },
              { icon: "🏭", label: lang==='hi'?"लागत/एकड़":"Input Cost/Acre", val: `₹${Math.round(totalInputCost / area).toLocaleString()}`, sub: lang==='hi'?"बीज+मज़दूर+खाद":"Seeds + labour + fert", color: "var(--accent-purple)" },
              { icon: "📈", label: lang==='hi'?"बराबरी उपज":"Break-Even Yield", val: `${Math.round(totalInputCost / sellPrice)} q`, sub: lang==='hi'?"नुकसान न होने के लिए":"Minimum to not lose", color: "var(--accent-blue)" },
            ].map((m, i) => (
              <div key={i} className="glass" style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontSize: 11, color: "var(--sub-text)", marginBottom: 4 }}>{m.label}</div>
                <div className="num" style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.val}</div>
                <div style={{ fontSize: 11, color: "var(--sub-text)", marginTop: 4 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Crop comparison table */}
          {comparing && (
            <div className="glass pop slide-up" style={{ padding: "22px 24px", background: "var(--glass-bg)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 }}>⚖️ {lang==='hi'?"सभी फसलों की तुलना":"All Crop Comparison"} — {area} {lang==='hi'?"एकड़":"Acres"}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 18 }}>{lang==='hi'?"आपके वर्तमान लागत इनपुट का उपयोग करके अनुमानित शुद्ध लाभ द्वारा रैंक किया गया":"Ranked by estimated net profit using your current cost inputs"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {compareData.map((c, i) => (
                  <div key={i} className="compare-row" onClick={() => { setCropIdx(CROPS.findIndex(x => x.name === c.name)); }}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 14, background: CROPS[cropIdx].name === c.name ? "var(--bg-active)" : "var(--glass-bg)", border: `1px solid ${CROPS[cropIdx].name === c.name ? "var(--border-green)" : "var(--border-light)"}`, cursor: "pointer", transition: "all .2s" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", width: 20, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                    <span style={{ fontSize: 24 }}>{c.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, flex: 1, color: "var(--text-main)" }}>{c.name}</span>
                    <div style={{ flex: 2, height: 6, background: "var(--sidebar-border)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(0, (c.profit / compareData[0].profit) * 100)}%`, background: c.profit > 0 ? "var(--accent-green)" : "var(--accent-red)", borderRadius: 999, transition: "width .9s ease" }} />
                    </div>
                    <div style={{ textAlign: "right", minWidth: 110 }}>
                      <div className="num" style={{ fontSize: 16, fontWeight: 700, color: c.profit > 0 ? "var(--accent-green)" : "var(--accent-red)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.profit > 0 ? "+" : ""}₹{c.profit.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Risk: {c.risk}/100</div>
                    </div>
                    {CROPS[cropIdx].name === c.name && <span style={{ fontSize: 11, color: "var(--accent-green)", background: "var(--bg-active)", padding: "3px 8px", borderRadius: 999 }}>Selected</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendation box */}
          <div className="slide-up stagger-4" style={{ background: "var(--ai-box-bg)", border: "1px solid var(--border-green)", borderRadius: 20, padding: "22px 26px", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>{lang==='hi'?"आपके सेटअप के लिए AI अनुशंसा":"AI Recommendation for Your Setup"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.9)", lineHeight: 1.7, marginBottom: 12 }}>
                {analysisContext?.disease && analysisContext.disease.severity !== "None"
                  ? (lang==='hi'?`💊 अलर्ट: ${analysisContext.disease.disease_name} पाया गया। इससे जोखिम 15% बढ़ जाता है। आपके ₹${netProfit.toLocaleString()} लाभ को बचाने के लिए तुरंत ${analysisContext.disease.action} करें।` : `💊 ALERT: ${analysisContext.disease.disease_name} detected. This increases risk by 15%. ${analysisContext.disease.action} immediately to protect your predicted ₹${netProfit.toLocaleString()} profit.`)
                  : riskScore < 30
                    ? (lang==='hi'?`✅ ${area} एकड़ पर ${crop.name} उत्कृष्ट लग रहा है! ${irrigated ? "सिंचित" : "वर्षा आधारित"} खेती और आपके लागत इनपुट के साथ, यह एक मजबूत मौसम की योजना है। अधिकतम रिटर्न प्राप्त करने के लिए हमारे मार्केटप्लेस के माध्यम से ₹${Math.round(crop.pricePerQ * 1.07).toLocaleString()}/q पर बेचने पर विचार करें।` : `✅ ${crop.name} on ${area} acres looks excellent! With ${irrigated ? "irrigation" : "rain-fed"} farming and your cost inputs, this is a strong season play. Consider selling through our marketplace at ₹${Math.round(crop.pricePerQ * 1.07).toLocaleString()}/q to maximize returns.`)
                    : riskScore < 55
                      ? (lang==='hi'?`⚠️ मध्यम जोखिम पाया गया। ${weatherRisk > 40 ? "उच्च जलवायु अस्थिरता — फसल बीमा पर विचार करें।" : "वर्तमान इनपुट बनाए रखें लेकिन कड़ी निगरानी रखें।"} ${organic ? "जैविक" : "मानक"} प्रथाओं के साथ, आप ₹${profitPerAcre.toLocaleString()}/एकड़ की उम्मीद कर सकते हैं।` : `⚠️ Moderate risk detected. ${weatherRisk > 40 ? "High climate volatility — consider crop insurance." : "Maintain current inputs but monitor closely."} With ${organic ? "organic" : "standard"} practices, you can expect ₹${profitPerAcre.toLocaleString()}/acre.`)
                      : (lang==='hi'?`🔴 उच्च जोखिम परिदृश्य! ${analysisContext?.daily_manager?.financial_warning || "जलवायु अस्थिरता"} और ${crop.name} का जोखिम चिंताजनक है। हम सरसों जैसे सुरक्षित विकल्पों और फसल बीमा की सलाह देते हैं।` : `🔴 High risk scenario! ${analysisContext?.daily_manager?.financial_warning || "Climate volatility"} combined with ${crop.name}'s risk is concerning. We recommend crop insurance and safer alternatives like Mustard.`)
                }
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={{ padding: "8px 18px", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", color: "#ffffff", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📋 {lang==='hi'?"पूर्ण रिपोर्ट देखें":"View Full Report"}</button>
                <button style={{ padding: "8px 18px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.2)", color: "#ffffff", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🛡️ {lang==='hi'?"फसल बीमा प्राप्त करें":"Get Crop Insurance"}</button>
                <button onClick={() => window.setActiveScreen("market")} style={{ padding: "8px 18px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.2)", color: "#ffffff", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🛒 {lang==='hi'?"मार्केटप्लेस पर बेचें":"List on Marketplace"}</button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
