import { useState, useRef, useEffect } from "react";
import { useLang } from "./App";

// ── tiny ring chart ──────────────────────────────────────────────
function Ring({ pct, color, size = 72, stroke = 7, label, sub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{pct}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 1 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>{label}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>{sub}</div>
      </div>
    </div>
  );
}

// ── scan line overlay ────────────────────────────────────────────
function ScanOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 20, pointerEvents: "none" }}>
      {/* corner brackets */}
      {[
        { top: 12, left: 12, borderTop: "3px solid #4ade80", borderLeft: "3px solid #4ade80" },
        { top: 12, right: 12, borderTop: "3px solid #4ade80", borderRight: "3px solid #4ade80" },
        { bottom: 12, left: 12, borderBottom: "3px solid #4ade80", borderLeft: "3px solid #4ade80" },
        { bottom: 12, right: 12, borderBottom: "3px solid #4ade80", borderRight: "3px solid #4ade80" },
      ].map((s, i) => <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />)}
      {/* scan line */}
      <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#4ade80,transparent)", opacity: .8 }}
        className="scanline" />
      {/* grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,.04) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
    </div>
  );
}

const DEFAULT_RESULTS = {
    crop: {
    name: "Wheat (Gehun)", season: "Rabi", sow: "Nov 1–15", icon: "🌾", confidence: 94,
    breakdown: { soil: 94, climate: 88, market: 91, water: 76 },
    indian_options: [
      { name: "Mustard", name_hi: "Sarson", confidence: "81%", icon: "🌻" },
      { name: "Chickpea", name_hi: "Chana", confidence: "74%", icon: "🌰" },
      { name: "Barley", name_hi: "Jau", confidence: "68%", icon: "🌿" }
    ],
    foreign_options: [
      { name: "Oats", confidence: "75%", icon: "🌾" },
      { name: "Quinoa", confidence: "65%", icon: "🌱" }
    ]
  },
  soil: { ph: 6.8, type: "Loamy", moisture: 54, organic: 2.1, score: 86 },
  npk: { n: 68, p: 45, k: 82 },
  disease: [
    { name: "Aphid Risk", level: "Low", color: "#22c55e", action: "Monitor weekly" },
    { name: "Rust Fungus", level: "Detected", color: "#f59e0b", action: "Apply Propiconazole" },
  ],
  fertilizer: [
    { name: "Urea (N)", qty: "50 kg/acre", timing: "At sowing", icon: "🧪" },
    { name: "DAP (P)", qty: "25 kg/acre", timing: "Basal dose", icon: "⚗️" },
    { name: "MOP (K)", qty: "20 kg/acre", timing: "At sowing", icon: "🔬" },
  ],
  weather: { temp: "18–28°C", rain: "Moderate", advisory: "Ideal sowing window open. Avoid fertilizer day before rain.", icon: "🌤️" },
  profit: { best: 52000, worst: 31000, expected: 42000, risk: 24 },
  ndvi: 0.72,
  deep_insights: {
    risk_details: [
      { name: "Drought Stress", icon: "droplet", color: "#fbbf24", probability_score: 15, time_to_impact: "Unlikely", trend: "stable", severity: "Minimal" },
      { name: "Heat Stress", icon: "thermometer", color: "#fb923c", probability_score: 42, time_to_impact: "In 3 days", trend: "rising", severity: "Moderate" },
    ],
    nutrient_profile: [
      { nutrient: "Nitrogen (N)", icon: "N", value: 68, unit: "kg/ha", optimal_range: [50, 80], status: "Optimal", status_color: "#4ade80", deficit_pct: 0, bar_pct: 85 },
      { nutrient: "Potassium (K)", icon: "K", value: 82, unit: "kg/ha", optimal_range: [100, 200], status: "Low", status_color: "#fbbf24", deficit_pct: -45, bar_pct: 41 },
    ],
    scheme_matches: [
      { scheme_name: "PM-KISAN", full_name: "Pradhan Mantri Kisan Samman Nidhi", match_score: 95, eligibility: "Highly Eligible", eligibility_color: "#4ade80", benefit: "Rs. 6,000/year", how_to_apply: "Apply at CSC", url: "https://pmkisan.gov.in" },
      { scheme_name: "Soil Health Card", full_name: "Soil Health Management Scheme", match_score: 88, eligibility: "Eligible", eligibility_color: "#60a5fa", benefit: "Free Soil Testing", how_to_apply: "Visit nearest KVK", url: "https://soilhealth.dac.gov.in" },
      { scheme_name: "KCC Kisan Credit Card", full_name: "Kisan Credit Card Scheme", match_score: 80, eligibility: "Eligible", eligibility_color: "#60a5fa", benefit: "Up to ₹3 Lakh", how_to_apply: "Apply at Nearest Bank", url: "https://www.nabard.org/content.aspx?id=572" },
      { scheme_name: "e-NAM", full_name: "National Agriculture Market", match_score: 72, eligibility: "Eligible", eligibility_color: "#fbbf24", benefit: "Online Mandi Access", how_to_apply: "Register at enam.gov.in", url: "https://www.enam.gov.in" },
      { scheme_name: "PMKSY", full_name: "PM Krishi Sinchai Yojana", match_score: 68, eligibility: "Eligible", eligibility_color: "#fbbf24", benefit: "Irrigation Subsidy", how_to_apply: "Apply via District Office", url: "https://pmksy.gov.in" },
      { scheme_name: "PM Fasal Bima", full_name: "Crop Insurance Scheme", match_score: 65, eligibility: "Eligible", eligibility_color: "#60a5fa", benefit: "Insurance cover", how_to_apply: "Enrol via Bank", url: "https://pmfby.gov.in" }
    ]
  }
};

const HISTORY = [
  { date: "Oct 28", crop: "Tomato Field", score: 78, icon: "🍅", status: "Disease Alert" },
  { date: "Oct 22", crop: "Main Farm", score: 91, icon: "🌾", status: "Excellent" },
  { date: "Oct 15", crop: "Field B", score: 63, icon: "🌽", status: "Low Moisture" },
];

const getFertilizerPlan = (cropName) => {
  const plans = {
    "Wheat": {
      total: "2,785",
      items: [
        { icon: "🧪", name: "Urea (N)", qty: "50 kg/acre", timing: "At sowing", cost: "₹1,150", c: "#4ade80" },
        { icon: "⚗️", name: "DAP (P+N)", qty: "25 kg/acre", timing: "basal dose", cost: "₹875", c: "#60a5fa" },
        { icon: "💊", name: "MOP (K)", qty: "20 kg/acre", timing: "At sowing", cost: "₹540", c: "#fbbf24" },
        { icon: "✨", name: "Zinc Sulphate", qty: "5 kg/acre", timing: "After 21 days", cost: "₹220", c: "#818cf8" }
      ]
    },
    "Rice (Paddy)": {
      total: "3,725",
      items: [
        { icon: "🧪", name: "Urea (N)", qty: "60 kg/acre", timing: "split dose", cost: "₹1,380", c: "#4ade80" },
        { icon: "⚗️", name: "DAP (P+N)", qty: "30 kg/acre", timing: "basal dose", cost: "₹1,050", c: "#60a5fa" },
        { icon: "💊", name: "MOP (K)", qty: "25 kg/acre", timing: "At sowing", cost: "₹675", c: "#fbbf24" },
        { icon: "🌿", name: "Neem Coated Urea", qty: "20 kg/acre", timing: "At sowing", cost: "₹620", c: "#818cf8" }
      ]
    },
    "Soybean": {
      total: "2,795",
      items: [
        { icon: "⚗️", name: "DAP (P+N)", qty: "50 kg/acre", timing: "basal dose", cost: "₹1,750", c: "#4ade80" },
        { icon: "💊", name: "MOP (K)", qty: "25 kg/acre", timing: "At sowing", cost: "₹675", c: "#60a5fa" },
        { icon: "✨", name: "Zinc Sulphate", qty: "5 kg/acre", timing: "After 21 days", cost: "₹220", c: "#fbbf24" },
        { icon: "🌿", name: "Rhizobium Culture", qty: "1 packet/acre", timing: "Seed treatment", cost: "₹150", c: "#818cf8" }
      ]
    },
    "Maize": {
      total: "3,925",
      items: [
        { icon: "🧪", name: "Urea (N)", qty: "65 kg/acre", timing: "split dose", cost: "₹1,495", c: "#4ade80" },
        { icon: "⚗️", name: "DAP (P+N)", qty: "40 kg/acre", timing: "basal dose", cost: "₹1,400", c: "#60a5fa" },
        { icon: "💊", name: "MOP (K)", qty: "30 kg/acre", timing: "At sowing", cost: "₹810", c: "#fbbf24" },
        { icon: "✨", name: "Zinc Sulphate", qty: "5 kg/acre", timing: "After 21 days", cost: "₹220", c: "#818cf8" }
      ]
    },
    "Cotton": {
      total: "3,250",
      items: [
        { icon: "🧪", name: "Urea (N)", qty: "45 kg/acre", timing: "split dose", cost: "₹1,035", c: "#4ade80" },
        { icon: "⚗️", name: "DAP (P+N)", qty: "35 kg/acre", timing: "basal dose", cost: "₹1,225", c: "#60a5fa" },
        { icon: "💊", name: "MOP (K)", qty: "30 kg/acre", timing: "split dose", cost: "₹810", c: "#fbbf24" },
        { icon: "🌿", name: "Boron", qty: "1 kg/acre", timing: "after 30 days", cost: "₹180", c: "#818cf8" }
      ]
    }
  };
  
  const defaultPlan = {
    total: "2,815",
    items: [
      { icon: "🧪", name: "Urea (N)", qty: "50 kg/acre", timing: "At sowing", cost: "₹1,150", c: "#4ade80" },
      { icon: "⚗️", name: "DAP (P+N)", qty: "25 kg/acre", timing: "basal dose", cost: "₹875", c: "#60a5fa" },
      { icon: "💊", name: "MOP (K)", qty: "20 kg/acre", timing: "At sowing", cost: "₹540", c: "#fbbf24" },
      { icon: "🔬", name: "Micronutrients", qty: "5 kg/acre", timing: "as needed", cost: "₹250", c: "#818cf8" }
    ]
  };

  return plans[cropName] || defaultPlan;
};

export default function AIAnalyzer() {
  const { lang, setLang } = useLang();
  const [phase, setPhase] = useState("upload"); // upload | scanning | results
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null); // Store the actual File object for API
  const [scanStep, setScanStep] = useState(0);
  const [activeTab, setActiveTab] = useState("crop");
  const [cropRecTab, setCropRecTab] = useState("indian"); // indian | foreign
  const [resultIn, setResultIn] = useState(false);
  const fileRef = useRef();
  const abortRef = useRef(null); // AbortController ref for in-flight fetch

  const [results, setResults] = useState(DEFAULT_RESULTS);
  const [realWeather, setRealWeather] = useState(null);

  useEffect(() => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            fetchRealWeather(lat, lon);
          },
          (err) => {
            console.log("Location denied, keeping default weather data");
          }
        );
      }
    } catch (err) {
      console.log("Geolocation error, keeping default data");
    }
  }, []);

  const fetchRealWeather = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=5`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.daily) {
        setRealWeather(data.daily);
      }
    } catch (err) {
      console.log("Weather fetch failed, keeping default data");
    }
  };

  const SCAN_STEPS = lang === "hi" ? [
    "🛰️  सैटेलाइट डेटा लोड हो रहा है...",
    "🔬  मिट्टी की संरचना का विश्लेषण...",
    "🌱  फसल पैटर्न की पहचान...",
    "🐛  कीटों और बीमारियों की स्कैनिंग...",
    "📊  लाभ क्षमता की गणना...",
    "✅  पूर्ण कृषि रिपोर्ट तैयार की जा रही है...",
  ] : [
    "🛰️  Loading satellite data...",
    "🔬  Analyzing soil composition...",
    "🌱  Identifying crop patterns...",
    "🐛  Scanning for pests & disease...",
    "📊  Calculating profit potential...",
    "✅  Generating full farm report...",
  ];

  // Auto-scan if arriving from 'Locate Farm'
  useEffect(() => {
    const savedFarmData = localStorage.getItem("sfai_latest_farm");
    if (savedFarmData) {
      localStorage.removeItem("sfai_latest_farm"); // Consume it so it only runs once
      try {
        const farm = JSON.parse(savedFarmData);
        if (farm.coordinates) {
          const coords = JSON.parse(farm.coordinates);
          if (coords.length > 0) {
            // Start scan with first coordinate
            const payload = {
              farmer_id: farm.farmer_id || 1,
              lat: coords[0].lat,
              lon: coords[0].lng
            };

            let capturedFile = null;
            if (farm.image) {
              // Convert base64 DataURL back to a File object so the API can process it
              const arr = farm.image.split(',');
              const mime = arr[0].match(/:(.*?);/)[1];
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              capturedFile = new File([u8arr], "farm_capture.jpg", { type: mime });
              setImageFile(capturedFile); // Also store it for retries if needed
            }

            // Start scan using the captured image or a simulated one
            startScan(farm.image || null, payload, capturedFile);
          }
        }
      } catch (e) {
        console.error("Error parsing farm data", e);
      }
    }
  }, []);

  const runApiAnalysis = async (payload, file = null) => {
    // Create a new AbortController for this request
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const formData = new FormData();
      formData.append("farmer_id", payload.farmer_id || 1);
      formData.append("lat", payload.lat);
      formData.append("lon", payload.lon);
      if (file) formData.append("image_file", file);

      console.log("--- [REQUEST] Sending to /analyze_farm ---");

      const res = await fetch("http://localhost:5000/analyze_farm", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      console.log("--- [RESPONSE] Status:", res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        const normalized = { ...data };

        // Map crop data if present (top_match, indian, foreign arrays)
        if (data.crop) {
          if (data.crop.top_match) {
            normalized.crop = {
              name: data.crop.top_match.name || "Unknown Crop",
              icon: data.crop.top_match.icon || "🌱",
              season: data.crop.top_match.season || "Any",
              sow: data.crop.top_match.sow || "Check local calendar",
              confidence: data.crop.top_match.confidence || 0,
              breakdown: data.crop.top_match.breakdown || { soil: 80, climate: 80, market: 80, water: 80 },
              indian_options: data.crop.indian || [],
              foreign_options: data.crop.foreign || []
            };
          } else {
            // If backend returned crop data but no top_match, just pass it through 
            normalized.crop = { ...normalized.crop, ...data.crop };
          }
        }

        // Map disease object -> array (UI expects an array)
        if (data.disease && !Array.isArray(data.disease)) {
          normalized.disease = [{
            name: data.disease.name || "Unknown",
            level: data.disease.severity || "Low",
            color: data.disease.severity === "High" ? "#f87171" :
              data.disease.severity === "Moderate" ? "#f59e0b" : "#22c55e",
            action: data.disease.action || "Monitor"
          }];
        }
        if (typeof normalized.ndvi !== "number") normalized.ndvi = data.land_health?.ndvi || 0.5;
        if (normalized.soil && !normalized.soil.score && data.land_health) normalized.soil.score = data.land_health.health_score;
        if (normalized.profit && data.environment) normalized.profit.risk = data.environment.risk_percentage || normalized.profit.risk;
        if (!normalized.deep_insights) normalized.deep_insights = data.deep_insights || DEFAULT_RESULTS.deep_insights;

        setResults(normalized);
        console.log("--- [UI] Results state updated successfully ---");
        return true; // signal success to startScan
      } else {
        const errText = await res.text();
        console.error("--- [ERROR]", res.status, res.statusText, errText);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("--- [NETWORK ERROR] Is the Flask server running?", err);
      }
    }
    return false; // signal failure
  };

  const startScan = (url, apiPayload = null, file = null) => {
    setPreviewUrl(url);
    setPhase("scanning");
    setScanStep(0);

    const STEP_INTERVAL_MS = 500; // advance one step every 500 ms
    let currentStep = 0;

    // Ticker: advance scan steps visually at a regular interval
    const iv = setInterval(() => {
      currentStep++;
      setScanStep(currentStep);
      // Stop advancing at the second-to-last step — wait for the API
      if (currentStep >= SCAN_STEPS.length - 2) {
        clearInterval(iv);
      }
    }, STEP_INTERVAL_MS);

    // Launch the real API request
    const analysisPayload = apiPayload || { farmer_id: 1, lat: 20.59, lon: 78.96 };
    runApiAnalysis(analysisPayload, file || imageFile).then((success) => {
      // API responded (success or failure) — complete the animation immediately
      clearInterval(iv);
      setScanStep(SCAN_STEPS.length - 1); // snap to final step
      setTimeout(() => {
        setPhase("results");
        setTimeout(() => setResultIn(true), 80);
      }, 400);
    });
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file); // Store File object for the API call
    const url = URL.createObjectURL(file);
    startScan(url, null, file); // Pass the file to startScan -> runApiAnalysis
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const useSample = () => startScan("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80");

  const reset = () => {
    // Abort any in-flight API request before resetting (Audit Fix 6.1)
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setPhase("upload"); setPreviewUrl(null); setImageFile(null); setResultIn(false); setScanStep(0); setActiveTab("crop");
  };

  const TABS = lang === "hi" ? [
    { id: "crop", icon: "🌾", label: "फसल" },
    { id: "soil", icon: "🧪", label: "मिट्टी" },
    { id: "disease", icon: "🐛", label: "बीमारी" },
    { id: "fertilizer", icon: "⚗️", label: "उर्वरक" },
    { id: "profit", icon: "💰", label: "लाभ" },
    { id: "weather", icon: "🌤️", label: "मौसम" },
    { id: "insights", icon: "📊", label: "अंतर्दृष्टि" },
  ] : [
    { id: "crop", icon: "🌾", label: "Crop" },
    { id: "soil", icon: "🧪", label: "Soil" },
    { id: "disease", icon: "🐛", label: "Disease" },
    { id: "fertilizer", icon: "⚗️", label: "Fertilizer" },
    { id: "profit", icon: "💰", label: "Profit" },
    { id: "weather", icon: "🌤️", label: "Weather" },
    { id: "insights", icon: "📊", label: "Insights" },
  ];

  let weatherDisplayData = [
    { day: "Today", icon: "🌤️", h: 32, l: 24, rain: "10%", adv: "Good for sowing" }, 
    { day: "Wed", icon: "🌧️", h: 28, l: 21, rain: "80%", adv: "Avoid spraying" }, 
    { day: "Thu", icon: "⛈️", h: 25, l: 19, rain: "95%", adv: "Stay indoors" }, 
    { day: "Fri", icon: "🌥️", h: 27, l: 20, rain: "40%", adv: "Light field work" }, 
    { day: "Sat", icon: "☀️", h: 33, l: 23, rain: "5%", adv: "Resume spraying" }
  ];
  
  let climateRisksData = [
    { risk: "Flood Risk", level: "Low", pct: 15, c: "#60a5fa" }, 
    { risk: "Drought Risk", level: "Low", pct: 12, c: "#fbbf24" }, 
    { risk: "Heat Stress", level: "Medium", pct: 42, c: "#f87171" }, 
    { risk: "Frost Risk", level: "Very Low", pct: 5, c: "#818cf8" }
  ];

  let insightsRadarData = results.deep_insights?.risk_details?.slice(0, 4) || [];

  try {
    if (realWeather && realWeather.time && realWeather.time.length > 0) {
      const getEmoji = (code) => {
        if (code === 0) return "☀️";
        if (code >= 1 && code <= 3) return "⛅";
        if (code >= 45 && code <= 48) return "🌫️";
        if (code >= 51 && code <= 61) return "🌧️";
        if (code >= 80 && code <= 82) return "🌦️";
        if (code >= 95 && code <= 99) return "⛈️";
        return "🌥️";
      };

      const getDay = (dateStr, idx) => {
        if (idx === 0) return "Today";
        if (idx === 1) return "Tomorrow";
        try {
          return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
        } catch(e) { return "Day"; }
      };

      let anyRainOver20 = false;
      let anyRainOver10 = false;
      let maxT = -100;
      let minT = 100;
      let allZeroRain = true;

      weatherDisplayData = realWeather.time.slice(0, 5).map((dateStr, i) => {
        const h = Math.round(realWeather.temperature_2m_max[i] || 0);
        const l = Math.round(realWeather.temperature_2m_min[i] || 0);
        const p = realWeather.precipitation_sum[i] || 0;
        const icon = getEmoji(realWeather.weathercode[i] || 0);
        
        if (p > 20) anyRainOver20 = true;
        if (p > 10) anyRainOver10 = true;
        if (p > 0) allZeroRain = false;
        if (h > maxT) maxT = h;
        if (l < minT) minT = l;

        let adv = "Good weather window";
        if (p > 10) adv = "Avoid spraying";
        else if (h > 38) adv = "Water early";
        
        return {
          day: getDay(dateStr, i),
          icon,
          h, l,
          rain: p > 0 ? `${Math.round(p)}mm` : "0%",
          adv
        };
      });

      let floodRisk = "Low";
      if (anyRainOver20) floodRisk = "High";
      else if (anyRainOver10) floodRisk = "Medium";

      let droughtRisk = allZeroRain ? "High" : "Low";
      
      let heatRisk = "Low";
      if (maxT > 38) heatRisk = "High";
      else if (maxT > 34) heatRisk = "Medium";

      let frostRisk = minT < 5 ? "High" : "Very Low";

      climateRisksData = [
        { 
          risk: "Flood Risk", 
          level: floodRisk, 
          pct: floodRisk === "High" ? 80 : (floodRisk === "Medium" ? 50 : 15), 
          c: floodRisk === "High" ? "#f87171" : (floodRisk === "Medium" ? "#fbbf24" : "#60a5fa")
        },
        { 
          risk: "Drought Risk", 
          level: droughtRisk, 
          pct: droughtRisk === "High" ? 85 : 12, 
          c: droughtRisk === "High" ? "#f87171" : "#fbbf24"
        },
        { 
          risk: "Heat Stress", 
          level: heatRisk, 
          pct: heatRisk === "High" ? 85 : (heatRisk === "Medium" ? 50 : 15), 
          c: heatRisk === "High" ? "#f87171" : (heatRisk === "Medium" ? "#fbbf24" : "#4ade80")
        },
        { 
          risk: "Frost Risk", 
          level: frostRisk, 
          pct: frostRisk === "High" ? 85 : 5, 
          c: frostRisk === "High" ? "#f87171" : "#818cf8"
        }
      ];

      insightsRadarData = [
        { name: "Flood Risk", severity: climateRisksData[0].level, probability_score: climateRisksData[0].pct, color: climateRisksData[0].c, time_to_impact: climateRisksData[0].level === "High" ? "Immediate" : "Unlikely" },
        { name: "Drought Stress", severity: climateRisksData[1].level, probability_score: climateRisksData[1].pct, color: climateRisksData[1].c, time_to_impact: climateRisksData[1].level === "High" ? "Immediate" : "Unlikely" },
        { name: "Heat Stress", severity: climateRisksData[2].level, probability_score: climateRisksData[2].pct, color: climateRisksData[2].c, time_to_impact: climateRisksData[2].level === "High" ? "Immediate" : "Unlikely" },
        { name: "Frost Risk", severity: climateRisksData[3].level, probability_score: climateRisksData[3].pct, color: climateRisksData[3].c, time_to_impact: climateRisksData[3].level === "High" ? "Immediate" : "Unlikely" }
      ];
    }
  } catch (err) {
    console.log("Error processing real weather, falling back to static data", err);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060f0a", fontFamily: "'DM Sans', 'Poppins', sans-serif", color: "white", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #1a3d2b; border-radius: 10px; }
        .scanline { animation: scanline 2s linear infinite; }
        @keyframes scanline { 0%{top:0%} 100%{top:100%} }
        .fadein { animation: fadein .5s ease forwards; opacity: 0; }
        @keyframes fadein { to { opacity: 1; } }
        .slideup { animation: slideup .5s cubic-bezier(.4,0,.2,1) forwards; opacity: 0; transform: translateY(18px); }
        @keyframes slideup { to { opacity: 1; transform: none; } }
        .glow { box-shadow: 0 0 30px rgba(74,222,128,.25); }
        .tab-btn { cursor: pointer; border: none; font-family: inherit; transition: all .2s; }
        .tab-btn:hover { opacity: .85; }
        .card-dark { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 18px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.5)} }
        .spin { animation: spin 1.2s linear infinite; display:inline-block; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .bar-fill { transition: width 1.2s cubic-bezier(.4,0,.2,1); }
        .history-row:hover { background: rgba(74,222,128,.06) !important; }
        .upload-zone:hover { border-color: rgba(74,222,128,.8) !important; background: rgba(74,222,128,.05) !important; }
        .result-card { animation: cardIn .45s cubic-bezier(.4,0,.2,1) both; }
        @keyframes cardIn { from{opacity:0;transform:translateY(22px) scale(.97)} to{opacity:1;transform:none} }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <header style={{ padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(6,15,10,.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={reset} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", borderRadius: 10, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.1)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#4ade80,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔬</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{lang === "hi" ? "AI कृषि विश्लेषक" : "AI Farm Analyzer"}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{lang === "hi" ? "स्मार्ट फार्म एआई • विजन एआई द्वारा संचालित" : "Smart Farm AI • Powered by Vision AI"}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 999, padding: "5px 14px" }}>
            <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block" }} className="pulse" />
            <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>{lang === "hi" ? "AI इंजन ऑनलाइन" : "AI Engine Online"}</span>
          </div>
          <button onClick={() => setLang(lang === "hi" ? "en" : "hi")} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", borderRadius: 10, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "hi" ? "🌐 English" : "🌐 हिंदी"}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden" }}>

        {/* ── LEFT PANEL ──────────────────────────────────── */}
        <div style={{ width: 300, borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Upload / Preview area */}
          <div style={{ padding: 20, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>{lang === 'hi' ? 'खेत की फोटो' : 'Farm Photo'}</div>

            {phase === "upload" && (
              <div className="upload-zone"
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                style={{ border: `2px dashed ${dragOver ? "rgba(74,222,128,.8)" : "rgba(74,222,128,.25)"}`, borderRadius: 18, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(74,222,128,.05)" : "transparent", transition: "all .25s" }}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>📸</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{lang === 'hi' ? 'फोटो यहाँ छोड़ें' : 'Drop photo here'}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 16 }}>{lang === 'hi' ? 'या ब्राउज़ करने के लिए क्लिक करें' : 'or click to browse'}</div>
                <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                  {(lang === 'hi' ? ["🌱 मिट्टी", "🌾 फसल", "🍃 पत्ता", "🚁 ड्रोन"] : ["🌱 Soil", "🌾 Crop", "🍃 Leaf", "🚁 Aerial"]).map(t => (
                    <span key={t} style={{ fontSize: 11, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)", color: "#4ade80", padding: "3px 10px", borderRadius: 999 }}>{t}</span>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              </div>
            )}

            {(phase === "scanning" || phase === "results") && previewUrl && (
              <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: 220 }}>
                <img src={previewUrl} alt="farm" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {phase === "scanning" && <ScanOverlay />}
                {phase === "results" && (
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(6,15,10,.9) 0%, transparent 50%)" }}>
                    <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                      <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>✅ Analysis Complete</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2 }}>NDVI Score: {results.ndvi} • Good Vegetation</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {phase !== "upload" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={reset} style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", borderRadius: 10, padding: "9px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>↺ New Photo</button>
                {phase === "results" && <button style={{ flex: 1, background: "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80", borderRadius: 10, padding: "9px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>⬇ Export PDF</button>}
              </div>
            )}
          </div>

          {/* Try sample */}
          {phase === "upload" && (
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{lang === 'hi' ? 'या नमूना आज़माएं' : 'Or Try Sample'}</div>
              <button onClick={useSample} style={{ width: "100%", background: "linear-gradient(135deg,rgba(74,222,128,.15),rgba(22,163,74,.15))", border: "1px solid rgba(74,222,128,.25)", color: "#4ade80", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                🌾 {lang === 'hi' ? 'नमूना खेत की फोटो का विश्लेषण करें' : 'Analyze Sample Farm Photo'}
              </button>
            </div>
          )}

          {/* Scan steps */}
          {phase === "scanning" && (
            <div style={{ padding: "16px 20px", flex: 1 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 14 }}>Processing</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SCAN_STEPS.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= scanStep ? 1 : 0.25, transition: "opacity .4s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: i < scanStep ? "#22c55e" : i === scanStep ? "rgba(74,222,128,.2)" : "rgba(255,255,255,.08)", border: `1px solid ${i <= scanStep ? "#22c55e" : "rgba(255,255,255,.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, flexShrink: 0 }}>
                      {i < scanStep ? "✓" : i === scanStep ? <span className="spin" style={{ fontSize: 10 }}>◌</span> : ""}
                    </div>
                    <span style={{ fontSize: 12, color: i <= scanStep ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.3)", fontFamily: "'DM Mono', monospace" }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <div style={{ height: 3, background: "rgba(255,255,255,.08)", borderRadius: 999, overflow: "hidden" }}>
                  <div className="bar-fill" style={{ height: "100%", width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%`, background: "linear-gradient(90deg,#22c55e,#4ade80)", borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "rgba(255,255,255,.3)" }}>
                  <span>{lang === "hi" ? "विश्लेषण हो रहा है..." : "Analyzing..."}</span>
                  <span>{Math.round(((scanStep + 1) / SCAN_STEPS.length) * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {phase === "upload" && (
            <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Recent Analyses</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {HISTORY.map((h, i) => (
                  <div key={i} className="history-row" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "12px 14px", cursor: "pointer", transition: "all .2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{h.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{h.crop}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{h.date}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: h.score > 80 ? "#4ade80" : h.score > 65 ? "#fbbf24" : "#f87171" }}>{h.score}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>score</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: h.status.includes("Alert") ? "#fbbf24" : h.status === "Excellent" ? "#4ade80" : "#f87171" }}>
                      {h.status.includes("Alert") ? "⚠️" : h.status === "Excellent" ? "✅" : "⚡"} {h.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* ── UPLOAD IDLE STATE ── */}
          {phase === "upload" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.15),transparent 70%)", border: "1px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, marginBottom: 28 }}>🔬</div>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, background: "linear-gradient(135deg,#fff,#4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{lang === "hi" ? "खेत की फोटो अपलोड करें" : "Upload a Farm Photo"}</h2>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,.4)", maxWidth: 420, lineHeight: 1.6, marginBottom: 32 }}>
                {lang === "hi" ? "हमारा AI आपकी मिट्टी का विश्लेषण करेगा, बीमारियों का पता लगाएगा, फसलों की सिफारिश करेगा, और 10 सेकंड से कम समय में पूरी लाभ रिपोर्ट तैयार करेगा।" : "Our AI will analyze your soil, detect diseases, recommend crops, and generate a complete profit report — in under 10 seconds."}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, width: "100%", maxWidth: 540 }}>
                {(lang === "hi" ? [
                  { icon: "🌱", title: "मिट्टी विश्लेषण", desc: "pH, NPK, नमी, प्रकार" },
                  { icon: "🌾", title: "फसल सलाह", desc: "आपकी भूमि के लिए सर्वश्रेष्ठ फसल" },
                  { icon: "🐛", title: "कीट और रोग", desc: "प्रारंभिक पता लगाना + उपचार" },
                  { icon: "💰", title: "लाभ अनुमान", desc: "आदर्श और निराशाजनक परिदृश्य" },
                  { icon: "🌦️", title: "मौसम मिलान", desc: "स्थानीय फसल सलाह" },
                  { icon: "⚗️", title: "उर्वरक योजना", desc: "सटीक मात्रा और समय" },
                ] : [
                  { icon: "🌱", title: "Soil Analysis", desc: "pH, NPK, moisture, type" },
                  { icon: "🌾", title: "Crop Advisory", desc: "Best crop for your land" },
                  { icon: "🐛", title: "Pest & Disease", desc: "Early detection + treatment" },
                  { icon: "💰", title: "Profit Estimate", desc: "Best & worst case forecast" },
                  { icon: "🌦️", title: "Weather Match", desc: "Hyperlocal crop advisory" },
                  { icon: "⚗️", title: "Fertilizer Plan", desc: "Exact dosage & timing" },
                ]).map((f, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "16px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SCANNING STATE ── */}
          {phase === "scanning" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
              <div style={{ position: "relative", marginBottom: 40 }}>
                <div style={{ width: 180, height: 180, borderRadius: "50%", border: "2px solid rgba(74,222,128,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 140, height: 140, borderRadius: "50%", border: "2px solid rgba(74,222,128,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.2),transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>🔬</div>
                  </div>
                </div>
                <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "2px dashed rgba(74,222,128,.3)", animation: "spin 8s linear infinite" }} className="spin" />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "#4ade80" }}>AI is analyzing your farm...</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.4)", marginBottom: 32, fontFamily: "'DM Mono', monospace" }}>{SCAN_STEPS[scanStep]}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, width: "100%", maxWidth: 480 }}>
                {["Satellite Data", "Soil Mapping", "Disease Scan", "Weather Match", "Market Prices", "Profit Model"].map((l, i) => (
                  <div key={i} style={{ background: i <= scanStep ? "rgba(74,222,128,.1)" : "rgba(255,255,255,.03)", border: `1px solid ${i <= scanStep ? "rgba(74,222,128,.3)" : "rgba(255,255,255,.07)"}`, borderRadius: 12, padding: "10px", textAlign: "center", transition: "all .4s" }}>
                    <div style={{ fontSize: 11, color: i <= scanStep ? "#4ade80" : "rgba(255,255,255,.3)", fontWeight: 600 }}>{i <= scanStep ? "✓" : "○"} {l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RESULTS STATE ── */}
          {phase === "results" && (
            <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Score banner */}
              <div className="result-card" style={{ background: "linear-gradient(135deg,rgba(74,222,128,.12),rgba(22,163,74,.08))", border: "1px solid rgba(74,222,128,.2)", borderRadius: 20, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, animationDelay: "0s" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>{lang === 'hi' ? 'विश्लेषण पूर्ण हुआ' : 'Analysis Complete'}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{lang === 'hi' ? 'आपकी कृषि रिपोर्ट तैयार है 🎉' : 'Your Farm Report is Ready 🎉'}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{lang === 'hi' ? '6 श्रेणियों का विश्लेषण किया गया • रिपोर्ट 2.6 सेकंड में तैयार हुई' : '6 categories analyzed • Report generated in 2.6 seconds'}</div>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <Ring pct={results.land_health?.health_score || results.soil?.score || 86} color="#4ade80" label="Overall" sub="Health" />
                  <Ring pct={results.crop?.confidence || 94} color="#60a5fa" label="Crop Match" sub="Confidence" />
                  <Ring pct={Math.round(((results.profit?.expected || 42000) / 65000) * 100)} color="#fbbf24" label="Profit" sub="Potential" />
                  <Ring pct={results.environment?.risk_percentage || results.profit?.risk || 24} color="#f87171" label="Risk" sub="Score" />
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,.04)", borderRadius: 14, padding: 5, border: "1px solid rgba(255,255,255,.07)" }}>
                {TABS.map(t => (
                  <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)}
                    style={{ flex: 1, padding: "10px 6px", borderRadius: 10, background: activeTab === t.id ? "linear-gradient(135deg,#166534,#15803d)" : "transparent", color: activeTab === t.id ? "white" : "rgba(255,255,255,.45)", fontSize: 12, fontWeight: activeTab === t.id ? 700 : 500, boxShadow: activeTab === t.id ? "0 4px 12px rgba(22,163,74,.3)" : "none" }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── TAB: CROP ── */}
              {activeTab === "crop" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, animationDelay: ".1s" }} className="result-card">
                  <div className="card-dark" style={{ padding: 24 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>🌾 {lang === 'hi' ? 'अनुशंसित फसल' : 'Recommended Crop'}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(74,222,128,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, border: "1px solid rgba(74,222,128,.2)" }}>{results.crop.icon}</div>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 900 }}>{results.crop.name}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 11, background: "rgba(74,222,128,.15)", color: "#4ade80", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(74,222,128,.25)" }}>{lang === 'hi' ? 'मौसम:' : 'Season:'} {results.crop.season}</span>
                          <span style={{ fontSize: 11, background: "rgba(96,165,250,.15)", color: "#93c5fd", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(96,165,250,.25)" }}>{lang === 'hi' ? 'बुवाई:' : 'Sow:'} {results.crop.sow}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,.07)", marginBottom: 16 }} />
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontWeight: 600, marginBottom: 10 }}>{lang === 'hi' ? 'AI विश्वास ब्रेकडाउन' : 'AI CONFIDENCE BREAKDOWN'}</div>
                    {(lang === 'hi' ? [
                      ["मिट्टी की उपयुक्तता", results.crop.breakdown?.soil || 90],
                      ["जलवायु मिलान", results.crop.breakdown?.climate || 90],
                      ["बाजार की मांग", results.crop.breakdown?.market || 90],
                      ["पानी की उपलब्धता", results.crop.breakdown?.water || 90]
                    ] : [
                      ["Soil Suitability", results.crop.breakdown?.soil || 90],
                      ["Climate Match", results.crop.breakdown?.climate || 90],
                      ["Market Demand", results.crop.breakdown?.market || 90],
                      ["Water Availability", results.crop.breakdown?.water || 90]
                    ]).map(([l, v], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", width: 130, flexShrink: 0 }}>{l}</span>
                        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,.08)", borderRadius: 999, overflow: "hidden" }}>
                          <div className="bar-fill" style={{ height: "100%", width: `${v}%`, background: "linear-gradient(90deg,#166534,#4ade80)", borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, width: 28, textAlign: "right" }}>{Math.round(v)}%</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="card-dark" style={{ padding: 20 }}>
                      {/* Dual-tab header: Indian vs Foreign */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "rgba(255,255,255,.04)", borderRadius: 10, padding: 3, border: "1px solid rgba(255,255,255,.07)" }}>
                        {[{id: "indian", icon: "🇮🇳", label: "Indian"}, {id: "foreign", icon: "🌍", label: "Foreign"}].map(t => (
                          <button key={t.id} onClick={() => setCropRecTab(t.id)}
                            style={{ flex: 1, padding: "7px 6px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: cropRecTab === t.id ? 700 : 500, background: cropRecTab === t.id ? (t.id === "indian" ? "linear-gradient(135deg,#166534,#15803d)" : "linear-gradient(135deg,#1e3a5f,#2563eb)") : "transparent", color: cropRecTab === t.id ? "white" : "rgba(255,255,255,.45)", boxShadow: cropRecTab === t.id ? "0 2px 8px rgba(0,0,0,.3)" : "none", transition: "all .25s" }}>
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>
                      {/* Render crop list from API data */}
                      {(() => {
                        const list = cropRecTab === "indian" ? (results.crop?.indian_options || []) : (results.crop?.foreign_options || []);
                        const accentColor = cropRecTab === "indian" ? "#fbbf24" : "#60a5fa";
                        if (list.length === 0) return (
                          <div style={{ textAlign: "center", padding: "18px 0", color: "rgba(255,255,255,.3)", fontSize: 12 }}>
                            No {cropRecTab === "indian" ? "Indian" : "Foreign"} crops matched your conditions
                          </div>
                        );
                        return list.slice(0, 5).map((a, i) => {
                          const conf = parseInt(String(a.confidence).replace("%", ""), 10) || 0;
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < list.length - 1 ? 10 : 0 }}>
                              <span style={{ fontSize: 22 }}>{a.icon || "🌱"}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                                {a.name_hi && <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{a.name_hi}</div>}
                              </div>
                              <div style={{ width: 80, height: 4, background: "rgba(255,255,255,.08)", borderRadius: 999, overflow: "hidden" }}>
                                <div className="bar-fill" style={{ height: "100%", width: `${conf}%`, background: accentColor, borderRadius: 999 }} />
                              </div>
                              <span style={{ fontSize: 12, color: accentColor, fontWeight: 700, width: 32, textAlign: "right" }}>{conf}%</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="card-dark" style={{ padding: 20, flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>📅 {lang === 'hi' ? 'फसल कैलेंडर' : 'Crop Calendar'}</div>
                      {(lang === 'hi' ? [["बुवाई", "Nov 1–15", "#4ade80"], ["सिंचाई", "Every 18 days", "#60a5fa"], ["उर्वरक", "Nov 20 (top dress)", "#fbbf24"], ["कटाई", "Mar 15–30", "#f87171"]] : [["Sowing", "Nov 1–15", "#4ade80"], ["Irrigation", "Every 18 days", "#60a5fa"], ["Fertilizer", "Nov 20 (top dress)", "#fbbf24"], ["Harvest", "Mar 15–30", "#f87171"]]).map(([l, v, c], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{l}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: SOIL ── */}
              {activeTab === "soil" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="card-dark" style={{ padding: 24 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 20 }}>🧪 {lang === 'hi' ? 'मिट्टी स्वास्थ्य रिपोर्ट' : 'Soil Health Report'}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
                      <div style={{ position: "relative", width: 100, height: 100 }}>
                        <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={9} />
                          <circle cx={50} cy={50} r={40} fill="none" stroke="#4ade80" strokeWidth={9}
                            strokeDasharray={`${(results.soil.score / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40}`} strokeLinecap="round" />
                        </svg>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>{results.soil.score}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>/ 100</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>{lang === 'hi' ? 'अच्छा 🟢' : 'Good 🟢'}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 4 }}>{results.soil.type} {lang === 'hi' ? 'मिट्टी का प्रकार' : 'soil type'}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", marginTop: 2 }}>pH: {results.soil.ph} ({lang === 'hi' ? 'अनुकूल' : 'Optimal'})</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 6 }}>{lang === 'hi' ? 'जैविक पदार्थ:' : 'Organic Matter:'} {results.soil.organic}%</div>
                      </div>
                    </div>
                    {(lang === 'hi' ? [["नाइट्रोजन (N)", results.npk.n, "#4ade80"], ["फॉस्फोरस (P)", results.npk.p, "#60a5fa"], ["पोटैशियम (K)", results.npk.k, "#fbbf24"], ["नमी", results.soil.moisture, "#818cf8"]] : [["Nitrogen (N)", results.npk.n, "#4ade80"], ["Phosphorus (P)", results.npk.p, "#60a5fa"], ["Potassium (K)", results.npk.k, "#fbbf24"], ["Moisture", results.soil.moisture, "#818cf8"]]).map(([l, v, c], i) => (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{l}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}%</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(255,255,255,.07)", borderRadius: 999, overflow: "hidden" }}>
                          <div className="bar-fill" style={{ height: "100%", width: `${v}%`, background: c, borderRadius: 999 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>🔬 {lang === 'hi' ? 'पोषक तत्वों की कमी' : 'Nutrient Deficiency'}</div>
                      {[{ n: "Phosphorus", level: "Low", fix: "Apply DAP 25kg/acre", c: "#f87171" }, { n: "Zinc", level: "Trace", fix: "ZnSO4 @ 25kg/ha", c: "#fbbf24" }, { n: "pH Balance", level: "Optimal", fix: "No action needed", c: "#4ade80" }].map((d, i) => (
                        <div key={i} style={{ background: `${d.c}0d`, border: `1px solid ${d.c}30`, borderRadius: 12, padding: "10px 14px", marginBottom: i < 2 ? 8 : 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{d.n}</span>
                            <span style={{ fontSize: 11, color: d.c, fontWeight: 700 }}>{d.level}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>💡 {d.fix}</div>
                        </div>
                      ))}
                    </div>
                    <div className="card-dark" style={{ padding: 20, flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>📡 NDVI Satellite Score</div>
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ fontSize: 52, fontWeight: 900, color: "#4ade80", lineHeight: 1 }}>{results.ndvi.toFixed(2)}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 6 }}>{results.ndvi > 0.6 ? "Good" : "Poor"} Vegetation Density</div>
                        <div style={{ height: 8, background: "linear-gradient(90deg,#f87171,#fbbf24,#4ade80)", borderRadius: 999, margin: "14px 0 6px", position: "relative" }}>
                          <div style={{ position: "absolute", top: -4, left: `${results.ndvi * 100}%`, width: 16, height: 16, borderRadius: "50%", background: "white", border: "3px solid #4ade80", transform: "translateX(-50%)" }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,.3)" }}>
                          <span>Bare soil (0)</span><span>Dense (1.0)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: DISEASE ── */}
              {activeTab === "disease" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="card-dark" style={{ padding: 24 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>🐛 {lang === 'hi' ? 'कीट और रोग स्कैन' : 'Pest & Disease Scan'}</div>
                    {[
                      { icon: "🍄", name: results.disease[0].name, risk: results.disease[0].level, conf: 78, c: results.disease[0].color, action: results.disease[0].action },
                      { icon: "🐜", name: "Aphid Infestation", risk: "Low Risk", conf: 22, c: "#4ade80", action: "Monitor weekly. Use neem oil if population increases" },
                      { icon: "🦠", name: "Leaf Blight", risk: "Not Detected", conf: 5, c: "#818cf8", action: "No action needed currently" }].map((d, i) => (
                        <div key={i} style={{ background: `${d.c}0d`, border: `1px solid ${d.c}25`, borderRadius: 16, padding: "16px", marginBottom: i < 2 ? 12 : 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 28 }}>{d.icon}</span>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{d.name}</div>
                                <span style={{ fontSize: 11, color: d.c, fontWeight: 700, background: `${d.c}20`, padding: "2px 8px", borderRadius: 999 }}>{d.risk}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: d.c }}>{d.conf}%</div>
                          </div>
                          <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 999, overflow: "hidden", marginBottom: 10 }}>
                            <div className="bar-fill" style={{ height: "100%", width: `${d.conf}%`, background: d.c, borderRadius: 999 }} />
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>💊 {d.action}</div>
                        </div>
                      ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>🌐 {lang === 'hi' ? 'सामुदायिक अलर्ट' : 'Community Alerts'}</div>
                      {[{ loc: "Nasik, MH", alert: "Powdery mildew outbreak in Grape farms", time: "3h ago", c: "#f87171" },
                      { loc: "Solapur, MH", alert: "Aphid surge in Soybean — spray advised", time: "6h ago", c: "#fbbf24" },
                      { loc: "Pune, MH", alert: "Yellow rust in wheat — confirmed cases", time: "1d ago", c: "#fbbf24" }].map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.c, flexShrink: 0, marginTop: 4 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: a.c }}>{a.loc}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.4, marginTop: 2 }}>{a.alert}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 3 }}>{a.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>🛡️ Prevention Plan</div>
                      {["Spray Propiconazole within 5 days", "Increase field inspection to twice weekly", "Apply border spray on field edges", "Alert nearby farmers via community"].map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < 3 ? 10 : 0 }}>
                          <span style={{ width: 20, height: 20, background: "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#4ade80", flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: FERTILIZER ── */}
              {activeTab === "fertilizer" && (() => {
                const plan = getFertilizerPlan(results.crop.name);
                return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="card-dark" style={{ padding: 24 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>⚗️ {lang === 'hi' ? 'उर्वरक अनुसूची' : 'Fertilizer Schedule'}</div>
                    {plan.items.map((f, i) => (
                      <div key={i} style={{ background: `${f.c}0d`, border: `1px solid ${f.c}25`, borderRadius: 16, padding: "14px 16px", marginBottom: i < plan.items.length - 1 ? 10 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 28 }}>{f.icon}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</div>
                              <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)" }}>📅 {f.timing}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: f.c }}>{f.qty}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{f.cost}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "12px 16px", marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Total Fertilizer Cost</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: "#4ade80" }}>₹{plan.total} / acre</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>📋 Application Method</div>
                      {[{ step: "01", title: "Soil Prep", desc: "Mix DAP + MOP + Zinc into soil before sowing" }, { step: "02", title: "Sowing Day", desc: "Apply Urea as basal dose at 2 cm depth" }, { step: "03", title: "Day 21", desc: "Top dress with 25kg Urea after first irrigation" }, { step: "04", title: "Day 45", desc: "Apply remaining Urea dose for tillering stage" }].map((s, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(74,222,128,.15)", border: "1px solid rgba(74,222,128,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#4ade80", fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 12 }}>⚠️ Do Not Use</div>
                      {["Avoid chloride-based fertilizers", "No urea in standing water", "Don't mix DAP + MOP directly"].map((w, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#f87171", marginBottom: i < 2 ? 8 : 0 }}>
                          <span>❌</span>{w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                );
              })()}

              {/* ── TAB: PROFIT ── */}
              {activeTab === "profit" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", borderRadius: 18, padding: "18px" }}>
                        <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>🚀 BEST CASE</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>₹{results.profit.best.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 4 }}>per acre</div>
                      </div>
                      <div style={{ background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 18, padding: "18px" }}>
                        <div style={{ fontSize: 11, color: "#f87171", fontWeight: 700, marginBottom: 8 }}>📉 WORST CASE</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#f87171" }}>₹{results.profit.worst.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 4 }}>per acre</div>
                      </div>
                    </div>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>📊 Cost vs Revenue Breakdown</div>
                      {[["Seeds", 2200, "#60a5fa"], ["Fertilizers", 2785, "#818cf8"], ["Labour", 4500, "#fbbf24"], ["Irrigation", 1800, "#f87171"], ["Pesticide", 1200, "#fb923c"]].map(([l, v, c], i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>{l}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: c }}>₹{v.toLocaleString()}</span>
                          </div>
                          <div style={{ height: 5, background: "rgba(255,255,255,.07)", borderRadius: 999, overflow: "hidden" }}>
                            <div className="bar-fill" style={{ height: "100%", width: `${(v / 4500) * 100}%`, background: c, borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Total Input Cost</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#f87171" }}>₹12,485 / acre</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>💹 Expected Returns</div>
                      {[["Expected Yield", "38 q/acre", "#4ade80"], ["Mandi Price (today)", "₹2,180/q", "#60a5fa"], ["AI Suggested Price", "₹2,340/q", "#4ade80"], ["Gross Revenue", "₹88,920", "#4ade80"], ["Net Profit (est.)", `₹${results.profit.expected.toLocaleString()}`, "#4ade80"]].map(([l, v, c], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>{l}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>⚠️ Risk Score</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 10, background: "linear-gradient(90deg,#4ade80,#fbbf24,#f87171)", borderRadius: 999, position: "relative", marginBottom: 8 }}>
                            <div style={{ position: "absolute", top: -4, left: `${results.profit.risk}%`, width: 18, height: 18, background: "white", border: "3px solid #4ade80", borderRadius: "50%", transform: "translateX(-50%)" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,.3)" }}>
                            <span>Low Risk</span><span>High Risk</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>{results.profit.risk}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>/ 100</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 12 }}>Main risk factors: Weather uncertainty (12%), Market price volatility (8%), Disease probability (4%)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: WEATHER ── */}
              {activeTab === "weather" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="card-dark" style={{ padding: 24, background: "linear-gradient(160deg,#0a2e1f,#0c3b26)", border: "1px solid rgba(74,222,128,.15)" }}>
                    <div style={{ fontSize: 11, color: "#4ade80", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>🌤️ 5-Day Weather Forecast</div>
                    {weatherDisplayData.map((w, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                        <span style={{ fontSize: 26, width: 36 }}>{w.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: i === 0 ? 700 : 500, width: 44, color: i === 0 ? "white" : "rgba(255,255,255,.6)" }}>{w.day}</span>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)", flex: 1 }}>{w.h}° / {w.l}°</span>
                        <span style={{ fontSize: 12, color: parseInt(w.rain) > 60 ? "#93c5fd" : "#86efac", width: 36 }}>💧{w.rain}</span>
                        <span style={{ fontSize: 11, color: parseInt(w.rain) > 60 ? "#f87171" : "#4ade80", background: parseInt(w.rain) > 60 ? "rgba(248,113,113,.12)" : "rgba(74,222,128,.1)", padding: "3px 8px", borderRadius: 999 }}>{w.adv}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="card-dark" style={{ padding: 20 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>🌡️ Climate Risk Assessment</div>
                      {climateRisksData.map((r, i) => (
                        <div key={i} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{r.risk}</span>
                            <span style={{ fontSize: 11, color: r.c, fontWeight: 700 }}>{r.level}</span>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,.07)", borderRadius: 999, overflow: "hidden" }}>
                            <div className="bar-fill" style={{ height: "100%", width: `${r.pct}%`, background: r.c, borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="card-dark" style={{ padding: 20, flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>📋 Weather Advisory</div>
                      {[{ icon: "✅", text: "Ideal sowing window: Today–Tuesday", c: "#4ade80" }, { icon: "⛔", text: "Avoid fertilizer Wed–Thu (heavy rain)", c: "#f87171" }, { icon: "⚠️", text: "Monitor for rust after rain clears", c: "#fbbf24" }, { icon: "✅", text: "Resume field operations from Saturday", c: "#4ade80" }].map((a, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                          <span style={{ color: a.c }}>{a.icon}</span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.5 }}>{a.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB: INSIGHTS (DEEP ANALYSIS) ── */}
              {activeTab === "insights" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Row 1: Risks & Nutrients */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Climate Risk Radar */}
                    <div className="card-dark" style={{ padding: 24 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>🌪️ Climate Risk Radar</div>
                      {insightsRadarData.map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                          <div style={{ position: "relative", width: 48, height: 48 }}>
                            <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
                              <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={4} />
                              <circle cx={24} cy={24} r={20} fill="none" stroke={r.color} strokeWidth={4}
                                strokeDasharray={`${(r.probability_score / 100) * 2 * Math.PI * 20} ${2 * Math.PI * 20}`} strokeLinecap="round" />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: r.color }}>{r.probability_score}%</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 700 }}>{r.name}</span>
                              <span style={{ fontSize: 11, color: r.color, background: `${r.color}15`, padding: "2px 6px", borderRadius: 4 }}>{r.severity}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Impact: {r.time_to_impact}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI Daily Farm Manager */}
                    <div className="card-dark" style={{ padding: 24, background: "linear-gradient(135deg, rgba(74,222,128,0.05), rgba(6,15,10,0.5))" }}>
                      <div style={{ fontSize: 11, color: "#4ade80", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>🤖 AI Daily Farm Manager</div>
                      {results.intelligence?.daily_manager ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Current Stage</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{results.intelligence.daily_manager.current_stage.stage_name} <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>(Day {results.intelligence.daily_manager.current_stage.day_of_cycle})</span></div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Status</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: results.intelligence.daily_manager.action_plan.priority === "Critical" ? "#f87171" : "#4ade80", background: results.intelligence.daily_manager.action_plan.priority === "Critical" ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)", padding: "4px 10px", borderRadius: 8 }}>{results.intelligence.daily_manager.action_plan.priority}</div>
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Today's Action Plan</div>
                            <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>{results.intelligence.daily_manager.action_plan.report}</div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                             <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 10 }}>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Financial Risk</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>{results.intelligence.daily_manager.financial_warning}</div>
                             </div>
                             {results.intelligence.daily_manager.immediate_risks.length > 0 && (
                                <div style={{ background: "rgba(248,113,113,0.05)", padding: 12, borderRadius: 10, border: "1px solid rgba(248,113,113,0.2)" }}>
                                    <div style={{ fontSize: 11, color: "#f87171", marginBottom: 4 }}>Immediate Risks</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>{results.intelligence.daily_manager.immediate_risks[0].risk}</div>
                                </div>
                             )}
                          </div>
                        </>
                      ) : (
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Daily Manager data not yet synced for this farm.</div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Govt Schemes */}
                  <div className="card-dark" style={{ padding: 24 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 16 }}>🏛️ Government Schemes & Subsidies Match</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {results.deep_insights?.scheme_matches?.map((s, i) => {
                        const schemeUrlMap = {
                          "PM-KISAN": "https://pmkisan.gov.in",
                          "Soil Health Card": "https://soilhealth.dac.gov.in",
                          "KCC Kisan Credit Card": "https://www.nabard.org/content.aspx?id=572",
                          "e-NAM": "https://www.enam.gov.in",
                          "PMKSY": "https://pmksy.gov.in",
                          "PM Fasal Bima": "https://pmfby.gov.in",
                        };
                        const url = s.url || schemeUrlMap[s.scheme_name] || "#";
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none", display: "block" }}
                          >
                            <div
                              style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer", transition: "all 0.2s", height: "100%" }}
                              onMouseOver={e => { e.currentTarget.style.background = "rgba(74,222,128,0.06)"; e.currentTarget.style.border = "1px solid rgba(74,222,128,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,.03)"; e.currentTarget.style.border = "1px solid rgba(255,255,255,.06)"; e.currentTarget.style.transform = "none"; }}
                            >
                              <div style={{ display: "flex", gap: 16 }}>
                                <div style={{ width: 40, height: 40, background: `${s.eligibility_color}15`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: s.eligibility_color, fontSize: 16, fontWeight: 800, flexShrink: 0, border: `1px solid ${s.eligibility_color}30` }}>
                                  {s.match_score}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{s.scheme_name}</div>
                                    <div style={{ fontSize: 10, color: s.eligibility_color, background: `${s.eligibility_color}15`, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{s.eligibility}</div>
                                  </div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>{s.full_name}</div>
                                  <div style={{ fontSize: 12, color: "#4ade80", marginBottom: 6 }}>{s.benefit}</div>
                                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 6 }}>📝 {s.how_to_apply}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textAlign: "right", borderTop: "1px solid rgba(74,222,128,0.12)", paddingTop: 8 }}>↗ Visit Official Site</div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
