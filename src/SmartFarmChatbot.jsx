import { useState, useEffect, useRef } from "react";
import { useLang } from "./App";

const getCropEmoji = (crop) => {
  const c = String(crop || "").toLowerCase();
  if (c.includes("wheat")) return "🌾";
  if (c.includes("rice") || c.includes("paddy")) return "🍚";
  if (c.includes("tomato")) return "🍅";
  if (c.includes("onion")) return "🧅";
  if (c.includes("sugarcane")) return "🎋";
  if (c.includes("cotton")) return "☁️";
  if (c.includes("soybean") || c.includes("dal")) return "🫘";
  if (c.includes("maize") || c.includes("corn")) return "🌽";
  if (c.includes("chilli")) return "🌶️";
  if (c.includes("potato")) return "🥔";
  if (c.includes("grapes")) return "🍇";
  if (c.includes("strawberry")) return "🍓";
  if (c.includes("avocado")) return "🥑";
  return "🌿";
};

const getLocalResponse = (input, isHindi, userLocation = "Pune, Maharashtra") => {
  const lower = input.toLowerCase();
  const city = userLocation.split(",")[0] || "Your Location";
  
  if (lower.includes("fertilizer") || lower.includes("khad") || lower.includes("urea") || lower.includes("dap")) {
    return isHindi 
      ? "🌱 Fertilizer Recommendation:\n\nGehun (Wheat) ke liye:\n• Urea — 50 kg/acre bowing ke time\n• DAP — 25 kg/acre basal dose\n• MOP — 20 kg/acre sowing ke time\n• Zinc Sulphate — 5 kg/acre after 21 days\n\nTotal cost: ₹2,785/acre\n\n⚠️ Baarish se pehle fertilizer mat daalen!"
      : "🌱 Fertilizer Recommendation:\n\nFor Wheat (Gehun):\n• Urea — 50 kg/acre at sowing\n• DAP — 25 kg/acre basal dose\n• MOP — 20 kg/acre at sowing\n• Zinc Sulphate — 5 kg/acre after 21 days\n\nTotal cost: ₹2,785/acre\n\n⚠️ Avoid applying fertilizer before rain!";
  }
  
  if (lower.includes("weather") || lower.includes("mausam") || lower.includes("rain") || lower.includes("baarish")) {
    return isHindi
      ? `🌦️ Mausam Advisory — ${city}:\n\n• Aaj: 32°C / 24°C ☀️ Clear\n• Kal: 28°C / 21°C 🌧️ Baarish (80%)\n• Parson: 25°C / 19°C ⛈️ Bhari baarish\n\n⚠️ Agle 3 din fertilizer ya pesticide spray bilkul mat karein!\n✅ Aaj sowing ke liye perfect time hai!`
      : `🌦️ Weather Advisory — ${city}:\n\n• Today: 32°C / 24°C ☀️ Clear\n• Tomorrow: 28°C / 21°C 🌧️ Rain (80%)\n• Day After: 25°C / 19°C ⛈️ Heavy rain\n\n⚠️ Do not spray fertilizer or pesticide for the next 3 days!\n✅ Today is the perfect time for sowing!`;
  }
  
  if (lower.includes("mandi") || lower.includes("price") || lower.includes("rate") || lower.includes("bhav")) {
    return isHindi
      ? "📈 Aaj ke Live Mandi Bhav:\n\n🌾 Wheat — ₹2,275/q (AI: ₹2,340/q) ▲\n🍅 Tomato — ₹1,200/q (AI: ₹1,350/q) ▲\n🧅 Onion — ₹1,100/q (AI: ₹1,200/q) ▲\n🫘 Soybean — ₹4,600/q (AI: ₹4,800/q) ▲\n🌽 Maize — ₹2,090/q (AI: ₹2,100/q) ▲\n\n💡 Wheat abhi mat bechein — price 2 hafte mein ₹2,500 tak ja sakta hai!"
      : "📈 Today's Live Mandi Prices:\n\n🌾 Wheat — ₹2,275/q (AI: ₹2,340/q) ▲\n🍅 Tomato — ₹1,200/q (AI: ₹1,350/q) ▲\n🧅 Onion — ₹1,100/q (AI: ₹1,200/q) ▲\n🫘 Soybean — ₹4,600/q (AI: ₹4,800/q) ▲\n🌽 Maize — ₹2,090/q (AI: ₹2,100/q) ▲\n\n💡 Do not sell wheat right now — price can go up to ₹2,500 in 2 weeks!";
  }
  
  if (lower.includes("pest") || lower.includes("disease") || lower.includes("keeda") || lower.includes("bimari") || lower.includes("aphid")) {
    return isHindi
      ? "🐛 Pest aur Disease Guide:\n\nAphid (Mahu):\n• Pehchaan: Patto ke neeche chote peele keede\n• Ilaj: Neem oil 5ml/L paani mein spray karein\n• Timing: Subah ya shaam ko\n\nGehun Rust:\n• Pehchaan: Orange-brown daane patto par\n• Ilaj: Propiconazole 25 EC @ 0.1% spray\n• 5 din ke andar karein!\n\n⚠️ Baarish ke baad disease ka khatra zyada hota hai!"
      : "🐛 Pest and Disease Guide:\n\nAphids:\n• Identify: Small yellow insects under leaves\n• Treatment: Spray Neem oil 5ml/L of water\n• Timing: Morning or evening\n\nWheat Rust:\n• Identify: Orange-brown spots on leaves\n• Treatment: Propiconazole 25 EC @ 0.1% spray\n• Treat within 5 days!\n\n⚠️ Disease risk increases after rain!";
  }
  
  if (lower.includes("crop") || lower.includes("fasal") || lower.includes("best crop") || lower.includes("konsi") || lower.includes("ugaun")) {
    return isHindi
      ? `🌾 Aapke Liye Best Crop Recommendation:\n\nAapki Loamy mitti aur ${city} ke mausam ke hisaab se:\n\n🥇 Best: Wheat (Gehun)\n• Expected Profit: ₹38,000–52,000/acre\n• Risk Score: 24/100 (Low)\n• Sowing: November 1–15\n\n🥈 Alternative: Mustard\n• Low water, premium price ₹5,400/q\n\n🥉 Alternative: Soybean\n• Fast crop, good market demand\n\n📸 Better recommendation ke liye farm photo upload karein!`
      : `🌾 Best Crop Recommendation for You:\n\nBased on your Loamy soil and ${city} weather:\n\n🥇 Best: Wheat\n• Expected Profit: ₹38,000–52,000/acre\n• Risk Score: 24/100 (Low)\n• Sowing: November 1–15\n\n🥈 Alternative: Mustard\n• Low water, premium price ₹5,400/q\n\n🥉 Alternative: Soybean\n• Fast crop, good market demand\n\n📸 Upload farm photo for a better recommendation!`;
  }
  
  if (lower.includes("scheme") || lower.includes("yojana") || lower.includes("government") || lower.includes("sarkar") || lower.includes("subsidy")) {
    return isHindi
      ? "🏛️ Aapke Liye Sarkari Yojanaen:\n\n1. PM-KISAN Samman Nidhi ✅\n• ₹6,000/year (3 installments)\n• Apply: pmkisan.gov.in\n\n2. Kisan Credit Card (KCC) ✅\n• Up to ₹3 lakh @ 4% interest\n• Apply: Nearest bank branch\n\n3. PM Fasal Bima Yojana ✅\n• Crop insurance 1.5–5% premium\n• Deadline: November 30\n\n4. Soil Health Card ✅\n• Free soil testing every 2 years\n• Contact: Nearest KVK center\n\n📞 Helpline: 1800-180-1551"
      : "🏛️ Government Schemes for You:\n\n1. PM-KISAN Samman Nidhi ✅\n• ₹6,000/year (3 installments)\n• Apply: pmkisan.gov.in\n\n2. Kisan Credit Card (KCC) ✅\n• Up to ₹3 lakh @ 4% interest\n• Apply: Nearest bank branch\n\n3. PM Fasal Bima Yojana ✅\n• Crop insurance 1.5–5% premium\n• Deadline: November 30\n\n4. Soil Health Card ✅\n• Free soil testing every 2 years\n• Contact: Nearest KVK center\n\n📞 Helpline: 1800-180-1551";
  }
  
  if (lower.includes("soil") || lower.includes("mitti") || lower.includes("ph") || lower.includes("nitrogen") || lower.includes("phosphorus")) {
    return isHindi
      ? "🧪 Soil Health Report:\n\nAapki Loamy mitti ke baare mein:\n\n• pH: 6.8 ✅ Optimal\n• Nitrogen (N): Medium — thoda aur chahiye\n• Phosphorus (P): Low ⚠️ DAP daalna zaroori\n• Potassium (K): High ✅ Achha hai\n• Organic Matter: 2.1% — improve karein\n\nSudhaar ke Upay:\n1. Vermicompost 2 ton/acre daalen\n2. DAP se Phosphorus badhao\n3. Crop rotation karein\n\n💡 Har season soil test zaroori hai!"
      : "🧪 Soil Health Report:\n\nAbout your Loamy soil:\n\n• pH: 6.8 ✅ Optimal\n• Nitrogen (N): Medium — needs a bit more\n• Phosphorus (P): Low ⚠️ DAP is required\n• Potassium (K): High ✅ Good\n• Organic Matter: 2.1% — needs improvement\n\nImprovement Steps:\n1. Apply 2 tons/acre Vermicompost\n2. Increase Phosphorus with DAP\n3. Practice crop rotation\n\n💡 Soil testing is vital every season!";
  }
  
  if (lower.includes("profit") || lower.includes("munafa") || lower.includes("income") || lower.includes("earning") || lower.includes("kamai")) {
    return isHindi
      ? "💰 Profit Estimate — Aapki Farm:\n\nGehun (Wheat) ke liye 6.7 acres:\n\n🚀 Best Case: ₹3,48,400\n🎯 Expected: ₹2,54,800\n📉 Worst Case: ₹1,42,600\n\nBreakdown per acre:\n• Expected Yield: 18 q/acre\n• Selling Price: ₹2,340/q\n• Gross Revenue: ₹42,120\n• Input Cost: ₹12,485\n• Net Profit: ₹29,635/acre\n• ROI: 137%\n\n💡 Profit Simulator mein jaao for detailed forecast!"
      : "💰 Profit Estimate — Your Farm:\n\nFor Wheat on 6.7 acres:\n\n🚀 Best Case: ₹3,48,400\n🎯 Expected: ₹2,54,800\n📉 Worst Case: ₹1,42,600\n\nBreakdown per acre:\n• Expected Yield: 18 q/acre\n• Selling Price: ₹2,340/q\n• Gross Revenue: ₹42,120\n• Input Cost: ₹12,485\n• Net Profit: ₹29,635/acre\n• ROI: 137%\n\n💡 Check the Profit Simulator for a detailed forecast!";
  }
  
  return isHindi
    ? "🤔 Main samjha nahi. Aap ye pooch sakte hain:\n\n• 💊 Fertilizer advice\n• 🌦️ Mausam ki jaankari\n• 📈 Mandi ke bhav\n• 🐛 Pest aur disease\n• 🌾 Best crop recommendation\n• 🏛️ Sarkari yojanaen\n• 🧪 Soil health\n• 💰 Profit estimate"
    : "🤔 I didn't quite understand. You can ask about:\n\n• 💊 Fertilizer advice\n• 🌦️ Weather advisory\n• 📈 Mandi prices\n• 🐛 Pest and disease\n• 🌾 Best crop recommendation\n• 🏛️ Government schemes\n• 🧪 Soil health\n• 💰 Profit estimate";
};

// ── Markdown-like text renderer ──────────────────────────────────
function MsgText({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,.88)" }}>
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <div key={i} style={{ fontWeight: 800, color: "#4ade80", fontSize: 14, marginBottom: 4 }}>{line.replace(/\*\*/g, "")}</div>;
        }
        if (line.startsWith("• ")) {
          const content = line.slice(2);
          const parts = content.split("**");
          return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}>
              <span style={{ color: "#4ade80", flexShrink: 0 }}>•</span>
              <span>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "white" }}>{p}</strong> : p)}</span>
            </div>
          );
        }
        if (line.startsWith("|") && line.includes("|")) {
          const cells = line.split("|").filter(Boolean).map(c => c.trim());
          if (cells[0] === "---" || cells[0] === "----") return null;
          return (
            <div key={i} style={{ display: "flex", gap: 0, marginBottom: 2 }}>
              {cells.map((cell, j) => (
                <div key={j} style={{ flex: 1, padding: "3px 8px", background: "rgba(255,255,255,.04)", borderRight: "1px solid rgba(255,255,255,.06)", fontSize: 12, color: j === 0 ? "rgba(255,255,255,.7)" : "#4ade80" }}>{cell}</div>
              ))}
            </div>
          );
        }
        if (line.startsWith("#")) {
          return <div key={i} style={{ fontWeight: 800, fontSize: 15, color: "#4ade80", margin: "8px 0 4px" }}>{line.replace(/^#+\s/, "")}</div>;
        }
        if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
        const parts = line.split("**");
        return (
          <div key={i} style={{ marginBottom: 2 }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "white", fontWeight: 700 }}>{p}</strong> : p)}
          </div>
        );
      })}
    </div>
  );
}

// ── Typing dots ──────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", opacity: 0.7, animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
      ))}
    </div>
  );
}

const getQuickReplies = (lang) => [
  { label: lang === "hi" ? "💊 उर्वरक सलाह" : "💊 Fertilizer advice", query: lang === "hi" ? "मेरी फसल के लिए उर्वरक सलाह दें" : "Fertilizer advice for my crop" },
  { label: lang === "hi" ? "🌦️ आज का मौसम" : "🌦️ Weather today", query: lang === "hi" ? "आज मौसम कैसा है?" : "What is the weather today?" },
  { label: lang === "hi" ? "📈 मंडी भाव" : "📈 Mandi prices", query: lang === "hi" ? "आज के मंडी भाव क्या हैं?" : "What are today's mandi prices?" },
  { label: lang === "hi" ? "🐛 कीट और रोग" : "🐛 Pest & disease", query: lang === "hi" ? "एफिड रोग का इलाज कैसे करें?" : "How to treat aphid disease?" },
  { label: lang === "hi" ? "🌾 मेरे लिए सर्वश्रेष्ठ फसल" : "🌾 Best crop for me", query: lang === "hi" ? "मुझे इस मौसम में कौन सी फसल उगानी चाहिए?" : "Which crop should I grow this season?" },
  { label: lang === "hi" ? "🏛️ सरकारी योजनाएं" : "🏛️ Govt schemes", query: lang === "hi" ? "मैं किन सरकारी योजनाओं के लिए पात्र हूं?" : "What government schemes am I eligible for?" },
  { label: lang === "hi" ? "🧪 मिट्टी का स्वास्थ्य" : "🧪 Soil health", query: lang === "hi" ? "मुझे मेरी मिट्टी के स्वास्थ्य के बारे में बताएं" : "Tell me about my soil health" },
  { label: lang === "hi" ? "💰 लाभ अनुमान" : "💰 Profit estimate", query: lang === "hi" ? "मैं इस मौसम में कितना लाभ कमा सकता हूं?" : "What profit can I expect this season?" },
];

const TOPICS = [
  { icon: "🌾", label: "Crops", color: "#4ade80" },
  { icon: "🧪", label: "Soil & Fertilizer", color: "#60a5fa" },
  { icon: "📈", label: "Market Prices", color: "#fbbf24" },
  { icon: "🌦️", label: "Weather", color: "#818cf8" },
  { icon: "🐛", label: "Pest Control", color: "#fb923c" },
  { icon: "🏛️", label: "Schemes", color: "#f472b6" },
];

const getInitialMsg = (lang, farmerName) => ({
  role: "ai",
  text: lang === "hi" 
    ? `🙏 **नमस्कार ${farmerName} भाई!**\n\nमैं स्मार्ट फार्म एआई हूं — आपका 24/7 कृषि सहायक!\n\nमैं हिंदी और इंग्लिश दोनों में बात कर सकता हूं। आप मुझसे पूछ सकते हैं:\n• 🌾 फसल सिफारिश\n• 🧪 उर्वरक और दवाई\n• 📈 लाइव मंडी के भाव\n• 🌦️ मौसम की जानकारी\n• 🏛️ सरकारी योजनाएं\n• 💰 लाभ की जानकारी\n\nबताएं आज आपकी कैसे मदद करूं? 😊`
    : `🙏 **Namaskar ${farmerName}!**\n\nI am Smart Farm AI — your 24/7 agriculture assistant!\n\nI can speak in both Hindi and English. You can ask me about:\n• 🌾 Crop recommendation\n• 🧪 Fertilizer and medicine\n• 📈 Live market prices\n• 🌦️ Weather information\n• 🏛️ Government schemes\n• 💰 Profit estimates\n\nHow can I help you today? 😊`,
  time: new Date(),
  id: 0
});

export default function ChatbotScreen() {
  const { lang, setLang } = useLang();
  const userData = JSON.parse(localStorage.getItem("smartfarm_user") || "{}");
  const farmerName = userData.name || "Farmer";

  const [messages, setMessages]   = useState([getInitialMsg(lang, farmerName)]);
  const [userLocation, setUserLocation] = useState("Detecting location...");
  const [farmData, setFarmData]   = useState({
    farmSize: "6.7",
    soilType: "Loamy",
    season: "Rabi",
    score: "86/100",
    primaryCrop: "Wheat"
  });

  useEffect(() => {
    const savedLocation = localStorage.getItem("smartfarm_location") 
      || localStorage.getItem("user_location") 
      || localStorage.getItem("detected_city");

    if (savedLocation) {
      setUserLocation(savedLocation);
    } else {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en");
              const data = await res.json();
              const city = data.city || data.locality || "Your Location";
              const state = data.principalSubdivision || "";
              const fullLocation = city + (state ? ", " + state : "");
              setUserLocation(fullLocation);
              localStorage.setItem("smartfarm_location", fullLocation);
            } catch (err) {
              setUserLocation("Pune, Maharashtra");
            }
          },
          () => setUserLocation("Pune, Maharashtra")
        );
      } else {
        setUserLocation("Pune, Maharashtra");
      }
    }
  }, []);

  useEffect(() => {
    const rawUser = JSON.parse(localStorage.getItem("smartfarm_user") || "{}");
    const month = new Date().getMonth();
    let currentSeason = "Rabi";
    if (month >= 5 && month <= 9) currentSeason = "Kharif";
    else if (month >= 2 && month <= 4) currentSeason = "Zaid";

    const sizeNum = parseFloat(rawUser.farmSize) || 0;
    let computedScore = "80/100";
    if (sizeNum > 50) computedScore = "88/100";
    else if (sizeNum >= 20) computedScore = "84/100";

    const baseScore = rawUser.soilScore || computedScore;
    const finalScore = String(baseScore).includes('/') ? baseScore : `${baseScore}/100`;

    setFarmData({
      farmSize: rawUser.farmSize || "6.7",
      soilType: rawUser.soilType || "Loamy",
      season: currentSeason,
      score: finalScore,
      primaryCrop: rawUser.primaryCrop || "Wheat"
    });
  }, []);
  const [input, setInput]         = useState("");
  // Removed local lang state to use global useLang hook
  const [typing, setTyping]       = useState(false);
  const [voiceActive, setVoice]   = useState(false);
  const [topic, setTopic]         = useState(null);
  const [sideOpen, setSideOpen]   = useState(true);
  const [msgId, setMsgId]         = useState(1);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    // ── HANDLE REDIRECT FROM MARKETPLACE (Negotiation) ───────────
    const redirectPrompt = localStorage.getItem("sfai_chat_redirect");
    if (redirectPrompt) {
      localStorage.removeItem("sfai_chat_redirect");
      // Wait a bit for the UI to settle then send
      setTimeout(() => send(redirectPrompt), 1000);
    }
  }, []);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput("");

    const userMsg = { role: "user", text: q, time: new Date(), id: msgId };
    setMsgId(n => n + 1);
    setMessages(m => [...m, userMsg]);
    setTyping(true);

    const isHindi = lang === "hi";
    const aiText = getLocalResponse(q, isHindi, userLocation);

    setTimeout(() => {
      setTyping(false);
      setMessages(m => [...m, { role: "ai", text: aiText, time: new Date(), id: msgId + 1 }]);
      setMsgId(n => n + 2);
    }, 1000);
  };

  const clearChat = () => { setMessages([getInitialMsg(lang, farmerName)]); setMsgId(1); };

  return (
    <div style={{ height: "100vh", background: "#06100c", display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans', 'Poppins', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #1a3d2b; border-radius: 10px; }
        .glass { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 18px; }
        .msg-ai { animation: msgIn .35s cubic-bezier(.4,0,.2,1) both; transform-origin: left; }
        .msg-user { animation: msgInR .3s cubic-bezier(.4,0,.2,1) both; transform-origin: right; }
        @keyframes msgIn { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes msgInR { from{opacity:0;transform:translateY(8px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes typingDot { 0%,80%,100%{transform:scale(1);opacity:.5} 40%{transform:scale(1.4);opacity:1} }
        .qr-chip { cursor: pointer; border: none; font-family: inherit; transition: all .2s; }
        .qr-chip:hover { transform: scale(1.04); opacity: .9; }
        .topic-chip { cursor: pointer; border: none; font-family: inherit; transition: all .2s; }
        .topic-chip:hover { transform: scale(1.06); }
        .send-btn:hover { transform: scale(1.08); filter: brightness(1.1); }
        .send-btn:active { transform: scale(.95); }
        .voice-ring { animation: voiceRing 1.2s ease-in-out infinite; }
        @keyframes voiceRing { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)} 50%{box-shadow:0 0 0 14px rgba(74,222,128,0)} }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        input:focus { outline: none; }
        .side-topic:hover { background: rgba(255,255,255,.06) !important; }
        .copy-btn:hover { opacity: 1 !important; }
        .fade-in { animation: fadeIn .4s ease both; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{ background: "rgba(6,16,12,.97)", borderBottom: "1px solid rgba(255,255,255,.07)", padding: "13px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, backdropFilter: "blur(10px)" }}>
        <button onClick={() => setSideOpen(o => !o)} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {sideOpen ? "◀" : "▶"}
        </button>

        {/* Avatar + name */}
        <div style={{ position: "relative" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "2px solid rgba(74,222,128,.4)" }}>🤖</div>
          <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", border: "2px solid #06100c" }} className="pulse" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "white" }}>Smart Farm AI</div>
          <div style={{ fontSize: 11, color: "#4ade80", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} className="pulse" />
            Online • Responds in seconds • Hindi & English
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Language toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, overflow: "hidden" }}>
            {["hi", "en"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "7px 14px", border: "none", background: lang === l ? "rgba(74,222,128,.2)" : "transparent", color: lang === l ? "#4ade80" : "rgba(255,255,255,.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {l === "hi" ? "🇮🇳 हिंदी" : "🌐 English"}
              </button>
            ))}
          </div>

          <button onClick={clearChat} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", color: "rgba(255,255,255,.4)", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑️ {lang === 'hi' ? 'साफ़ करें' : 'Clear'}</button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        {sideOpen && (
          <aside style={{ width: 260, borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto", flexShrink: 0 }}>
            {/* Farmer card */}
            <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ background: "linear-gradient(135deg,rgba(74,222,128,.12),rgba(22,163,74,.06))", border: "1px solid rgba(74,222,128,.2)", borderRadius: 16, padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👨‍🌾</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{farmerName}</div>
                    <div style={{ fontSize: 11, color: "#86efac" }}>📍 {userLocation}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    [lang === "hi" ? "🌾 खेत" : "🌾 Farm", `${farmData.farmSize} ${lang === "hi" ? "एकड़" : "Acres"}`],
                    [lang === "hi" ? "🧪 मिट्टी" : "🧪 Soil", farmData.soilType],
                    [lang === "hi" ? "🌱 मौसम" : "🌱 Season", farmData.season],
                    [lang === "hi" ? "📊 स्कोर" : "📊 Score", farmData.score],
                    [`${getCropEmoji(farmData.primaryCrop)} ${lang === "hi" ? "मुख्य फसल" : "Main Crop"}`, farmData.primaryCrop]
                  ].map(([l, v], i) => (
                    <div key={i} style={{ background: "rgba(0,0,0,.2)", borderRadius: 8, padding: "6px 8px" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>{l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.85)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ── MAIN CHAT ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

            {messages.map((msg, i) => (
              <div key={msg.id ?? i} className={msg.role === "ai" ? "msg-ai" : "msg-user"}
                style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 12, alignItems: "flex-start" }}>

                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: msg.role === "ai" ? "linear-gradient(135deg,#4ade80,#166534)" : "linear-gradient(135deg,#fbbf24,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: `2px solid ${msg.role === "ai" ? "rgba(74,222,128,.3)" : "rgba(251,191,36,.3)"}` }}>
                  {msg.role === "ai" ? "🤖" : "👨‍🌾"}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 4, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    background: msg.role === "ai"
                      ? "rgba(255,255,255,.05)"
                      : "linear-gradient(135deg,rgba(74,222,128,.25),rgba(22,163,74,.2))",
                    border: msg.role === "ai"
                      ? "1px solid rgba(255,255,255,.08)"
                      : "1px solid rgba(74,222,128,.3)",
                    borderRadius: msg.role === "ai" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                    padding: "14px 16px",
                    backdropFilter: "blur(8px)",
                  }}>
                    {msg.role === "ai" ? <MsgText text={msg.text} /> : (
                      <div style={{ fontSize: 14, color: "rgba(255,255,255,.9)", lineHeight: 1.5 }}>{msg.text}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", padding: "0 4px" }}>
                    {msg.time?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="msg-ai fade-in" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#166634)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "2px solid rgba(74,222,128,.3)" }}>🤖</div>
                <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "4px 18px 18px 18px", padding: "14px 18px" }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: "10px 28px 0", display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,.05)" }}>
            {getQuickReplies(lang).map((qr, i) => (
              <button key={i} className="qr-chip" onClick={() => send(qr.query)}
                style={{ padding: "7px 14px", borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 500 }}>
                {qr.label}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{ padding: "14px 24px 20px", display: "flex", gap: 10, alignItems: "flex-end" }}>
            {/* Voice button */}
            <button onClick={() => setVoice(v => !v)}
              style={{ width: 46, height: 46, borderRadius: "50%", background: voiceActive ? "rgba(74,222,128,.2)" : "rgba(255,255,255,.06)", border: `2px solid ${voiceActive ? "rgba(74,222,128,.5)" : "rgba(255,255,255,.1)"}`, color: voiceActive ? "#4ade80" : "rgba(255,255,255,.5)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
              className={voiceActive ? "voice-ring" : ""}>
              🎤
            </button>

            {/* Text input */}
            <div style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, transition: "border-color .2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(74,222,128,.4)"}
              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"}>
              <span style={{ fontSize: 16 }}>💬</span>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={lang === "hi" ? "Kuch bhi poochein — Hindi ya English mein..." : "Ask anything about farming..."}
                style={{ flex: 1, background: "none", border: "none", color: "white", fontSize: 14, fontFamily: "inherit" }}
              />
              {input && <button onClick={() => setInput("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,.3)", cursor: "pointer", fontSize: 16 }}>✕</button>}
            </div>

            {/* Photo upload */}
            <button style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "white"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}>
              📸
            </button>

            {/* Send */}
            <button onClick={() => send()} className="send-btn"
              style={{ width: 46, height: 46, borderRadius: "50%", background: input.trim() ? "linear-gradient(135deg,#22c55e,#15803d)" : "rgba(255,255,255,.06)", border: "none", color: input.trim() ? "white" : "rgba(255,255,255,.25)", fontSize: 20, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s", boxShadow: input.trim() ? "0 4px 15px rgba(34,197,94,.35)" : "none" }}>
              ➤
            </button>
          </div>

          {/* Bottom note */}
          <div style={{ textAlign: "center", padding: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,.2)" }}>
            {lang === "hi" ? "📚 ऑफ़लाइन मोड • कृषि ज्ञान कोष • 🔒 आपका डेटा निजी है" : "📚 Offline mode • Krishi Knowledge Base • 🔒 Your data is private"}
          </div>
        </div>
      </div>
    </div>
  );
}
