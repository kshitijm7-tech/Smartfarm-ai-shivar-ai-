import { useState, useEffect, useRef } from "react";
import { useLang } from "./App";
import { TRANSLATIONS } from "./translations";

// Comprehensive crop name → image map using Pexels (no API key, CORS-friendly)
const CROP_IMAGE_MAP = {
  wheat: "https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=640",
  rice: "https://images.pexels.com/photos/1537169/pexels-photo-1537169.jpeg?auto=compress&cs=tinysrgb&w=640",
  tomato: "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=640",
  onion: "https://images.pexels.com/photos/4197444/pexels-photo-4197444.jpeg?auto=compress&cs=tinysrgb&w=640",
  sugarcane: "https://images.pexels.com/photos/9028789/pexels-photo-9028789.jpeg?auto=compress&cs=tinysrgb&w=640",
  cotton: "https://images.pexels.com/photos/4046054/pexels-photo-4046054.jpeg?auto=compress&cs=tinysrgb&w=640",
  soybean: "https://images.pexels.com/photos/5029610/pexels-photo-5029610.jpeg?auto=compress&cs=tinysrgb&w=640",
  mustard: "https://images.pexels.com/photos/14656115/pexels-photo-14656115.jpeg?auto=compress&cs=tinysrgb&w=640",
  maize: "https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=640",
  chilli: "https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=640",
  potato: "https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=640",
  grapes: "https://images.pexels.com/photos/760281/pexels-photo-760281.jpeg?auto=compress&cs=tinysrgb&w=640",
  // Hindi names
  "गेहूं": "https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=640",
  "टमाटर": "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=640",
  "गन्ना": "https://images.pexels.com/photos/9028789/pexels-photo-9028789.jpeg?auto=compress&cs=tinysrgb&w=640",
};
// Generic fallback — green farm field from Pexels
const FALLBACK_CROP_IMG = "https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?auto=compress&cs=tinysrgb&w=640";

async function searchCropImage(cropName) {
  if (!cropName) return FALLBACK_CROP_IMG;
  const key = cropName.trim().toLowerCase();
  // 1. Exact lowercase match
  const direct = CROP_IMAGE_MAP[key];
  if (direct) return direct;
  // 2. Check Hindi/exact-case keys
  const exactMatch = CROP_IMAGE_MAP[cropName.trim()];
  if (exactMatch) return exactMatch;
  // 3. Partial match
  const partial = Object.entries(CROP_IMAGE_MAP).find(([k]) => key.includes(k) || k.includes(key));
  if (partial) return partial[1];

  // 4. Live search on Wikipedia (CORS-friendly, no API key needed)
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cropName.trim())}&prop=pageimages&format=json&pithumbsize=400&origin=*`);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      if (pageId && pageId !== "-1" && pages[pageId].thumbnail) {
        return pages[pageId].thumbnail.source;
      }
    }
  } catch (e) {
    console.warn("Wikipedia image search failed for:", cropName, e);
  }

  // 5. Hard fallback
  return FALLBACK_CROP_IMG;
}

function searchCropImageSync(cropName) {
  if (!cropName) return FALLBACK_CROP_IMG;
  const key = cropName.trim().toLowerCase();
  if (CROP_IMAGE_MAP[key]) return CROP_IMAGE_MAP[key];
  if (CROP_IMAGE_MAP[cropName.trim()]) return CROP_IMAGE_MAP[cropName.trim()];
  const partial = Object.entries(CROP_IMAGE_MAP).find(([k]) => key.includes(k) || k.includes(key));
  if (partial) return partial[1];
  return FALLBACK_CROP_IMG;
}


const HEALTH_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#6366f1", "#3b82f6", "#8b5cf6"];



function RingChart({ value, color, size = 80, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
    </svg>
  );
}

export default function SmartFarmDashboard() {
  const { lang } = useLang();
  const s = TRANSLATIONS[lang];

  const [crops, setCrops] = useState([]);
  const [dashboardUser, setDashboardUser] = useState({ name: "Ramesh Patil", farmSize: "5.0", primaryCrop: "" });

  useEffect(() => {
    // Clear stale crop cache that may have broken Wikipedia/Unsplash URLs
    try {
      const cachedCrops = localStorage.getItem("smartfarm_crops");
      if (cachedCrops) {
        const parsed = JSON.parse(cachedCrops);
        const hasStaleUrl = parsed.some(c =>
          c.img && (c.img.includes("wikipedia") || c.img.includes("unsplash") || c.img.includes("wikimedia"))
        );
        if (hasStaleUrl) {
          localStorage.removeItem("smartfarm_crops");
        }
      }
    } catch (e) { }

    const stored = localStorage.getItem("smartfarm_user");
    console.log("smartfarm_user from localStorage:", stored);

    let parsedUser = { name: "Ramesh Patil", farmSize: "5.0", primaryCrop: "" };
    if (stored) {
      try {
        parsedUser = JSON.parse(stored);
        if (parsedUser.name) setDashboardUser(parsedUser);
      } catch (e) { console.error(e); }
    }

    const cropImages = {
      "Wheat": "https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Rice": "https://images.pexels.com/photos/1537169/pexels-photo-1537169.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Tomato": "https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Onion": "https://images.pexels.com/photos/4197444/pexels-photo-4197444.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Sugarcane": "https://images.pexels.com/photos/9028789/pexels-photo-9028789.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Cotton": "https://images.pexels.com/photos/4046054/pexels-photo-4046054.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Soybean": "https://images.pexels.com/photos/5029610/pexels-photo-5029610.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Mustard": "https://images.pexels.com/photos/14656115/pexels-photo-14656115.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Maize": "https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Chilli": "https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Potato": "https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=640",
      "Grapes": "https://images.pexels.com/photos/760281/pexels-photo-760281.jpeg?auto=compress&cs=tinysrgb&w=640"
    };

    const savedCropsStr = localStorage.getItem("smartfarm_crops");
    let savedCrops = [];
    if (savedCropsStr) {
      try {
        const parsedCropsArray = JSON.parse(savedCropsStr);
        if (parsedCropsArray && Array.isArray(parsedCropsArray) && parsedCropsArray.length > 0) {
          // Aggressively invalidate the old cache if they match the initial default list
          const isOldCache = parsedCropsArray.length === 2 &&
            parsedCropsArray[0] && parsedCropsArray[0].name && parsedCropsArray[0].name.toLowerCase().includes("wheat") &&
            parsedCropsArray[1] && parsedCropsArray[1].name && parsedCropsArray[1].name.toLowerCase().includes("tomato");
          if (!isOldCache) {
            savedCrops = parsedCropsArray.filter(c => c !== null && c !== undefined);
          }
        }
      } catch (e) { }
    }

    if (savedCrops.length === 0 && parsedUser.primaryCrop) {
      const imgUrl = cropImages[parsedUser.primaryCrop] || searchCropImageSync(parsedUser.primaryCrop);
      const initialCrop = {
        name: parsedUser.primaryCrop,
        area: `${parsedUser.farmSize || 5.0} ${s.acres || 'Acres'}`,
        stage: lang === "hi" ? "बुवाई" : "Sowing",
        health: 90,
        risk: "Low",
        profit: "—",
        img: imgUrl,
        color: "#10b981",
        days: 90
      };
      setCrops([initialCrop]);
    } else if (savedCrops.length > 0) {
      setCrops(savedCrops);
    }
  }, []); // Run ONLY once on mount

  useEffect(() => {
    if (crops.length > 0) {
      localStorage.setItem("smartfarm_crops", JSON.stringify(crops));
    }
  }, [crops]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState(null); // null=picker, 'ai'=recommender, 'manual'=direct
  const [modalStep, setModalStep] = useState(1); // AI flow: 1=form, 2=result, 3=success
  const [formData, setFormData] = useState({ N: "", P: "", K: "", ph: "", temperature: "", humidity: "", rainfall: "", area_acres: "" });
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [recError, setRecError] = useState("");

  // Soil Modal States
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [soilModalView, setSoilModalView] = useState("form"); // "form" | "results"
  const [soilForm, setSoilForm] = useState({
    type: "Loamy", location: "", size: "",
    n: "Medium", p: "Medium", k: "Medium",
    ph: 6.5, moisture: 50, organic: "1-2%",
    lastFert: "", currentCrop: "", problems: ""
  });
  const [soilResults, setSoilResults] = useState({ score: 0, statusLabel: "", statusColor: "", recs: [], cropsRank: [], ferts: [], phMsg: "" });

  const handleAnalyzeSoilSubmit = () => {
    let score = 85;
    if (soilForm.n === "Very Low" || soilForm.n === "Very High") score -= 15;
    if (soilForm.p === "Very Low" || soilForm.p === "Very High") score -= 10;
    if (soilForm.k === "Very Low" || soilForm.k === "Very High") score -= 10;
    if (soilForm.ph < 5.5 || soilForm.ph > 8.0) score -= 15;
    if (soilForm.moisture < 20 || soilForm.moisture > 80) score -= 10;
    if (soilForm.organic === "Less than 1%") score -= 5;
    score = Math.max(10, Math.min(100, score));

    let statusLabel = "Poor", statusColor = "#dc2626";
    if (score > 40 && score <= 70) { statusLabel = "Fair"; statusColor = "#f59e0b"; }
    else if (score > 70 && score <= 90) { statusLabel = "Good"; statusColor = "#16a34a"; }
    else if (score > 90) { statusLabel = "Excellent"; statusColor = "#14532d"; }

    let recs = [];
    if (soilForm.n === "Low" || soilForm.n === "Very Low") recs.push("Apply Nitrogen-rich fertilizers (e.g. Urea) to boost vegetative growth.");
    if (soilForm.ph < 6.0) recs.push("Soil is highly acidic. Apply agricultural lime to raise pH closer to neutral 6.5 for optimal nutrient absorption.");
    if (soilForm.ph > 7.5) recs.push("Soil is alkaline. Consider adding elemental sulfur to gently lower pH.");
    if (soilForm.moisture < 30) recs.push("Critically low moisture. Increase irrigation frequency significantly to prevent crops wilting.");
    if (recs.length === 0) recs.push("Maintain your current balanced nutrient schedule.", "Continue regular moisture monitoring.", "Rotate crops next season to preserve NPK ratios.");
    else {
      if (recs.length === 1) recs.push("Monitor lower leaves for early signs of pest vectors.", "Consider rotating crops next season.");
      if (recs.length === 2) recs.push("Incorporate organic compost to enhance general microbe health and soil structure.");
    }

    const cropsRank = [];
    if (soilForm.type === "Black (Regur)") cropsRank.push("Cotton", "Soybean");
    else if (soilForm.type === "Sandy") cropsRank.push("Groundnut", "Potato");
    else if (soilForm.type === "Clay") cropsRank.push("Rice", "Wheat");
    else cropsRank.push("Tomato", "Maize");

    const ferts = [];
    if (soilForm.n === "Very Low" || soilForm.n === "Low") ferts.push("Urea (46-0-0) — 50kg/acre");
    if (soilForm.p === "Very Low" || soilForm.p === "Low") ferts.push("DAP (18-46-0) — 30kg/acre");
    if (soilForm.k === "Very Low" || soilForm.k === "Low") ferts.push("MOP (0-0-60) — 20kg/acre");
    if (soilForm.organic === "Less than 1%") ferts.push("Farm Yard Manure (FYM) — 2 Tons/acre");
    if (ferts.length === 0) ferts.push("Standard NPK 19:19:19 — 25kg/acre for maintenance");

    let phMsg = "Optimal neutral pH for most crops.";
    if (soilForm.ph < 6.0) phMsg = "Acidic soil. Nutrients may be locked out.";
    if (soilForm.ph > 7.5) phMsg = "Alkaline soil. Micronutrient deficiency possible.";

    setSoilResults({ score, statusLabel, statusColor, recs, cropsRank, ferts, phMsg });
    setSoilModalView("results");
  };

  // Manual form
  const [manualForm, setManualForm] = useState({ name: "", area: "", stage: "Sowing", health: 80 });
  const [manualError, setManualError] = useState("");

  const [alerts, setAlerts] = useState([]);

  const [uiWeather, setUiWeather] = useState([
    { day: lang === "hi" ? "आज" : "Today", icon: "☀️", high: 32, low: 24, rain: "0%" },
    { day: lang === "hi" ? "बुध" : "Wed", icon: "🌤️", high: 30, low: 22, rain: "0%" },
    { day: lang === "hi" ? "गुरु" : "Thu", icon: "☀️", high: 31, low: 23, rain: "0%" },
    { day: lang === "hi" ? "शुक्र" : "Fri", icon: "⛅", high: 29, low: 21, rain: "0%" },
    { day: lang === "hi" ? "शनि" : "Sat", icon: "☀️", high: 32, low: 22, rain: "0%" },
  ]);

  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState(lang === "hi" ? "पुणे, MH" : "Pune, MH");
  const [weatherAdvisory, setWeatherAdvisory] = useState(null);

  // STEP 3 - FETCH CITY NAME:
  const fetchCityName = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || "Your Location";
      const state = data.principalSubdivision || "";
      setLocationName(city + ", " + state);
    } catch (error) {
      console.log("City fetch failed, using default");
      setLocationName(lang === "hi" ? "पुणे, MH" : "Pune, MH");
    }
  };

  // STEP 4 - FETCH LIVE WEATHER:
  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=5`);
      const data = await res.json();
      setWeatherData(data.daily);
    } catch (e) {
      console.log("Weather fetch failed", e);
    }
  };

  // STEP 2 - LOCATION DETECTION:
  useEffect(() => {
    let mounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted) return;
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeather(lat, lon);
          fetchCityName(lat, lon);
        },
        (error) => {
          if (!mounted) return;
          console.log("Location denied, using default");
          // STEP 7 - FALLBACK:
          fetchWeather(18.5204, 73.8567);
        }
      );
    } else {
      fetchWeather(18.5204, 73.8567);
    }
    return () => { mounted = false; };
  }, []);

  // STEP 5 & 6 - DISPLAY WEATHER & FARMER ADVISORY:
  useEffect(() => {

    let currentTempMax = 30; // Fallback temperature if API fails

    if (weatherData && weatherData.time) {
      const days = [lang === 'hi' ? "रवि" : "Sun", lang === 'hi' ? "सोम" : "Mon", lang === 'hi' ? "मंगल" : "Tue", lang === 'hi' ? "बुध" : "Wed", lang === 'hi' ? "गुरु" : "Thu", lang === 'hi' ? "शुक्र" : "Fri", lang === 'hi' ? "शनि" : "Sat"];
      const newWeather = [];

      for (let i = 0; i < Math.min(5, weatherData.time.length); i++) {
        const d = new Date(weatherData.time[i]);
        const dayStr = i === 0 ? (lang === 'hi' ? "आज" : "Today") : days[d.getDay()];
        const rainSum = weatherData.precipitation_sum ? weatherData.precipitation_sum[i] : 0;
        let wcode = weatherData.weathercode ? weatherData.weathercode[i] : 0;

        let icon = "☀️";
        if (wcode === 0) icon = "☀️";
        else if (wcode >= 1 && wcode <= 3) icon = "⛅";
        else if (wcode >= 45 && wcode <= 48) icon = "🌫️";
        else if (wcode >= 51 && wcode <= 67) icon = "🌧️";
        else if (wcode >= 80 && wcode <= 82) icon = "🌦️";
        else if (wcode >= 95 && wcode <= 99) icon = "⛈️";
        else if (wcode >= 71 && wcode <= 77) icon = "❄️";

        newWeather.push({
          day: dayStr,
          icon: icon,
          high: Math.round(weatherData.temperature_2m_max[i]),
          low: Math.round(weatherData.temperature_2m_min[i]),
          rain: rainSum > 0 ? `${Math.round(rainSum)}mm` : "0%"
        });
      }
      setUiWeather(newWeather);

      const firstDayRain = weatherData.precipitation_sum ? (weatherData.precipitation_sum[0] || 0) : 0;
      currentTempMax = weatherData.temperature_2m_max ? weatherData.temperature_2m_max[0] : 30;

      let currentAdvisory = null;
      if (firstDayRain > 10) {
        currentAdvisory = {
          icon: "🌧️",
          msg: lang === "hi" ? "भारी बारिश की संभावना। आज उर्वरक और कीटनाशक का छिड़काव न करें।" : "Heavy rain expected. Avoid fertilizer and pesticide spray today.",
          bg: "rgba(59,130,246,.25)", border: "rgba(59,130,246,.35)", color: "#93c5fd"
        };
      } else if (currentTempMax > 38) {
        currentAdvisory = {
          icon: "🌡️",
          msg: lang === "hi" ? "हीट स्ट्रेस अलर्ट। सुबह-शाम फसलों को पानी दें।" : "Heat stress alert. Water your crops early morning and evening.",
          bg: "rgba(239,68,68,.25)", border: "rgba(239,68,68,.35)", color: "#fca5a5"
        };
      } else {
        currentAdvisory = {
          icon: "☀️",
          msg: lang === "hi" ? "मौसम साफ है। उर्वरकों और कीटनाशकों के छिड़काव का सही समय।" : "Clear weather conditions. Good time for spraying fertilizers and pesticides.",
          bg: "rgba(16,185,129,.25)", border: "rgba(16,185,129,.35)", color: "#6ee7b7"
        };
      }
      setWeatherAdvisory(currentAdvisory);
    }

    const newAlerts = [];

    // Analyze actual user crops and cross-reference with weather for dynamic alerts
    crops.forEach((crop) => {
      if (!crop) return; // Prevent crashes from corrupted localStorage data

      // 1. Health based alerts
      if (crop.health !== undefined && crop.health < 75) {
        newAlerts.push({
          icon: "🩺",
          msg: lang === "hi"
            ? `${crop.name} की सेहत गिर रही है (${crop.health}%)। कृपया ध्यान दें।`
            : `${crop.name} health is dropping (${crop.health}%). Immediate attention required.`,
          time: "Just now", color: "#ef4444", bg: "#fef2f2"
        });
      }

      // 2. Risk based alerts
      if (crop.risk === "High" || crop.risk === "उच्च") {
        newAlerts.push({
          icon: "⚠️",
          msg: lang === "hi"
            ? `${crop.name} (${crop.area}) में उच्च जोखिम है। बीमारी की जांच करें।`
            : `High risk detected in ${crop.name} (${crop.area}). Please scan for diseases.`,
          time: "Just now", color: "#f59e0b", bg: "#fffbeb"
        });
      }

      // 3. Stage-specific technical alerts
      if (crop.stage === "Sowing" || crop.stage === "बुवाई") {
        newAlerts.push({
          icon: "🌱",
          msg: lang === "hi"
            ? `${crop.name} का बुवाई चरण सक्रिय है! बीजों के अंकुरण के लिए मिट्टी में नमी (60% लक्ष्य) बनाए रखें।`
            : `${crop.name} sowing window is active! Ensure soil moisture is consistently at 60% for ideal germination.`,
          time: "1 hour ago", color: "#10b981", bg: "#f0fdf4"
        });
      } else if (crop.stage === "Flowering" || crop.stage === "फूल आना") {
        newAlerts.push({
          icon: "🌸",
          msg: lang === 'hi'
            ? `${crop.name} अभी फूल आने के चरण में है! इस दौरान अधिक पोटैशियम (Potassium) दें और पानी का तनाव न होने दें।`
            : `${crop.name} is in the critical Flowering stage! Avoid water stress at all costs and apply a Potassium boost.`,
          time: "1 hour ago", color: "#8b5cf6", bg: "#f3e8ff"
        });
      } else if (crop.stage === "Harvesting" || crop.stage === "कटाई") {
        newAlerts.push({
          icon: "🌾",
          msg: lang === 'hi'
            ? `${crop.name} कटाई के लिए तैयार है! आगामी मौसम के आधार पर कटाई की योजना बनाएं।`
            : `${crop.name} is ready for harvesting! Plan your harvest schedule based on the upcoming weather.`,
          time: "2 hours ago", color: "#eab308", bg: "#fef9c3"
        });
      }

      // 4. Weather + Crop health interaction
      if (currentTempMax > 38 && crop.health < 85) {
        newAlerts.push({
          icon: "🔥",
          msg: lang === "hi"
            ? `अत्यधिक गर्मी के कारण ${crop.name} को हीट स्ट्रेस का खतरा है।`
            : `Severe heat wave threatens ${crop.name} due to its current health.`,
          time: "Just now", color: "#ef4444", bg: "#fef2f2"
        });
      }
    });

    // 5. Fallback scenarios
    if (newAlerts.length === 0 && crops.length > 0) {
      newAlerts.push({
        icon: "✅",
        msg: lang === "hi" ? "आपके सभी खेत स्वस्थ हैं और कोई सक्रिय समस्या नहीं है।" : "All your fields are healthy and there are no active issues.",
        time: "Just now", color: "#10b981", bg: "#f0fdf4"
      });
    } else if (crops.length === 0) {
      newAlerts.push({
        icon: "🌾",
        msg: lang === "hi" ? "अलर्ट सक्षम करने के लिए अपनी पहली फसल जोड़ें।" : "Add your first crop to enable crop-specific alerts.",
        time: "Just now", color: "#3b82f6", bg: "#eff6ff"
      });
    }

    setAlerts(newAlerts);
  }, [weatherData, crops, lang]);

  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiSearch, setMandiSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    async function fetchMandiPrices() {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/mandi/prices?search=${mandiSearch}`);
        const data = await res.json();
        if (mounted) setMandiPrices(data);
      } catch (e) {
        console.warn("Mandi prices fetch failed", e);
      }
    }
    fetchMandiPrices();
    return () => { mounted = false; };
  }, [mandiSearch]);

  const SCHEMES = [
    { name: "PM-KISAN", amount: `₹6,000 / ${lang === "hi" ? "वर्ष" : "year"}`, status: lang === "hi" ? "पात्र ✅" : "Eligible ✅", icon: "🏛️", color: "#dcfce7", textColor: "#166534", url: "https://pmkisan.gov.in" },
    { name: "Kisan Credit Card", amount: "Up to ₹3 Lakh", status: lang === "hi" ? "अभी आवेदन करें →" : "Apply Now →", icon: "💳", color: "#dbeafe", textColor: "#1e40af", url: "https://www.nabard.org/content.aspx?id=572" },
    { name: "Fasal Bima Yojana", amount: lang === "hi" ? "फसल बीमा" : "Crop Insurance", status: lang === "hi" ? "जल्द ही नवीनीकृत करें ⚠️" : "Renew Soon ⚠️", icon: "🛡️", color: "#fef3c7", textColor: "#92400e", url: "https://pmfby.gov.in" },
  ];

  const [greeting, setGreeting] = useState(s.good_morning);
  const [time, setTime] = useState(new Date());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", text: s.ai_welcome }
  ]);
  const chatRef = useRef(null);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting(s.good_morning);
    else if (h < 17) setGreeting(s.good_afternoon);
    else setGreeting(s.good_evening);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, [s]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory]);

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    const userMsg = chatMsg;
    setChatMsg("");
    setChatHistory(h => [...h, { role: "user", text: userMsg }]);
    setTimeout(() => {
      const responses = [
        "Aapki fasal ke liye NPK ratio 4:2:1 recommend karta hoon. Urea 50kg/acre use karein! 🌱",
        "Agle 3 din baarish aane wali hai — fertilizer delay karein. 🌧️",
        "Tomato mein aphid ka attack dikh raha hai. Neem oil spray karein! 🐛",
        "Wheat ka mandi price is hafte ₹2,180/quintal hai. Abhi na bechein! 📈",
      ];
      setChatHistory(h => [...h, { role: "ai", text: responses[Math.floor(Math.random() * responses.length)] }]);
    }, 900);
  };

  const [soilData, setSoilData] = useState({
    score: 86,
    n: 68,
    p: 45,
    k: 82,
    moisture: 54,
    type: "Loamy soil",
    ph: 6.8,
    status: s.soil_good || "Good"
  });
  const [isAnalyzingSoil, setIsAnalyzingSoil] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(lang === 'hi' ? 'आज' : 'Today');

  const handleAnalyzeSoil = async () => {
    setIsAnalyzingSoil(true);
    // Simulate satellite connection delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      // In a real app, we'd get actual GPS. Here we use a default or simulated one.
      const res = await fetch("http://127.0.0.1:5000/api/analyze_soil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: 18.5204, lon: 73.8567 })
      });
      const data = await res.json();
      if (data.status === "success") {
        setSoilData({
          score: data.score,
          n: data.n,
          p: data.p,
          k: data.k,
          moisture: data.moisture,
          type: data.soil_type,
          ph: data.ph,
          status: data.status_label
        });
        setLastAnalyzed(lang === 'hi' ? 'अभी-अभी' : 'Just now');
      }
    } catch (e) {
      console.error("Soil analysis failed", e);
    } finally {
      setIsAnalyzingSoil(false);
    }
  };

  const SOIL_STATS = [
    { label: "Nitrogen (N)", val: soilData.n, color: "#10b981" },
    { label: "Phosphorus (P)", val: soilData.p, color: "#3b82f6" },
    { label: "Potassium (K)", val: soilData.k, color: "#f59e0b" },
    { label: "Moisture", val: soilData.moisture, color: "#6366f1" },
  ];

  // Retrieve user data directly from Dashboard state
  const firstName = dashboardUser.name ? dashboardUser.name.split(" ")[0] : "Ramesh";

  return (
    <div style={{ background: "#f8fdf9", fontFamily: "'Poppins', sans-serif", minHeight: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 2px 16px rgba(0,0,0,.06); border: 1px solid #e9f5ed; }
        .card-hover { transition: all .22s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(22,163,74,.13); }
        .btn-green { background: linear-gradient(135deg,#22c55e,#15803d); color: white; border: none; border-radius: 12px; padding: 10px 20px; font-family: 'Poppins',sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: all .2s; }
        .btn-green:hover { transform: scale(1.04); box-shadow: 0 4px 16px rgba(34,197,94,.4); }
        .tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        .chat-bubble-ai { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px 16px 16px 4px; padding: 10px 14px; font-size: 13px; color: #166534; max-width: 85%; line-height: 1.5; }
        .chat-bubble-user { background: linear-gradient(135deg,#22c55e,#15803d); border-radius: 16px 16px 4px 16px; padding: 10px 14px; font-size: 13px; color: white; max-width: 85%; align-self: flex-end; line-height: 1.5; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 10px; }
      `}</style>

      {/* ── HERO WELCOME BANNER ─────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "0 0 28px 28px", background: "#f0fdf4", minHeight: 170 }}>
        <img src="/farm_banner.png" alt="Farm" style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }} />
        {/* overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 60%,transparent 100%)" }} />
        {/* text */}
        <div style={{ position: "absolute", top: "50%", left: 28, transform: "translateY(-50%)" }}>
          <div style={{ color: "white", fontSize: 24, fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,.4)", lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: "#86efac" }}>{firstName} Bhai! 🌾</span>
          </div>
          <div style={{ color: "rgba(255,255,255,.85)", fontSize: 13, marginTop: 5, fontWeight: 500 }}>
            📅 {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} &nbsp;•&nbsp; ⏰ {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        {/* farmer avatar */}
        <div style={{ position: "absolute", bottom: 10, right: 36, height: 140, width: 140, borderRadius: "50%", overflow: "hidden", border: "4px solid white", boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}>
          <img src="/farmer_avatar.png" alt="Farmer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>

      {/* ── CONTENT AREA ────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* KPI CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14 }}>
          {[
            { icon: "🌾", label: s.total_area, value: `${dashboardUser.farmSize} ${s.acres}`, sub: lang === "hi" ? "3 सक्रिय क्षेत्र" : "3 active fields", iconBg: "#f0fdf4", iconBorder: "#bbf7d0", valColor: "#15803d" },
            { icon: "💰", label: s.expected_profit, value: "₹1,24,400", sub: lang === "hi" ? "↑ पिछले सीजन से 18%" : "↑ 18% from last season", iconBg: "#f0fdf4", iconBorder: "#bbf7d0", valColor: "#15803d" },
            { icon: "⚠️", label: s.active_alerts, value: lang === "hi" ? `${alerts.length} सक्रिय` : `${alerts.length} Active`, sub: lang === "hi" ? `${alerts.length} पर ध्यान दें` : `${alerts.length} need your attention`, iconBg: "#fffbeb", iconBorder: "#fde68a", valColor: "#d97706" },
            { icon: "🧪", label: s.soil_health_score, value: "86 / 100", sub: s.soil_loamy, iconBg: "#eff6ff", iconBorder: "#bfdbfe", valColor: "#2563eb" },
            { icon: "📈", label: lang === "hi" ? "सर्वश्रेष्ठ फसल" : "Best Crop to Sow", value: "Soybean", sub: lang === "hi" ? "AI अनुमान: ₹4,620/Q" : "AI forecast: ₹4,620/Q", iconBg: "#fdf4ff", iconBorder: "#e9d5ff", valColor: "#7c3aed", onClick: () => window.setActiveScreen && window.setActiveScreen("harvest") },
          ].map((k, i) => (
            <div key={i} className="card card-hover" onClick={k.onClick} style={{ background: k.iconBg, borderColor: k.iconBorder, padding: "16px 18px", textAlign: "center", cursor: k.onClick ? "pointer" : "default" }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.valColor }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{k.sub}</div>
              {k.onClick && <div style={{ fontSize: 10, marginTop: 4, color: "#7c3aed", fontWeight: 700 }}>Tap to predict →</div>}
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { icon: "📈", label: lang === "hi" ? "फसल मूल्य अनुमान" : "Harvest Predictor", color: "#7c3aed", bg: "#fdf4ff", key: "harvest" },
            { icon: "💰", label: lang === "hi" ? "लाभ सिम" : "Profit Simulator", color: "#15803d", bg: "#f0fdf4", key: "profit" },
            { icon: "🔬", label: lang === "hi" ? "एआई विश्लेषक" : "AI Analyzer", color: "#1d4ed8", bg: "#eff6ff", key: "analyzer" },
            { icon: "🛒", label: lang === "hi" ? "बाज़ार" : "Marketplace", color: "#b45309", bg: "#fef3c7", key: "market" },
          ].map(qk => (
            <button key={qk.key} onClick={() => window.setActiveScreen && window.setActiveScreen(qk.key)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, border: `1px solid ${qk.bg}`, background: qk.bg, color: qk.color, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Poppins',sans-serif", transition: "all .2s" }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: 18 }}>{qk.icon}</span> {qk.label}
            </button>
          ))}
        </div>

        {/* MY CROPS */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#111827" }}>🌱 {s.my_crops}</div>
              <div style={{ color: "#9ca3af", fontSize: 12 }}>{s.live_updates}</div>
            </div>
            <button className="btn-green" onClick={() => { setShowAddModal(true); setModalMode(null); setModalStep(1); setRecommendation(null); setRecError(""); setManualForm({ name: "", area: "", stage: "Sowing", health: 80 }); setManualError(""); }}>{s.add_crop}</button>
          </div>
          {crops.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#f9fafb", borderRadius: 16, border: "2px dashed #e5e7eb" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
              <div style={{ color: "#374151", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No crops added yet.</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>Click + Add Crop to get started.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(crops.length, 3)},1fr)`, gap: 14 }}>
              {crops.map((c, i) => (
                <div key={i} className="card-hover" style={{
                  background: "white", border: `2px solid ${c.color}22`,
                  borderRadius: 18, overflow: "hidden", cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(0,0,0,.05)", transition: "all .22s"
                }}>
                  {/* crop image — full-width cover banner */}
                  <div style={{ height: 140, overflow: "hidden", position: "relative", background: "linear-gradient(135deg, #10b981, #15803d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: "white", fontSize: 24, fontWeight: 800, zIndex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 32 }}>🌱</div>
                      {c.name}
                    </div>
                    <img
                      src={CROP_IMAGE_MAP[c.name?.toLowerCase()] || c.img || FALLBACK_CROP_IMG}
                      alt={c.name}
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s ease", zIndex: 2 }}
                      onMouseOver={e => e.currentTarget.style.transform = "scale(1.07)"}
                      onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                      onError={e => { e.target.onerror = null; e.target.src = FALLBACK_CROP_IMG; }}
                    />
                    <div style={{ position: "absolute", bottom: 8, right: 8, zIndex: 3 }}>
                      <span style={{ background: c.risk === "Low" ? "#16a34a" : "#d97706", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>
                        {c.risk === "Low" ? s.low_risk : s.med_risk}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginBottom: 10 }}>{c.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                      <span>📍 {c.area}</span>
                      <span>📅 {c.days} {s.days_left}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>🌱 {s.stage}: <b>{c.stage}</b></div>
                    {/* health bar */}
                    <div style={{ height: 8, background: "#f3f4f6", borderRadius: 999, overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", width: `${c.health}%`, background: c.color, borderRadius: 999, transition: "width 1s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                      <span>{s.health_label}: <b style={{ color: c.color }}>{c.health}%</b></span>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>{c.profit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WEATHER + ALERTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* WEATHER */}
          <div className="card" style={{ background: "linear-gradient(160deg,#0a2e1f,#166534)" }}>
            <div style={{ color: "#86efac", fontSize: 12, fontWeight: 700, marginBottom: 3, textTransform: "capitalize" }}>📍 {lang === 'hi' ? 'स्थान' : 'Location'}: {locationName}</div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>{s.weather_week}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {uiWeather.map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: i === 0 ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.08)", borderRadius: 12, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{w.icon}</span>
                    <span style={{ color: i === 0 ? "white" : "#86efac", fontSize: 13, fontWeight: i === 0 ? 700 : 500 }}>{w.day}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>{w.high}° / {w.low}°</div>
                    <div style={{ color: parseInt(w.rain) > 60 ? "#93c5fd" : "#86efac", fontSize: 11 }}>💧 {w.rain}</div>
                  </div>
                </div>
              ))}
            </div>
            {weatherAdvisory && (
              <div style={{ marginTop: 12, background: weatherAdvisory.bg, border: `1px solid ${weatherAdvisory.border}`, borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ color: weatherAdvisory.color, fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                  {weatherAdvisory.icon} {s.farmer_advisory || "Farmer Advisory"}
                </div>
                <div style={{ color: "white", fontSize: 13, lineHeight: 1.4, fontWeight: 500 }}>
                  {weatherAdvisory.msg}
                </div>
              </div>
            )}
          </div>

          {/* ALERTS */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#111827" }}>🔔 {s.active_alerts}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.live_updates}</div>
              </div>
              <span className="tag" style={{ background: "#fee2e2", color: "#dc2626", fontSize: 12 }}>{alerts.length} {lang === 'hi' ? 'नया' : 'New'}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.map((a, i) => (
                <div key={i} style={{ background: a.bg, border: `1.5px solid ${a.color}33`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#374151", fontWeight: 600, lineHeight: 1.4 }}>{a.msg}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>🕐 {a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MARKET PRICES + SOIL HEALTH */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* MARKET PRICES */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#111827", marginBottom: 3 }}>📈 {s.mandi_prices_today}</div>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>{s.vs_recommended}</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div style={{ marginBottom: 14, marginTop: 12 }}>
              <input
                type="text"
                placeholder={lang === 'hi' ? "फसल खोजें (उदा: गेहूं)..." : "Search crops (e.g. Wheat)..."}
                value={mandiSearch}
                onChange={(e) => setMandiSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Wheat", "Tomato", "Onion", "Soybean", "Jawar", "Cotton"].map(c => (
                  <button
                    key={c}
                    onClick={() => setMandiSearch(mandiSearch.toLowerCase() === c.toLowerCase() ? "" : c)}
                    style={{
                      background: mandiSearch.toLowerCase() === c.toLowerCase() ? "#16a34a" : "#f3f4f6",
                      color: mandiSearch.toLowerCase() === c.toLowerCase() ? "white" : "#4b5563",
                      border: "none", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {lang === 'hi' ? { "Wheat": "गेहूं", "Tomato": "टमाटर", "Onion": "प्याज", "Soybean": "सोयाबीन", "Jawar": "ज्वार", "Cotton": "कपास" }[c] : c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
              {mandiPrices.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f9fafb", borderRadius: 12, padding: "10px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", minWidth: 100 }}>{m.icon} {lang === 'hi' ? m.crop_hi : m.crop_en}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{m.mandi_str}</div>
                  <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>{m.ai_str}</div>
                  <span className="tag" style={{ background: m.trend === "up" ? "#dcfce7" : "#fee2e2", color: m.trend === "up" ? "#166534" : "#dc2626" }}>
                    {m.trend === "up" ? "▲" : "▼"} {m.change}
                  </span>
                </div>
              ))}
              {mandiPrices.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#6b7280", fontSize: 13 }}>
                  {lang === 'hi' ? "कोई फसल नहीं मिली" : "No crops found"}
                </div>
              )}
            </div>
          </div>

          {/* ANALYZE SOIL CTA */}
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧪</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#111827", marginBottom: 6 }}>Analyze Your Soil</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 24, padding: "0 20px", lineHeight: 1.5 }}>
              Get detailed NPK breakdowns, pH interpretations, and exact fertilizer recommendations for your farm.
            </div>
            <button
              className="btn-green"
              style={{ padding: "14px 28px", fontSize: 15, width: "auto", transition: "all 0.3s" }}
              onClick={(e) => {
                const btn = e.currentTarget;
                const orig = btn.innerHTML;
                btn.innerHTML = lang === 'hi' ? "⏳ स्थान प्राप्त किया जा रहा है..." : "⏳ Fetching Location...";
                btn.style.opacity = 0.8;

                // Simulate location-based auto analysis
                setTimeout(() => {
                  btn.innerHTML = lang === 'hi' ? "⚙️ AI मिट्टी का विश्लेषण कर रहा है..." : "⚙️ AI Analyzing Soil Data...";
                  setTimeout(() => {
                    btn.innerHTML = orig;
                    btn.style.opacity = 1;

                    // Feed intelligent default/location-approximated data
                    const autoForm = { ...soilForm, ph: 6.8, moisture: 62, n: "Medium", p: "High", k: "Medium", organic: "2-3%", type: "Loamy" };
                    setSoilForm(autoForm);

                    // Generate results dynamically representing a successful auto-analysis
                    let score = 92;
                    let statusLabel = lang === 'hi' ? "शानदार (लोकेशन के आधार पर)" : "Excellent (Location Based)";
                    let statusColor = "#14532d";
                    let recs = [
                      lang === 'hi' ? "उपग्रह नमी डेटा इष्टतम स्तर दिखाता है।" : "Satellite moisture data maps show optimal levels.",
                      lang === 'hi' ? "वर्तमान मौसम प्रवृत्ति के कारण नाइट्रोजन न डालें।" : "Hold off on Nitrogen application due to upcoming weather trend.",
                      lang === 'hi' ? "आपके क्षेत्र में मिट्टी का pH संतुलित है।" : "Soil pH in your region is currently well-balanced."
                    ];
                    let cropsRank = ["Wheat", "Tomato", "Cotton"];
                    let ferts = [lang === 'hi' ? "केवल रखरखाव के लिए NPK 19:19:19" : "Standard NPK 19:19:19 — 25kg/acre for maintenance"];
                    let phMsg = lang === 'hi' ? "अधिकांश स्थानीय फसलों के लिए आदर्श तटस्थ pH।" : "Optimal neutral pH for most local crops.";

                    setSoilResults({ score, statusLabel, statusColor, recs, cropsRank, ferts, phMsg });
                    setSoilModalView("results");
                    setShowSoilModal(true);
                  }, 1500);
                }, 1000);
              }}
            >
              🧪 {lang === 'hi' ? 'अभी मिट्टी का विश्लेषण करें' : 'Analyze Soil Now'}
            </button>
          </div>
        </div>

        {/* GOVT SCHEMES */}
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 17, color: "#111827", marginBottom: 4 }}>{s.govt_schemes}</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 14 }}>{s.based_on_profile}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {SCHEMES.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{ background: s.color, borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer", transition: "all 0.2s", border: "2px solid transparent" }}
                  onMouseOver={e => { e.currentTarget.style.border = "2px solid #16a34a"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(22,163,74,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseOut={e => { e.currentTarget.style.border = "2px solid transparent"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ fontSize: 36, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.amount}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.textColor, marginTop: 6 }}>{s.status}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, borderTop: "1px solid rgba(22,163,74,0.15)", paddingTop: 8, textAlign: "right" }}>↗ Visit Official Site</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* SMART FARMING TECHNIQUES PREVIEW */}
        <div className="card" style={{ background: "linear-gradient(135deg,#0a2e1f,#166534)", border: "none" }}>
          <div style={{ color: "#86efac", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            AI-CURATED FOR YOUR FARM
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>🌱 Smart Farming Techniques</div>
              <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginTop: 3 }}>
                AI-curated techniques based on your location, soil, season and crops
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { icon: "💧", name: "Drip Irrigation Scheduling", desc: "Save 40% water with optimal micro-timing", category: "Water Management" },
              { icon: "🌿", name: "Split Nitrogen Protocol", desc: "3-dose urea split boosts yield 18-22%", category: "Fertilization" },
              { icon: "🐛", name: "IPM Pest Control", desc: "Cut pesticide cost 50% with Trichogramma", category: "Pest Control" },
            ].map((t, i) => (
              <div key={i}
                onClick={() => window.setActiveScreen && window.setActiveScreen("techniques")}
                style={{ background: "rgba(255,255,255,.12)", borderRadius: 16, padding: "16px", cursor: "pointer", transition: "all .2s", border: "1.5px solid rgba(74,222,128,.25)" }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.name}</div>
                <div style={{ color: "#86efac", fontSize: 11, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ display: "inline-block", background: "rgba(134,239,172,.2)", color: "#86efac", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{t.category}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <button
              onClick={() => window.setActiveScreen && window.setActiveScreen("techniques")}
              style={{ background: "#22c55e", color: "white", border: "none", padding: "10px 22px", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#16a34a"}
              onMouseOut={e => e.currentTarget.style.background = "#22c55e"}>
              Explore All Techniques →
            </button>
          </div>
        </div>

        <div style={{ height: 20 }} />

      </div>

      {/* ── ADD CROP MODAL ─────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); } }}>
          <div style={{
            background: "white", borderRadius: 28, width: "100%", maxWidth: 540,
            boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden",
            fontFamily: "'Poppins', sans-serif", maxHeight: "90vh", overflowY: "auto"
          }}>

            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg,#0a2e1f,#166534)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{s.add_crop_title}</div>
                <div style={{ color: "#86efac", fontSize: 12, marginTop: 3 }}>{s.add_crop_subtitle}</div>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "white", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>

            {/* Step Indicator — only for AI flow */}
            {modalMode === 'ai' && (
              <div style={{ display: "flex", padding: "14px 24px 0", gap: 8 }}>
                {[1, 2, 3].map(step => (
                  <div key={step} style={{ flex: 1, height: 4, borderRadius: 999, background: step <= modalStep ? "#22c55e" : "#e5e7eb", transition: "background .3s" }} />
                ))}
              </div>
            )}

            <div style={{ padding: "20px 24px 24px" }}>

              {/* ── PICKER: Choose mode ── */}
              {modalMode === null && (
                <div>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>🌱</div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>{lang === "hi" ? "आप कैसे फसल जोड़ना चाहते हैं?" : "How would you like to add a crop?"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {/* AI Option */}
                    <div
                      onClick={() => { setModalMode('ai'); setModalStep(1); }}
                      style={{ border: "2px solid #bbf7d0", borderRadius: 18, padding: "22px 16px", textAlign: "center", cursor: "pointer", background: "#f0fdf4", transition: "all .2s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.borderColor = "#22c55e"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#bbf7d0"; }}
                    >
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#15803d", marginBottom: 5 }}>{lang === "hi" ? "AI अनुशंसक" : "AI Recommender"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{lang === "hi" ? "मिट्टी डेटा दें, AI सर्वश्रेष्ठ फसल बताएगा" : "Enter soil data and let AI pick the best crop for you"}</div>
                    </div>
                    {/* Manual Option */}
                    <div
                      onClick={() => setModalMode('manual')}
                      style={{ border: "2px solid #e9d5ff", borderRadius: 18, padding: "22px 16px", textAlign: "center", cursor: "pointer", background: "#faf5ff", transition: "all .2s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#f3e8ff"; e.currentTarget.style.borderColor = "#a855f7"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "#faf5ff"; e.currentTarget.style.borderColor = "#e9d5ff"; }}
                    >
                      <div style={{ fontSize: 40, marginBottom: 10 }}>✍️</div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#7e22ce", marginBottom: 5 }}>{lang === "hi" ? "मैन्युअल जोड़ें" : "Add Manually"}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{lang === "hi" ? "फसल का नाम और विवरण सीधे भरें" : "Directly fill crop name and details"}</div>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} style={{ width: "100%", marginTop: 16, padding: "10px", border: "1.5px solid #e5e7eb", borderRadius: 12, background: "white", color: "#6b7280", fontFamily: "'Poppins',sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{s.cancel}</button>
                </div>
              )}

              {/* ── MANUAL ENTRY FORM ── */}
              {modalMode === 'manual' && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <button onClick={() => setModalMode(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}>←</button>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>✍️ {lang === "hi" ? "फसल जोड़ें — मैन्युअल" : "Add Crop — Manual"}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {/* Crop Name */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{lang === "hi" ? "फसल का नाम *" : "Crop Name *"}</label>
                      <input
                        placeholder={lang === "hi" ? "जैसे: गेहूं, चावल, कपास" : "e.g. Wheat, Rice, Cotton"}
                        value={manualForm.name}
                        onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif", color: "#374151", background: "#f9fafb", boxSizing: "border-box", outline: "none" }}
                        onFocus={e => e.target.style.borderColor = "#a855f7"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                      />
                    </div>
                    {/* Area */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{s.area_acres_label}</label>
                      <input
                        type="number" min={0.1} max={1000} step={0.1}
                        placeholder="e.g. 2.5"
                        value={manualForm.area}
                        onChange={e => setManualForm(p => ({ ...p, area: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif", color: "#374151", background: "#f9fafb", boxSizing: "border-box", outline: "none" }}
                        onFocus={e => e.target.style.borderColor = "#a855f7"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                      />
                    </div>
                    {/* Stage */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{lang === "hi" ? "वर्तमान चरण" : "Current Stage"}</label>
                      <select
                        value={manualForm.stage}
                        onChange={e => setManualForm(p => ({ ...p, stage: e.target.value }))}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif", color: "#374151", background: "#f9fafb", boxSizing: "border-box", outline: "none", cursor: "pointer" }}
                      >
                        {["Sowing", "Germination", "Vegetative", "Flowering", "Fruiting", "Harvesting", "Growing"].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                    {/* Health */}
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{s.health_label}: <b style={{ color: "#16a34a" }}>{manualForm.health}%</b></label>
                      <input
                        type="range" min={1} max={100}
                        value={manualForm.health}
                        onChange={e => setManualForm(p => ({ ...p, health: parseInt(e.target.value) }))}
                        style={{ width: "100%", accentColor: "#22c55e", height: 6, cursor: "pointer" }}
                      />
                    </div>
                  </div>

                  {manualError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 12, marginTop: 12 }}>⚠️ {manualError}</div>}

                  <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                    <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 12, background: "white", color: "#6b7280", fontFamily: "'Poppins',sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{s.cancel}</button>
                    <button
                      style={{ flex: 2, background: "linear-gradient(135deg,#a855f7,#7e22ce)", color: "white", border: "none", borderRadius: 12, padding: "11px", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s" }}
                      onClick={async () => {
                        if (!manualForm.name.trim()) { setManualError(lang === "hi" ? "फसल का नाम आवश्यक है" : "Crop name is required"); return; }
                        const colors = HEALTH_COLORS;
                        const cropName = manualForm.name.trim();
                        // Live search for image
                        const imgUrl = await searchCropImage(cropName);
                        const newCrop = {
                          name: cropName,
                          area: manualForm.area ? `${manualForm.area} ${s.acres}` : `1.0 ${s.acres}`,
                          stage: manualForm.stage,
                          health: manualForm.health,
                          risk: manualForm.health >= 75 ? "Low" : "Medium",
                          profit: "—",
                          img: imgUrl,
                          color: colors[crops.length % colors.length],
                          days: 90,
                        };
                        setCrops(prev => [...prev, newCrop]);
                        setShowAddModal(false);
                      }}
                    >✅ {lang === "hi" ? "सीधे जोड़ें" : "Add Crop Directly"}</button>
                  </div>
                </div>
              )}

              {/* ── STEP 1 (AI): Soil Input Form ── */}
              {modalMode === 'ai' && modalStep === 1 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <button onClick={() => setModalMode(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: 16 }}>←</button>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>🤖 {lang === "hi" ? "AI अनुशंसक" : "AI Recommender"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    {[
                      { key: "N", label: s.nitrogen, placeholder: "e.g. 60", min: 0, max: 200 },
                      { key: "P", label: s.phosphorus, placeholder: "e.g. 28", min: 0, max: 100 },
                      { key: "K", label: s.potassium, placeholder: "e.g. 120", min: 0, max: 400 },
                      { key: "ph", label: s.ph_label, placeholder: "e.g. 6.5", min: 0, max: 14, step: 0.1 },
                      { key: "temperature", label: s.temperature, placeholder: "e.g. 25", min: -10, max: 55 },
                      { key: "humidity", label: s.humidity, placeholder: "e.g. 65", min: 0, max: 100 },
                      { key: "rainfall", label: s.rainfall, placeholder: "e.g. 120", min: 0, max: 1000 },
                      { key: "area_acres", label: s.area_acres_label, placeholder: "e.g. 2.5", min: 0.1, max: 100, step: 0.1 },
                    ].map(({ key, label, placeholder, min, max, step = 1 }) => (
                      <div key={key}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
                        <input
                          type="number" min={min} max={max} step={step}
                          placeholder={placeholder}
                          value={formData[key]}
                          onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif", color: "#374151", background: "#f9fafb", boxSizing: "border-box", outline: "none" }}
                          onFocus={e => e.target.style.borderColor = "#22c55e"}
                          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                        />
                      </div>
                    ))}
                  </div>

                  {recError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", color: "#dc2626", fontSize: 12, marginBottom: 12 }}>⚠️ {recError}</div>}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 12, background: "white", color: "#6b7280", fontFamily: "'Poppins',sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{s.cancel}</button>
                    <button
                      className="btn-green"
                      style={{ flex: 2 }}
                      disabled={loadingRec}
                      onClick={async () => {
                        const required = ["N", "P", "K", "ph", "temperature", "humidity", "rainfall"];
                        const missing = required.filter(k => !formData[k]);
                        if (missing.length) { setRecError(`Please fill: ${missing.join(", ")}`); return; }
                        setRecError(""); setLoadingRec(true);
                        try {
                          const payload = {
                            N: parseFloat(formData.N), P: parseFloat(formData.P), K: parseFloat(formData.K),
                            ph: parseFloat(formData.ph), temperature: parseFloat(formData.temperature),
                            humidity: parseFloat(formData.humidity), rainfall: parseFloat(formData.rainfall),
                            area_acres: formData.area_acres ? parseFloat(formData.area_acres) : 1.0,
                          };
                          const res = await fetch("http://localhost:5000/api/crop/recommend", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });
                          if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed"); }
                          const data = await res.json();
                          setRecommendation(data);
                          setModalStep(2);
                        } catch (err) {
                          setRecError(err.message || "Backend error. Is the server running?");
                        } finally { setLoadingRec(false); }
                      }}
                    >
                      {loadingRec ? s.analyzing : s.get_recommendation}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 (AI): Recommendation Result ── */}
              {modalMode === 'ai' && modalStep === 2 && recommendation && (
                <div>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{ fontSize: 56, marginBottom: 8 }}>🌾</div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: "#15803d" }}>{recommendation.crop_name}</div>
                    <div style={{ background: recommendation.source === "ml_model" ? "#dcfce7" : "#fef3c7", color: recommendation.source === "ml_model" ? "#166534" : "#92400e", display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                      {recommendation.source === "ml_model" ? `🤖 ${s.source_ml}` : `📋 ${s.source_rule}`} · {recommendation.confidence}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[
                      { icon: "🌡️", label: s.season_label, val: recommendation.season },
                      { icon: "💧", label: s.water_req, val: recommendation.water_requirement },
                      { icon: "☀️", label: s.sunlight_req, val: recommendation.sunlight_requirement },
                      { icon: "💰", label: s.est_profit, val: recommendation.estimated_profit },
                    ].map(({ icon, label, val }) => (
                      <div key={label} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>🧪 {s.fertilizer_tip}</div>
                    <div style={{ fontSize: 13, color: "#78350f" }}>{recommendation.fertilizer_tip}</div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => { setModalStep(1); setRecommendation(null); }} style={{ flex: 1, padding: "11px", border: "1.5px solid #e5e7eb", borderRadius: 12, background: "white", color: "#6b7280", fontFamily: "'Poppins',sans-serif", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{s.try_again}</button>
                    <button
                      className="btn-green"
                      style={{ flex: 2 }}
                      onClick={async () => {
                        const colors = HEALTH_COLORS;
                        const cropName = recommendation.crop_name;
                        const imgUrl = await searchCropImage(cropName);
                        const newCrop = {
                          name: cropName,
                          area: `${formData.area_acres || "1.0"} ${s.acres}`,
                          stage: lang === "hi" ? "बुवाई" : "Sowing",
                          health: 80,
                          risk: "Low",
                          profit: recommendation.estimated_profit,
                          img: imgUrl,
                          color: colors[crops.length % colors.length],
                          days: 90,
                        };
                        setCrops(prev => [...prev, newCrop]);
                        setModalStep(3);
                      }}
                    >{s.add_this_crop}</button>
                  </div>
                </div>
              )}

              {/* ── STEP 3 (AI): Success ── */}
              {modalMode === 'ai' && modalStep === 3 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: "#15803d", marginBottom: 8 }}>{s.crop_added}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>{recommendation?.crop_name} {lang === "hi" ? "को आपके खेत में जोड़ दिया गया है।" : "has been added to your farm."}</div>
                  <button className="btn-green" style={{ padding: "12px 32px", fontSize: 14 }} onClick={() => setShowAddModal(false)}>✨ Done</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* NEW SOIL ANALYSIS FULL-SCREEN MODAL */}
      {showSoilModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "100%", maxWidth: 680, background: "#f8fdf9", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>

            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg,#0a2e1f,#166534)", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 20 }}>🧪 {soilModalView === "form" ? (lang === 'hi' ? 'अपनी मिट्टी का विश्लेषण करें' : 'Analyze Your Soil') : (lang === 'hi' ? 'मिट्टी स्वास्थ्य परिणाम' : 'Soil Health Results')}</div>
                {soilModalView === "form" && <div style={{ color: "#86efac", fontSize: 13, marginTop: 4 }}>{lang === 'hi' ? 'AI सटीक NPK मिलान के लिए विवरण दर्ज करें' : 'Enter details for AI precision NPK matching'}</div>}
              </div>
              <button
                onClick={() => setShowSoilModal(false)}
                style={{ background: "rgba(255,255,255,.15)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
              >✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>

              {soilModalView === "form" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>1. {lang === 'hi' ? 'बुनियादी जानकारी' : 'Basic Info'}</div>
                      <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type'}</label>
                      <select value={soilForm.type} onChange={e => setSoilForm({ ...soilForm, type: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 12, outline: "none" }}>
                        {lang === 'hi' ? <><option value="Loamy">दोमट</option><option value="Sandy">रेतीली</option><option value="Clay">चिकनी मिट्टी</option><option value="Black (Regur)">काली (रेगुर)</option><option value="Red Laterite">लाल लेटराइट</option><option value="Silty">गाद युक्त</option></> : <><option>Loamy</option><option>Sandy</option><option>Clay</option><option>Black (Regur)</option><option>Red Laterite</option><option>Silty</option></>}
                      </select>
                      <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'खेत का स्थान' : 'Farm Location'}</label>
                      <input value={soilForm.location} onChange={e => setSoilForm({ ...soilForm, location: e.target.value })} placeholder={lang === 'hi' ? 'जैसे: पुणे, MH' : 'e.g. Pune, MH'} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: 12, outline: "none" }} />
                      <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'खेत का आकार (एकड़)' : 'Farm Size (Acres)'}</label>
                      <input type="number" value={soilForm.size} onChange={e => setSoilForm({ ...soilForm, size: e.target.value })} placeholder={lang === 'hi' ? 'जैसे: 5' : 'e.g. 5'} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }} />
                    </div>

                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>2. {lang === 'hi' ? 'पोषक तत्व स्तर' : 'Nutrient Levels'}</div>
                      {(lang === 'hi' ? ["नाइट्रोजन (N)", "फॉस्फोरस (P)", "पोटेशियम (K)"] : ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"]).map((nut, idx) => {
                        const keys = ["n", "p", "k"];
                        return (
                          <div key={nut}>
                            <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{nut}</label>
                            <select value={soilForm[keys[idx]]} onChange={e => setSoilForm({ ...soilForm, [keys[idx]]: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", marginBottom: idx === 2 ? 0 : 12, outline: "none" }}>
                              {lang === 'hi' ? <><option value="Very Low">बहुत कम</option><option value="Low">कम</option><option value="Medium">मध्यम</option><option value="High">अधिक</option><option value="Very High">बहुत अधिक</option></> : <><option>Very Low</option><option>Low</option><option>Medium</option><option>High</option><option>Very High</option></>}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>3. {lang === 'hi' ? 'मिट्टी की स्थिति' : 'Soil Conditions'}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600 }}>{lang === 'hi' ? 'मिट्टी pH' : 'Soil pH'}</label>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>{soilForm.ph}</span>
                        </div>
                        <input type="range" min="4.0" max="9.0" step="0.1" value={soilForm.ph} onChange={e => setSoilForm({ ...soilForm, ph: parseFloat(e.target.value) })} style={{ width: "100%", accentColor: "#16a34a", marginBottom: 16 }} />

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600 }}>{lang === 'hi' ? 'मिट्टी की नमी' : 'Soil Moisture'}</label>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#3b82f6" }}>{soilForm.moisture}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={soilForm.moisture} onChange={e => setSoilForm({ ...soilForm, moisture: parseInt(e.target.value) })} style={{ width: "100%", accentColor: "#3b82f6" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'जैविक पदार्थ' : 'Organic Matter'}</label>
                        <select value={soilForm.organic} onChange={e => setSoilForm({ ...soilForm, organic: e.target.value })} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}>
                          {lang === 'hi' ? <><option value="Less than 1%">1% से कम</option><option value="1-2%">1-2%</option><option value="2-3%">2-3%</option><option value="More than 3%">3% से अधिक</option></> : <><option>Less than 1%</option><option>1-2%</option><option>2-3%</option><option>More than 3%</option></>}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>4. {lang === 'hi' ? 'अतिरिक्त जानकारी' : 'Additional Info'}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'अंतिम उर्वरक उपयोग' : 'Last Fertilizer Used'}</label>
                        <input value={soilForm.lastFert} onChange={e => setSoilForm({ ...soilForm, lastFert: e.target.value })} placeholder={lang === 'hi' ? 'जैसे: यूरिया' : 'e.g. Urea'} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'वर्तमान उगाई जा रही फसल' : 'Current Crop Growing'}</label>
                        <input value={soilForm.currentCrop} onChange={e => setSoilForm({ ...soilForm, currentCrop: e.target.value })} placeholder={lang === 'hi' ? 'जैसे: गेहूं' : 'e.g. Wheat'} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }} />
                      </div>
                    </div>
                    <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, display: "block", marginBottom: 4 }}>{lang === 'hi' ? 'कोई दृश्य समस्याएं' : 'Any Visible Problems'}</label>
                    <textarea value={soilForm.problems} onChange={e => setSoilForm({ ...soilForm, problems: e.target.value })} placeholder={lang === 'hi' ? 'पीलापन, मुरझाना, धब्बों का वर्णन करें...' : 'Describe any yellowing, wilting, patches...'} rows="3" style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e5e7eb", outline: "none", resize: "none" }}></textarea>
                  </div>
                </>
              ) : (
                <>
                  {soilResults && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 20, background: "white", padding: 24, borderRadius: 20, boxShadow: "0 4px 12px rgba(0,0,0,.05)" }}>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <RingChart value={soilResults.score} color={soilResults.statusColor} size={110} stroke={10} />
                          <div style={{ position: "absolute", textAlign: "center" }}>
                            <div style={{ fontSize: 26, fontWeight: 900, color: soilResults.statusColor }}>{soilResults.score}</div>
                            <div style={{ fontSize: 10, color: "#9ca3af" }}>/ 100</div>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{lang === 'hi' ? 'समग्र मिट्टी स्वास्थ्य' : 'Overall Soil Health'}</div>
                          <div style={{ fontSize: 28, fontWeight: 900, color: soilResults.statusColor, marginBottom: 4 }}>{soilResults.statusLabel}</div>
                          <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.5, maxWidth: 350 }}>{soilResults.phMsg} {lang === 'hi' ? 'तदनुसार फसलों का मिलान करें और इन निष्कर्षों के आधार पर जैविक इनपुट का अनुकूलन करें।' : 'Match crops accordingly and optimize organic inputs based on these findings.'}</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {[{ l: "Nitrogen (N)", v: soilForm.n, c: "#3b82f6" }, { l: "Phosphorus (P)", v: soilForm.p, c: "#f59e0b" }, { l: "Potassium (K)", v: soilForm.k, c: "#8b5cf6" }].map(n => (
                          <div key={n.l} style={{ background: "white", borderRadius: 16, padding: "16px", border: `1px solid ${n.c}33`, textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginBottom: 4 }}>{n.l}</div>
                            <span style={{ background: `${n.c}22`, color: n.c, padding: "4px 12px", borderRadius: 999, fontSize: 13, fontWeight: 800 }}>{n.v}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "20px" }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#166534", marginBottom: 12 }}>{lang === 'hi' ? '⚙️ शीर्ष AI सिफारिशें' : '⚙️ Top AI Recommendations'}</div>
                          <ul style={{ margin: 0, paddingLeft: 18, color: "#15803d", fontSize: 13, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
                            {soilResults.recs.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div style={{ background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,.03)", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{lang === 'hi' ? '🌱 उगाने के लिए सर्वश्रेष्ठ फसलें' : '🌱 Best Crops To Grow'}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {soilResults.cropsRank.map(c => <span key={c} style={{ background: "#f3f4f6", color: "#374151", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>{c}</span>)}
                            </div>
                          </div>
                          <div style={{ background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,.03)", border: "1px solid #e5e7eb" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{lang === 'hi' ? '💊 उर्वरक सुझाव' : '💊 Fertilizer Suggestions'}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {soilResults.ferts.map((f, i) => <div key={i} style={{ color: "#4b5563", fontSize: 12, fontWeight: 500 }}>• {f}</div>)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer / Submit Button */}
            {soilModalView === "form" ? (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", background: "white" }}>
                <button
                  onClick={handleAnalyzeSoilSubmit}
                  style={{ width: "100%", background: "linear-gradient(135deg,#22c55e,#15803d)", color: "white", border: "none", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 8px 24px rgba(34,197,94,.3)", transition: "all .2s" }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.01)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  🔬 {lang === 'hi' ? 'मेरी मिट्टी का विश्लेषण करें' : 'Analyze My Soil'}
                </button>
              </div>
            ) : (
              <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", gap: 12 }}>
                <button
                  onClick={() => setSoilModalView("form")}
                  style={{ flex: 1, background: "#f3f4f6", color: "#4b5563", border: "none", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
                >
                  ← {lang === 'hi' ? 'इनपुट संपादित करें' : 'Edit Inputs'}
                </button>
                <button
                  onClick={() => setShowSoilModal(false)}
                  style={{ flex: 1, background: "#16a34a", color: "white", border: "none", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}
                >
                  {lang === 'hi' ? 'हो गया' : 'Done'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP CHAT */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 100 }}>
        <a 
          href="https://wa.me/14155238886" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Chat with SmartFarm AI on WhatsApp 🌾"
          style={{ 
            width: 60, height: 60, background: "#25D366", 
            borderRadius: "50%", cursor: "pointer", 
            boxShadow: "0 8px 28px rgba(37, 211, 102, 0.5)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            marginLeft: "auto", transition: "transform .2s",
            textDecoration: "none",
            animation: "waPulse 2s infinite"
          }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <svg viewBox="0 0 32 32" width="34" height="34" fill="white">
            <path d="M16 2.016A13.98 13.98 0 0 0 2 16c0 2.477.643 4.88 1.867 6.993L2.016 30l7.155-1.876A13.923 13.923 0 0 0 16 30a13.98 13.98 0 0 0 14-13.984C30 9.728 23.727 2.016 16 2.016zm0 25.617c-2.093 0-4.14-.563-5.932-1.624l-.425-.252-4.41 1.156 1.176-4.302-.276-.438A11.602 11.602 0 0 1 4.364 16 11.636 11.636 0 0 1 16 4.362 11.636 11.636 0 0 1 27.636 16 11.636 11.636 0 0 1 16 27.633zm6.387-8.718c-.35-.175-2.067-1.02-2.387-1.137-.32-.117-.552-.175-.785.175-.233.35-.902 1.137-1.106 1.37-.204.233-.408.262-.758.087a9.585 9.585 0 0 1-2.822-1.741 10.574 10.574 0 0 1-1.956-2.435c-.204-.35-.022-.54.153-.715.157-.157.35-.408.525-.612.175-.204.233-.35.35-.583.117-.233.058-.437-.03-.612-.087-.175-.785-1.895-1.077-2.595-.283-.68-.57-.593-.785-.603-.204-.01-.437-.01-.67-.01s-.612.087-.932.437c-.32.35-1.223 1.195-1.223 2.915 0 1.72 1.252 3.382 1.427 3.615.175.233 2.47 3.77 5.987 5.286.837.36 1.49.576 2.003.738.84.267 1.606.23 2.213.14.68-.1 2.067-.845 2.358-1.662.292-.816.292-1.516.204-1.662-.087-.145-.32-.232-.67-.407z"/>
          </svg>
        </a>
        <div style={{ position: "absolute", top: -6, right: -4, width: 20, height: 20, background: "#ef4444", borderRadius: "50%", color: "white", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", zIndex: 101, pointerEvents: "none" }}>1</div>
        <style>{`
          @keyframes waPulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
          }
        `}</style>
      </div>
    </div>
  );
}