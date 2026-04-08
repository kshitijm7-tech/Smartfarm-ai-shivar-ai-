import { useState, createContext, useContext, useEffect } from "react";

// ── THEME CONTEXT ─────────────────────────────────────────────────
export const ThemeCtx = createContext({ dark: true, toggle: () => { } });
export const useTheme = () => useContext(ThemeCtx);

// ── CSS VARIABLES per theme ───────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#07100c",
    bgSoft: "#0d1f14",
    bgCard: "rgba(255,255,255,.04)",
    border: "rgba(255,255,255,.08)",
    borderSoft: "rgba(255,255,255,.05)",
    text: "#f0fdf4",
    textSub: "rgba(255,255,255,.55)",
    textMuted: "rgba(255,255,255,.3)",
    navBg: "linear-gradient(180deg,#0a2e1f 0%,#14532d 60%,#166534 100%)",
    navText: "#86efac",
    navActive: "rgba(255,255,255,.18)",
    topbar: "rgba(7,16,12,.95)",
    accent: "#4ade80",
    accentDark: "#15803d",
    accentGrad: "linear-gradient(135deg,#22c55e,#15803d)",
    cardHover: "rgba(74,222,128,.06)",
    shadow: "0 4px 24px rgba(0,0,0,.4)",
    inputBg: "rgba(255,255,255,.06)",
    inputBorder: "rgba(255,255,255,.1)",
    tag: "rgba(255,255,255,.07)",
    danger: "#f87171",
    warn: "#fbbf24",
    info: "#60a5fa",
  },
  light: {
    bg: "#f0fdf4",
    bgSoft: "#ffffff",
    bgCard: "#ffffff",
    border: "#d1fae5",
    borderSoft: "#e5e7eb",
    text: "#111827",
    textSub: "#4b5563",
    textMuted: "#9ca3af",
    navBg: "linear-gradient(180deg,#0a2e1f 0%,#14532d 60%,#166534 100%)",
    navText: "#86efac",
    navActive: "rgba(255,255,255,.18)",
    topbar: "#ffffff",
    accent: "#16a34a",
    accentDark: "#15803d",
    accentGrad: "linear-gradient(135deg,#22c55e,#15803d)",
    cardHover: "#f0fdf4",
    shadow: "0 4px 24px rgba(0,0,0,.08)",
    inputBg: "#f9fafb",
    inputBorder: "#e5e7eb",
    tag: "#f3f4f6",
    danger: "#dc2626",
    warn: "#d97706",
    info: "#2563eb",
  }
};

// ── SCREEN IMPORTS ────────────────────────────────────────────────
import LandingPage from "./SmartFarmLanding";
import Dashboard from "./SmartFarmDashboard";
import AIAnalyzer from "./SmartFarmAIAnalyzer";
import Marketplace from "./SmartFarmMarketplace";
import ProfitSimulator from "./SmartFarmProfitSimulator";
import ChatbotScreen from "./SmartFarmChatbot";
import AuthPage from "./SmartFarmAuth";
import SmartFarmLocator from "./SmartFarmLocator";
import SmartFarmHarvestPredictor from "./SmartFarmHarvestPredictor";
import SmartFarmTechniques from "./SmartFarmTechniques";

// ── LANGUAGE CONTEXT ──────────────────────────────────────────────
import { TRANSLATIONS } from "./translations";
export const LanguageCtx = createContext({ lang: "en", setLang: () => { } });
export const useLang = () => useContext(LanguageCtx);

// ── NAV ITEMS ─────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "📊", labelKey: "dashboard", shortKey: "dashboard" },
  { id: "locator", icon: "📍", labelKey: "locate", shortKey: "locate" },
  { id: "analyzer", icon: "🔬", labelKey: "analyzer", shortKey: "analyzer" },
  { id: "market", icon: "🛒", labelKey: "market", shortKey: "market" },
  { id: "profit", icon: "💰", labelKey: "profit", shortKey: "profit" },
  { id: "harvest",    icon: "📈", labelKey: "harvest_predictor", shortKey: "harvest" },
  { id: "techniques", icon: "🌱", labelKey: "techniques",        shortKey: "tech" },
  { id: "chat",       icon: "💬", labelKey: "chat",              shortKey: "chat" },
];

const SCREEN_MAP = {
  landing: LandingPage,
  dashboard: Dashboard,
  locator: SmartFarmLocator,
  analyzer: AIAnalyzer,
  market: Marketplace,
  profit: ProfitSimulator,
  harvest:     SmartFarmHarvestPredictor,
  techniques:  SmartFarmTechniques,
  chat:        ChatbotScreen,
  auth: AuthPage,
  login: AuthPage,
  register: AuthPage,
};

// ── THEME TOGGLE BUTTON ───────────────────────────────────────────
function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.07)",
        border: dark ? "1px solid rgba(255,255,255,.15)" : "1px solid rgba(0,0,0,.1)",
        borderRadius: 999, padding: "7px 14px",
        cursor: "pointer", transition: "all .25s", fontFamily: "inherit",
      }}>
      <div style={{
        width: 36, height: 20, borderRadius: 999,
        background: dark ? "#4ade80" : "#9ca3af",
        position: "relative", transition: "background .3s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: dark ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: "white", transition: "left .3s",
          boxShadow: "0 1px 4px rgba(0,0,0,.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9,
        }}>
          {dark ? "🌙" : "☀️"}
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: dark ? "#86efac" : "#6b7280", whiteSpace: "nowrap" }}>
        {dark ? "Dark" : "Light"}
      </span>
    </button>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────
function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const { dark } = useTheme();
  const { lang } = useLang();
  const t = dark ? THEMES.dark : THEMES.light;
  const s = TRANSLATIONS[lang];

  const user = JSON.parse(localStorage.getItem("sfai_user") || 'null') || { name: "Ramesh Patil", farmSize: "6.7" };
  const displayName = user.name || "Ramesh Patil";
  const displayAcres = user.farmSize || "6.7";

  return (
    <aside style={{
      width: collapsed ? 68 : 230,
      background: t.navBg,
      display: "flex", flexDirection: "column",
      transition: "width .3s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden", flexShrink: 0,
      boxShadow: "4px 0 20px rgba(0,0,0,.18)", zIndex: 30,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 14px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <img src="/logo.png" alt="SmartFarm AI" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: 16, whiteSpace: "nowrap" }}>Smart<span style={{ color: "#4ade80" }}>Farm</span></div>
            <div style={{ color: "#86efac", fontSize: 10, marginTop: -2 }}>{lang === "hi" ? "एआई प्लेटफार्म" : "AI Platform"}</div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft: "auto", background: "rgba(255,255,255,.1)", border: "none", color: "#86efac", borderRadius: 8, width: 26, height: 26, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Farmer mini profile */}
      {!collapsed && (
        <div style={{ margin: "12px 10px", background: "rgba(255,255,255,.08)", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👨‍🌾</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "white", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{displayName}</div>
            <div style={{ color: "#86efac", fontSize: 10 }}>Pune • {displayAcres} {s.acres}</div>
          </div>
        </div>
      )}
      {collapsed && (
        <div style={{ margin: "12px auto", width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👨‍🌾</div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: collapsed ? "11px 0" : "11px 13px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? "rgba(255,255,255,.18)" : "transparent",
                border: isActive ? "1px solid rgba(255,255,255,.12)" : "1px solid transparent",
                borderRadius: 13, cursor: "pointer", fontFamily: "inherit",
                transition: "all .2s",
                color: isActive ? "white" : "#86efac",
              }}
              onMouseOver={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,.08)"; }}
              onMouseOut={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap" }}>{s[item.labelKey]}</span>}
              {!collapsed && isActive && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* Theme toggle in sidebar */}
      <div style={{ padding: collapsed ? "12px 8px" : "12px 10px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        {collapsed ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ThemeToggle />
          </div>
        ) : (
          <ThemeToggle />
        )}
      </div>

      {/* Project badge */}
      {!collapsed && (
        <div style={{ padding: "0 10px 14px" }}>
          <div style={{ background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.25)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
            <div style={{ color: "#4ade80", fontSize: 11, fontWeight: 700 }}>🏆 Smart Farm AI Project</div>
            <div style={{ color: "#86efac", fontSize: 10, marginTop: 2 }}>Team Smart Farm AI</div>
          </div>
        </div>
      )}
    </aside>
  );
}
// ── PROFILE MODAL ────────────────────────────────────────────────
function ProfileModal({ isOpen, onClose }) {
  const { dark } = useTheme();
  const { lang } = useLang();
  const t = dark ? THEMES.dark : THEMES.light;
  const s = TRANSLATIONS[lang];
  if (!isOpen) return null;

  const user = JSON.parse(localStorage.getItem("sfai_user") || '{"name":"Farmer","phone":"+91 98XXX XXX00","farmSize":"5.0","crop":"Wheat"}');

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass fade-in" style={{ width: "100%", maxWidth: 450, background: t.bgSoft, border: `1px solid ${t.border}`, borderRadius: 28, padding: 32, position: "relative", boxShadow: t.shadow }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.05)", border: "none", color: t.text, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#15803d)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, border: "3px solid #4ade80" }}>👨‍🌾</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: t.text }}>{user.name}</h2>
          <p style={{ color: t.textSub, fontWeight: 600 }}>{s.farm_id}: SFAI-FT-{1000 + (user.farmer_id || 0)}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label: s.phone, value: user.phone, icon: "📞" },
            { label: s.farm_size, value: `${user.farmSize} ${s.acres}`, icon: "🌾" },
            { label: s.major_crop, value: user.crop, icon: "🌱" },
            { label: s.location, value: "Maharashtra", icon: "📍" }
          ].map((item, i) => (
            <div key={i} style={{ background: "rgba(0,0,0,.15)", borderRadius: 16, padding: 12, border: `1px solid ${t.borderSoft}` }}>
              <div style={{ fontSize: 11, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderRadius: 16, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.2)" }}>
          <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 800, marginBottom: 4 }}>✨ {s.ai_insights}:</div>
          <p style={{ fontSize: 11, color: t.textSub, lineHeight: 1.5 }}>{s.ai_desc}</p>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────
function SettingsModal({ isOpen, onClose }) {
  const { dark } = useTheme();
  const { lang, setLang } = useLang();
  const t = dark ? THEMES.dark : THEMES.light;
  const s = TRANSLATIONS[lang];
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="glass fade-in" style={{ width: "100%", maxWidth: 450, background: t.bgSoft, border: `1px solid ${t.border}`, borderRadius: 28, padding: 32, position: "relative", boxShadow: t.shadow }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.05)", border: "none", color: t.text, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: t.text, marginBottom: 24 }}>{s.system_settings}</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, color: t.text }}>{s.dark_mode}</div>
              <div style={{ fontSize: 12, color: t.textSub }}>Adjust the UI appearance</div>
            </div>
            <ThemeToggle />
          </div>
          <div style={{ height: 1, background: t.borderSoft }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, color: t.text }}>{s.language}</div>
              <div style={{ fontSize: 12, color: t.textSub }}>Change app interface language</div>
            </div>
            <div style={{ display: "flex", background: t.inputBg, borderRadius: 10, padding: 4 }}>
              <button onClick={() => setLang("en")} style={{ padding: "6px 12px", borderRadius: 8, background: lang === "en" ? "#16a34a" : "transparent", color: lang === "en" ? "white" : t.textMuted, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>English</button>
              <button onClick={() => setLang("hi")} style={{ padding: "6px 12px", borderRadius: 8, background: lang === "hi" ? "#16a34a" : "transparent", color: lang === "hi" ? "white" : t.textMuted, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Hindi</button>
            </div>
          </div>
          <div style={{ height: 1, background: t.borderSoft }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, color: t.text }}>{s.push_notif}</div>
              <div style={{ fontSize: 12, color: t.textSub }}>Real-time farm alerts</div>
            </div>
            <div style={{ width: 44, height: 24, borderRadius: 12, background: "#16a34a", position: "relative", cursor: "pointer" }}>
              <div style={{ position: "absolute", right: 2, top: 2, width: 20, height: 20, borderRadius: "50%", background: "white" }} />
            </div>
          </div>
        </div>
        
        <button onClick={onClose} style={{ width: "100%", marginTop: 32, padding: "14px", borderRadius: 16, background: "linear-gradient(135deg,#22c55e,#15803d)", color: "white", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>{s.save_prefs}</button>
      </div>
    </div>
  );
}

// ── TOP BAR ───────────────────────────────────────────────────────
function TopBar({ active, setActive }) {
  const { dark } = useTheme();
  const { lang } = useLang();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      icon: "🌧️",
      title: "Heavy Rain Alert",
      desc: "Heavy rain expected tomorrow. Avoid fertilizer spray today.",
      time: "Just now",
      bg: "#eff6ff",
      iconBg: "#bfdbfe"
    },
    {
      id: 2,
      icon: "🌱",
      title: "Crop Advisory",
      desc: "April season active. Monitor your crop for pest attacks regularly.",
      time: "1h ago",
      bg: "#f0fdf4",
      iconBg: "#bbf7d0"
    },
    {
      id: 3,
      icon: "📈",
      title: "Mandi Price Update",
      desc: "Crop prices active in your region. Check marketplace for best rates.",
      time: "3h ago",
      bg: "#fefce8",
      iconBg: "#fef08a"
    },
    {
      id: 4,
      icon: "🏛️",
      title: "PM-KISAN Update",
      desc: "Check your PM-KISAN payment status at pmkisan.gov.in this month.",
      time: "5h ago",
      bg: "#fdf4ff",
      iconBg: "#e9d5ff"
    }
  ]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude
            const lon = pos.coords.longitude
            const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true&daily=precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2"
            const res = await fetch(url)
            const data = await res.json()
            
            const currentCode = data.current_weather.weathercode
            const currentTemp = data.current_weather.temperature
            const tomorrowRain = data.daily.precipitation_sum[1]
            const tomorrowCode = data.daily.weathercode[1]
            const tomorrowMaxTemp = data.daily.temperature_2m_max[1]

            let weatherNotif = {}

            if (currentCode === 0 || currentCode === 1) {
              weatherNotif = {
                id: 1,
                icon: "☀️",
                title: "Clear Weather Today",
                desc: "Sunny conditions at " + currentTemp + "°C. Perfect time for field work and spraying.",
                time: "Just now",
                bg: "#fefce8",
                iconBg: "#fef08a"
              }
            } else if (currentCode === 2 || currentCode === 3) {
              weatherNotif = {
                id: 1,
                icon: "⛅",
                title: "Cloudy Weather Today",
                desc: "Partly cloudy at " + currentTemp + "°C. Good conditions for irrigation and light field work.",
                time: "Just now",
                bg: "#f9fafb",
                iconBg: "#e5e7eb"
              }
            } else if (currentCode >= 51 && currentCode <= 67) {
              weatherNotif = {
                id: 1,
                icon: "🌧️",
                title: "Rain Alert Today",
                desc: "Rain detected at " + currentTemp + "°C. Avoid fertilizer and pesticide spray today.",
                time: "Just now",
                bg: "#eff6ff",
                iconBg: "#bfdbfe"
              }
            } else if (currentCode >= 80 && currentCode <= 82) {
              weatherNotif = {
                id: 1,
                icon: "🌦️",
                title: "Rain Showers Today",
                desc: "Shower conditions. Delay any spray applications until weather clears.",
                time: "Just now",
                bg: "#eff6ff",
                iconBg: "#bfdbfe"
              }
            } else if (currentCode >= 95) {
              weatherNotif = {
                id: 1,
                icon: "⛈️",
                title: "Thunderstorm Alert",
                desc: "Thunderstorm conditions. Stay indoors. Secure your farm equipment immediately.",
                time: "Just now",
                bg: "#fef2f2",
                iconBg: "#fecaca"
              }
            } else if (currentTemp > 38) {
              weatherNotif = {
                id: 1,
                icon: "🌡️",
                title: "Heat Stress Alert",
                desc: "Extreme heat at " + currentTemp + "°C. Water your crops early morning and evening.",
                time: "Just now",
                bg: "#fff7ed",
                iconBg: "#fed7aa"
              }
            } else {
              weatherNotif = {
                id: 1,
                icon: "🌤️",
                title: "Weather Update",
                desc: "Current temperature " + currentTemp + "°C. Monitor your crops as usual today.",
                time: "Just now",
                bg: "#f0fdf4",
                iconBg: "#bbf7d0"
              }
            }

            setNotifications(prev => [weatherNotif, ...prev.slice(1)])

          } catch (err) {
            console.log("Weather notification fetch failed", err)
          }
        },
        () => {
          console.log("Location denied for notifications")
        }
      )
    }
  }, [])
  
  const t = dark ? THEMES.dark : THEMES.light;
  const s = TRANSLATIONS[lang];
  const current = NAV.find(n => n.id === active);

  const user = JSON.parse(localStorage.getItem("sfai_user") || '{"name":"Farmer","phone":"+91 98XXX XXX00"}');

  const handleLogout = () => {
    localStorage.removeItem("sfai_user");
    localStorage.removeItem("sfai_latest_analysis");
    setActive("auth");
  };

  // Close popups on click outside
  useEffect(() => {
    const close = () => { setShowNotif(false); setShowProfile(false); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <header style={{
      height: 58, background: t.topbar,
      borderBottom: `1px solid ${t.borderSoft}`,
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16, flexShrink: 0,
      boxShadow: dark ? "0 1px 0 rgba(255,255,255,.04)" : "0 1px 6px rgba(0,0,0,.06)",
      zIndex: 20, position: "relative",
    }}>
      {/* Modals */}
      <ProfileModal isOpen={openProfile} onClose={() => setOpenProfile(false)} />
      <SettingsModal isOpen={openSettings} onClose={() => setOpenSettings(false)} />

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{current?.icon}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{current ? s[current.labelKey] : ""}</span>
        <span style={{ color: t.textMuted, fontSize: 13 }}>{s.topbar_suffix}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Theme toggle in topbar */}
      <ThemeToggle />

      {/* Notification */}
      <div style={{ position: "relative" }}>
        <button onClick={(e) => { e.stopPropagation(); setShowNotif(!showNotif); setShowProfile(false); }} 
          style={{ background: dark ? "rgba(255,255,255,.06)" : "#fee2e2", border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "#fecaca"}`, borderRadius: 10, width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</button>
        <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#ef4444", borderRadius: "50%", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + t.topbar }}>4</span>
        
        {showNotif && (
          <div onClick={(e) => e.stopPropagation()} style={{position:"absolute", top:60, right:0, width:340, background:"white", borderRadius:16, boxShadow:"0 8px 30px rgba(0,0,0,.12)", zIndex:100, overflow:"hidden"}}>
            <div style={{padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontWeight:700, fontSize:16}}>Notifications</span>
              <span style={{fontSize:12, color:"#16a34a", cursor:"pointer", fontWeight:600}}>Mark all read</span>
            </div>
            {notifications.map(n => (
              <div key={n.id} style={{display:"flex", gap:12, padding:"14px 20px", background:n.bg, borderBottom:"1px solid #f3f4f6", alignItems:"flex-start"}}>
                <div style={{width:38, height:38, borderRadius:"50%", background:n.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0}}>
                  {n.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, fontSize:13, color:"#111827", marginBottom:3}}>{n.title}</div>
                  <div style={{fontSize:12, color:"#6b7280", lineHeight:1.5}}>{n.desc}</div>
                  <div style={{fontSize:11, color:"#9ca3af", marginTop:4}}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div style={{ position: "relative" }}>
        <div onClick={(e) => { e.stopPropagation(); setShowProfile(!showProfile); setShowNotif(false); }} 
          style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#15803d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", border: `2px solid ${showProfile ? t.accent : "transparent"}` }}>👨‍🌾</div>
        
        {showProfile && (
          <div className="glass fade-in" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 48, right: 0, width: 240, background: t.bgSoft, border: `1px solid ${t.border}`, borderRadius: 18, padding: 20, boxShadow: t.shadow, zIndex: 100 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#15803d)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👨‍🌾</div>
              <div style={{ fontWeight: 800, color: t.text, fontSize: 16 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: t.textSub }}>{user.phone}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={() => { setOpenProfile(true); setShowProfile(false); }} style={{ padding: "10px 12px", borderRadius: 12, background: "transparent", border: "none", color: t.text, textAlign: "left", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }} className="side-topic">👤 {s.my_profile}</button>
              <button onClick={() => { setOpenSettings(true); setShowProfile(false); }} style={{ padding: "10px 12px", borderRadius: 12, background: "transparent", border: "none", color: t.text, textAlign: "left", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }} className="side-topic">⚙️ {s.settings}</button>
              <div style={{ height: 1, background: t.border, margin: "8px 0" }} />
              <button onClick={handleLogout} style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(239,68,68,.1)", border: "none", color: "#ef4444", textAlign: "left", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>🚪 {s.logout}</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ── BOTTOM NAV (mobile) ───────────────────────────────────────────
function BottomNav({ active, setActive }) {
  const { dark } = useTheme();
  const t = dark ? THEMES.dark : THEMES.light;
  return (
    <nav style={{
      display: "flex", background: t.topbar,
      borderTop: `1px solid ${t.borderSoft}`,
      boxShadow: dark ? "0 -2px 20px rgba(0,0,0,.3)" : "0 -2px 12px rgba(0,0,0,.06)",
    }}>
      {NAV.map(n => (
        <button key={n.id} onClick={() => setActive(n.id)}
          style={{
            flex: 1, padding: "10px 4px 8px", border: "none",
            background: active === n.id ? (dark ? "rgba(74,222,128,.1)" : "#f0fdf4") : "transparent",
            borderTop: `2px solid ${active === n.id ? t.accent : "transparent"}`,
            cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, transition: "all .15s",
          }}>
          <span style={{ fontSize: 20 }}>{n.icon}</span>
          <span style={{ fontSize: 9, fontWeight: active === n.id ? 800 : 500, color: active === n.id ? t.accent : t.textMuted }}>{n.short}</span>
        </button>
      ))}
    </nav>
  );
}

// ── SPLASH SCREEN ─────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const { lang } = useLang();
  const s = TRANSLATIONS[lang];
  const [step, setStep] = useState(0);
  useEffect(() => {
    // Cinematic, slow pacing to enjoy the artwork
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(() => setStep(3), 3200);
    const t4 = setTimeout(() => onDone(), 5500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  const particles = Array.from({ length: 100 }); // Double the particles for magic feel

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", backgroundColor: "#022c22", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, fontFamily: "inherit" }}>
      <style>{`
        /* Cinematic Image Zoom (Ken Burns) */
        .cinematic-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: cinematicZoom 8s cubic-bezier(0.2, 0.8, 0.2, 1) both; filter: brightness(0.65) contrast(1.1); z-index: 1; pointer-events: none; }
        @keyframes cinematicZoom { 0% { transform: scale(1.1); filter: brightness(0); } 100% { transform: scale(1); filter: brightness(0.7) contrast(1.1); } }
        
        /* Dramatic Vignette */
        .vignette { position: absolute; inset: 0; box-shadow: inset 0 0 350px rgba(0,0,0,0.9); pointer-events: none; z-index: 2; }
        
        /* Particles */
        @keyframes floatUp { 0% { transform: translateY(100vh) scale(0); opacity: 0; } 10% { opacity: 0.8; } 90% { opacity: 0.8; } 100% { transform: translateY(-20vh) scale(1); opacity: 0; } }

        /* UI Elements Layer */
        .ui-layer { position: absolute; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; width: 100%; height: 100%; padding: 8vh 0; box-sizing: border-box; }
        
        .epic-title { animation: titleEnter 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; display: flex; justify-content: center; width: 100%; }
        @keyframes titleEnter { 0% { opacity: 0; transform: translateY(-40px) scale(0.95); filter: blur(10px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); } }
        
        .epic-subtitle { animation: subEnter 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) both 0.6s; width: 100%; text-align: center; }
        @keyframes subEnter { 0% { opacity: 0; transform: translateY(20px); filter: blur(5px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0px); } }

        .epic-bar-container { animation: barEnter 1s ease both 0.8s; margin: 0 auto; }
        @keyframes barEnter { 0% { opacity: 0; width: 0; } 100% { opacity: 1; width: 320px; } }
        
        .epic-bar-fill { animation: barFill 4s cubic-bezier(0.4, 0, 0.2, 1) both 1.2s; }
        @keyframes barFill { 0% { width: 0%; box-shadow: 0 0 0 transparent; } 80% { width: 90%; box-shadow: 0 0 20px #4ade80; } 100% { width: 100%; box-shadow: 0 0 30px #4ade80, 0 0 60px rgba(74,222,128,0.5); background: #86efac; } }
      `}</style>

      {/* Background Image Layer */}
      <img src="/splash_bg.png" className="cinematic-bg" alt="SmartFarm AI" />
      <div className="vignette" />

      {/* Floating Sparkle Particles */}
      {particles.map((_, i) => {
        const left = Math.random() * 100;
        const size = Math.random() * 4 + 1;
        const delay = Math.random() * 5;
        const dur = Math.random() * 6 + 4;
        const isGold = Math.random() > 0.4;
        return (
          <div key={`part-${i}`} style={{
            position: "absolute", left: `${left}%`, bottom: 0,
            width: size, height: size, borderRadius: "50%",
            background: isGold ? "rgba(254, 240, 138, 0.8)" : "rgba(134, 239, 172, 0.8)",
            boxShadow: `0 0 ${size * 3}px ${isGold ? "rgba(250, 204, 21, 0.9)" : "rgba(74, 222, 128, 0.9)"}`,
            animation: `floatUp ${dur}s linear infinite ${delay}s`,
            zIndex: 5, pointerEvents: "none"
          }} />
        );
      })}

      {/* Main UI Layer */}
      <div className="ui-layer">

        {/* Top Text Cluster */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "6vh", width: "100%" }}>
          {step >= 0 && (
            <div className="epic-title" style={{ flexDirection: "column", alignItems: "center", gap: 20 }}>
              <img src="/logo.png" alt="SmartFarm AI Splash" style={{ width: 120, height: 120, borderRadius: "25%", objectFit: "cover", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
              <span style={{ color: "white", fontSize: "5.5rem", fontWeight: 900, letterSpacing: "-2px", textShadow: "0 10px 40px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)" }}>
                Smart<span style={{ color: "#4ade80", textShadow: "0 0 40px rgba(74,222,128,0.6), 0 10px 40px rgba(0,0,0,0.9)" }}>Farm</span> AI
              </span>
            </div>
          )}

          {step >= 1 && (
            <>
              <div className="epic-subtitle" style={{ color: "#d1fae5", fontSize: "1.3rem", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", marginTop: 12, textShadow: "0 4px 15px rgba(0,0,0,0.9)" }}>
                {s.splash_subtitle}
              </div>
              <div className="epic-subtitle" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase", marginTop: 24, display: "flex", justifyContent: "center", gap: "2rem", textShadow: "0 2px 10px rgba(0,0,0,0.8)", flexWrap: "wrap", padding: "0 20px" }}>
                {s.splash_nodes.split("•").map((node, idx) => (
                  <span key={idx}>{node.trim()}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Loading Bar Cluster */}
        {step >= 2 && (
          <div style={{ paddingBottom: "4vh", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div className="epic-bar-container" style={{ height: 4, background: "rgba(0,0,0,0.6)", borderRadius: 999, overflow: "hidden", display: "flex", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5)" }}>
              <div className="epic-bar-fill" style={{ height: "100%", background: "linear-gradient(90deg, #15803d, #4ade80)", borderRadius: 999 }} />
            </div>
            <div className="epic-subtitle" style={{ color: "#86efac", fontSize: "0.85rem", letterSpacing: "4px", textTransform: "uppercase", marginTop: 20, fontWeight: 800, animation: "pulse 2s infinite" }}>
              {s.splash_init}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "3vh", color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 700 }}>
          {s.hackathon_footer}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");
  const [active, setActive] = useState("landing");
  const [collapsed, setCollapsed] = useState(false);
  const [splash, setSplash] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Export setActive globally for inner component navigation (Quick Actions)
  useEffect(() => {
    window.setActiveScreen = setActive;
  }, [setActive]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Persist theme & language
  useEffect(() => {
    localStorage.setItem("sfai_theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    localStorage.setItem("sfai_lang", lang);
  }, [lang]);

  useEffect(() => {
    // Initial load from storage
    const savedTheme = localStorage.getItem("sfai_theme");
    const savedLang = localStorage.getItem("sfai_lang");
    if (savedTheme === "dark") setDark(true);
    if (savedLang) setLang(savedLang);
    
    // Always start with light theme if first time or cleared (Hackathon special)
    // Removed clearing for persistence
  }, []);

  const t = dark ? THEMES.dark : THEMES.light;
  const ActiveScreen = SCREEN_MAP[active] || LandingPage;

  if (splash) return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <LanguageCtx.Provider value={{ lang, setLang }}>
        <SplashScreen onDone={() => setSplash(false)} />
      </LanguageCtx.Provider>
    </ThemeCtx.Provider>
  );

  // ── LANDING & AUTH (full screen, no sidebar) ─────────────────────────
  if (active === "landing" || active === "auth" || active === "login" || active === "register") {
    return (
      <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
        <LanguageCtx.Provider value={{ lang, setLang }}>
          <div style={{ minHeight: "100vh", width: "100%", fontFamily: "'Poppins', sans-serif", position: "relative", overflowX: "hidden" }}>
            <ActiveScreen setActive={setActive} active={active} />
          </div>
        </LanguageCtx.Provider>
      </ThemeCtx.Provider>
    );
  }

  // ── MAIN APP SHELL ─────────────────────────────────────────────
  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      <LanguageCtx.Provider value={{ lang, setLang }}>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: t.bg, fontFamily: "'Poppins', sans-serif", overflow: "hidden" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; transition: background-color .25s, border-color .25s, color .2s; }
            ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${dark ? "#1a3d2b" : "#bbf7d0"}; border-radius: 10px; }
            body { margin: 0; }
            .glass { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
            .fade-in { animation: modalFade .3s ease-out; }
            @keyframes modalFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>

          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Sidebar (desktop only) */}
            {!isMobile && (
              <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} />
            )}

            {/* Main content column */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
              {/* Top bar */}
              <TopBar active={active} setActive={setActive} />

              {/* Active screen */}
              <div data-theme={dark ? "dark" : "light"} style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                <ActiveScreen />
              </div>

              {/* Bottom nav (mobile only) */}
              {isMobile && <BottomNav active={active} setActive={setActive} />}
            </div>
          </div>
        </div>
      </LanguageCtx.Provider>
    </ThemeCtx.Provider>
  );
}
