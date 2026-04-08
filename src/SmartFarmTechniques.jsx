import { useState, useEffect, useRef } from "react";
import { useTheme } from "./App";
import { motion, AnimatePresence } from "framer-motion";

/* ─── CATEGORY CONFIG ──────────────────────────────────────── */
const CAT_CONFIG = {
  "Soil Health":        { color: "#92400e", bg: "#fef3c7", light: "#fffbeb",   icon: "🪨" },
  "Water Management":   { color: "#1e40af", bg: "#dbeafe", light: "#eff6ff",   icon: "💧" },
  "Pest Control":       { color: "#991b1b", bg: "#fee2e2", light: "#fef2f2",   icon: "🐛" },
  "Crop Rotation":      { color: "#6b21a8", bg: "#f3e8ff", light: "#faf5ff",   icon: "🔄" },
  "Fertilization":      { color: "#854d0e", bg: "#fef9c3", light: "#fefce8",   icon: "🌿" },
  "Climate Adaptation": { color: "#0f766e", bg: "#ccfbf1", light: "#f0fdfa",   icon: "🌤️" },
  "Harvesting":         { color: "#c2410c", bg: "#ffedd5", light: "#fff7ed",   icon: "🌾" },
  "Post-Harvest":       { color: "#374151", bg: "#f3f4f6", light: "#f9fafb",   icon: "📦" },
};

const DIFFICULTY_COLORS = {
  "Easy":     { bg: "#dcfce7", color: "#15803d" },
  "Medium":   { bg: "#fef3c7", color: "#92400e" },
  "Advanced": { bg: "#fee2e2", color: "#dc2626" },
};

const IMPACT_COLORS = {
  "High":   { bg: "#bbf7d0", color: "#166534" },
  "Medium": { bg: "#fed7aa", color: "#9a3412" },
  "Low":    { bg: "#e5e7eb", color: "#374151" },
};

const LOADING_STEPS = [
  "📍 Detecting your location context...",
  "🌾 Analysing your crops and soil...",
  "🤖 Generating personalised techniques...",
  "✅ Ready!",
];

/* ─── DETECT SEASON ────────────────────────────────────────── */
function detectSeason(month) {
  if (month >= 6 && month <= 10) return "Kharif";
  if (month >= 11 || month <= 3) return "Rabi";
  return "Zaid";
}

/* ─── TECHNIQUE CARD ───────────────────────────────────────── */
function TechniqueCard({ t, dark, expanded, onToggle }) {
  const catCfg = CAT_CONFIG[t.category] || CAT_CONFIG["Soil Health"];
  const card = dark ? "rgba(255,255,255,.05)" : "white";
  const border = dark ? "rgba(255,255,255,.1)" : "#e5e7eb";
  const txt = dark ? "#f0fdf4" : "#111827";
  const sub = dark ? "#9ca3af" : "#6b7280";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 20, overflow: "hidden",
        boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,.06)",
        transition: "all .25s",
      }}>
      {/* Card top accent */}
      <div style={{ height: 4, background: catCfg.color, opacity: .8 }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <span style={{ ...BADGE, background: catCfg.bg, color: catCfg.color }}>
            {catCfg.icon} {t.category}
          </span>
          <span style={{ ...BADGE, ...DIFFICULTY_COLORS[t.difficulty] }}>
            {t.difficulty}
          </span>
          <span style={{ ...BADGE, ...IMPACT_COLORS[t.impact] }}>
            ⚡ {t.impact} Impact
          </span>
        </div>

        {/* Title */}
        <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 800, color: txt }}>{t.title}</h3>

        {/* Local context — the hyper-local sentence */}
        <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "#16a34a", fontStyle: "italic", lineHeight: 1.5 }}>
          📍 {t.local_context}
        </p>

        {/* Description */}
        <p style={{ margin: "0 0 12px 0", fontSize: 13, color: sub, lineHeight: 1.6,
          overflow: expanded ? "visible" : "hidden",
          display: expanded ? "block" : "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : 2,
          WebkitBoxOrient: "vertical",
        }}>
          {t.description}
        </p>

        {/* Materials */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {t.materials_needed.map((m, i) => (
            <span key={i} style={{ background: dark ? "#1f2937" : "#f3f4f6", color: sub, fontSize: 11, padding: "3px 9px", borderRadius: 999, fontWeight: 500 }}>
              {m}
            </span>
          ))}
        </div>

        {/* Expected Benefit */}
        <div style={{ background: dark ? "rgba(34,197,94,.12)" : "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>{t.expected_benefit}</span>
        </div>

        {/* Best Time */}
        <div style={{ fontSize: 12, color: sub, marginBottom: 10 }}>
          ⏰ <b style={{ color: txt }}>Best Time:</b> {t.best_time}
        </div>

        {/* Warning */}
        {t.warning && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#9a3412" }}>
            ⚠️ {t.warning}
          </div>
        )}

        <button onClick={onToggle} style={{
          background: "transparent", border: `1px solid ${border}`, color: "#22c55e",
          padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12,
          fontFamily: "inherit", width: "100%", transition: "all .2s",
        }}>
          {expanded ? "▲ Show Less" : "▼ Read More"}
        </button>
      </div>
    </motion.div>
  );
}

const BADGE = { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 };

/* ─── FEATURED TECHNIQUE ────────────────────────────────────── */
function FeaturedCard({ t, dark }) {
  const catCfg = CAT_CONFIG[t.category] || CAT_CONFIG["Soil Health"];
  const sub = dark ? "#9ca3af" : "#6b7280";

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: dark ? "rgba(255,255,255,.05)" : "white",
        border: `2px solid ${catCfg.color}44`,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: `0 8px 32px rgba(0,0,0,${dark ? ".2" : ".08"})`,
        marginBottom: 24,
      }}>
      <div style={{ background: `linear-gradient(135deg,${catCfg.color}22,${catCfg.color}08)`, padding: "22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ background: "#dc2626", color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 800, animation: "riskPulse 2s infinite" }}>
                ⚡ Most Urgent Right Now
              </span>
              <span style={{ ...BADGE, background: catCfg.bg, color: catCfg.color }}>{catCfg.icon} {t.category}</span>
            </div>

            <h2 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 900, color: dark ? "#f0fdf4" : "#111827", margin: "0 0 10px 0" }}>{t.title}</h2>

            <p style={{ fontSize: 14, color: "#16a34a", fontStyle: "italic", margin: "0 0 12px 0", lineHeight: 1.5 }}>
              📍 {t.local_context}
            </p>

            <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, margin: "0 0 16px 0" }}>{t.description}</p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "8px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>EXPECTED BENEFIT</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#15803d" }}>🎯 {t.expected_benefit}</div>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "8px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>BEST TIME</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e40af" }}>⏰ {t.best_time}</div>
              </div>
              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 14px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>TIME TO IMPLEMENT</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e" }}>🕐 {t.time_to_implement}</div>
              </div>
            </div>
          </div>

          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sub, marginBottom: 8, letterSpacing: 1 }}>MATERIALS NEEDED</div>
            {t.materials_needed.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: catCfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: dark ? "#d1fae5" : "#374151" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
export default function SmartFarmTechniques() {
  const { dark } = useTheme();

  const [loading, setLoading]         = useState(false);
  const [loadStep, setLoadStep]       = useState(0);
  const [techniques, setTechniques]   = useState([]);
  const [featured, setFeatured]       = useState(null);
  const [context, setContext]         = useState(null);
  const [expandedId, setExpandedId]   = useState(null);

  // Filters
  const [catFilter, setCatFilter]     = useState("All");
  const [diffFilter, setDiffFilter]   = useState("All");
  const [impactFilter, setImpact]     = useState("All");

  const bg     = dark ? "#0f1a14" : "#f0fdf4";
  const card   = dark ? "rgba(255,255,255,.05)" : "white";
  const border = dark ? "rgba(255,255,255,.1)"  : "#e5e7eb";
  const txt    = dark ? "#f0fdf4" : "#111827";
  const sub    = dark ? "#9ca3af" : "#6b7280";

  /* ── Build farmer context from localStorage ── */
  const buildContext = () => {
    const user     = JSON.parse(localStorage.getItem("sfai_user")  || '{}');
    const crops_raw = JSON.parse(localStorage.getItem("smartfarm_crops") || '[]');
    const month    = new Date().getMonth() + 1;

    return {
      district:      user.district || user.location || "Pune",
      soil_type:     user.soilType || "Loamy",
      season:        detectSeason(month),
      crops:         crops_raw.length > 0 ? crops_raw.map(c => c.name) : [user.primaryCrop || "Wheat"],
      farm_size:     parseFloat(user.farmSize || "5"),
      farmer_name:   user.name || "Ramesh",
      current_month: month,
    };
  };

  const fetchTechniques = async () => {
    setLoading(true);
    setLoadStep(0);
    setTechniques([]);
    setFeatured(null);

    const ctx = buildContext();
    setContext(ctx);

    // Loading animation steps
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      setLoadStep(step);
      if (step >= LOADING_STEPS.length - 1) clearInterval(stepInterval);
    }, 700);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/farming-techniques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctx),
      });
      const data = await res.json();
      clearInterval(stepInterval);
      setTechniques(data.techniques || []);
      setFeatured(data.featured || null);
    } catch (_) {
      // Offline fallback — embed 3 preview cards
      clearInterval(stepInterval);
      setTechniques([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTechniques(); }, []);

  const cats = ["All", ...Object.keys(CAT_CONFIG)];
  const difficulties = ["All", "Easy", "Medium", "Advanced"];
  const impacts = ["All", "High", "Medium", "Low"];

  const filtered = techniques.filter(t =>
    (catFilter   === "All" || t.category   === catFilter) &&
    (diffFilter  === "All" || t.difficulty === diffFilter) &&
    (impactFilter === "All" || t.impact     === impactFilter)
  );

  const seasonEmoji = { Kharif: "☔", Rabi: "🌤️", Zaid: "☀️" };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: bg, fontFamily: "'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
        @keyframes riskPulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)} 50%{box-shadow:0 0 0 8px rgba(220,38,38,0)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #22c55e44; border-radius: 10px; }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <div style={{
        background: "linear-gradient(270deg,#14532d,#166534,#15803d,#4d7c0f)",
        backgroundSize: "300% 300%", animation: "wheatSway 12s ease infinite",
        padding: "36px 32px 32px", position: "relative" }}>
        <style>{`@keyframes wheatSway { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }`}</style>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ color: "#86efac", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
            AI-CURATED FARMING INTELLIGENCE
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, margin: "0 0 8px 0" }}>
            Smart Farming Techniques 🌱
          </h1>
          {context && (
            <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14, margin: "0 0 20px 0" }}>
              Personalised for {context.farmer_name} • {context.district}, Maharashtra • {context.season} Season
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {context && [
              { icon: "📍", label: context.district },
              { icon: seasonEmoji[context.season] || "🌦️", label: `${context.season} Season` },
              { icon: "🪨", label: context.soil_type + " Soil" },
            ].map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 50, padding: "6px 16px", color: "white", fontSize: 13, fontWeight: 600 }}>
                {b.icon} {b.label}
              </div>
            ))}
          </div>
        </motion.div>

        <button onClick={fetchTechniques} style={{
          position: "absolute", top: 20, right: 24,
          background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.35)",
          color: "white", padding: "9px 18px", borderRadius: 12,
          cursor: "pointer", fontWeight: 800, fontSize: 13, fontFamily: "inherit",
        }}>
          🔄 Regenerate Techniques
        </button>
      </div>

      <div style={{ padding: "24px" }}>

        {/* ══ LOADING STATE ═══════════════════════════════════════ */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "48px 32px", textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320, margin: "0 auto" }}>
                {LOADING_STEPS.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= loadStep ? 1 : 0.25, x: 0 }} transition={{ delay: i * 0.1 }}
                    style={{ fontSize: 14, color: i <= loadStep ? "#22c55e" : sub, fontWeight: i <= loadStep ? 700 : 400 }}>
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ FEATURED ════════════════════════════════════════════ */}
        {!loading && featured && <FeaturedCard t={featured} dark={dark} />}

        {/* ══ FILTER BAR ══════════════════════════════════════════ */}
        {!loading && techniques.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {/* Category filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: "7px 14px", borderRadius: 999, border: "none",
                  background: catFilter === c ? "#22c55e" : (dark ? "#1f2937" : "#f3f4f6"),
                  color: catFilter === c ? "white" : sub,
                  fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                }}>
                  {c === "All" ? "🌐 All" : `${CAT_CONFIG[c]?.icon} ${c}`}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontSize: 12, color: sub, alignSelf: "center", marginRight: 4 }}>Difficulty:</span>
                {difficulties.map(d => (
                  <button key={d} onClick={() => setDiffFilter(d)} style={{
                    padding: "5px 12px", borderRadius: 999, border: "none",
                    background: diffFilter === d ? "#6366f1" : (dark ? "#1f2937" : "#f3f4f6"),
                    color: diffFilter === d ? "white" : sub,
                    fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}>{d}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ fontSize: 12, color: sub, alignSelf: "center", marginRight: 4 }}>Impact:</span>
                {impacts.map(im => (
                  <button key={im} onClick={() => setImpact(im)} style={{
                    padding: "5px 12px", borderRadius: 999, border: "none",
                    background: impactFilter === im ? "#f59e0b" : (dark ? "#1f2937" : "#f3f4f6"),
                    color: impactFilter === im ? "white" : sub,
                    fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}>{im}</button>
                ))}
              </div>
              <span style={{ fontSize: 13, color: sub, marginLeft: "auto" }}>
                Showing <b style={{ color: txt }}>{filtered.length}</b> of {techniques.length} techniques
              </span>
            </div>
          </div>
        )}

        {/* ══ GRID ════════════════════════════════════════════════ */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
            {filtered.map(t => (
              <TechniqueCard
                key={t.id} t={t} dark={dark}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              />
            ))}
            {filtered.length === 0 && !loading && techniques.length > 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: sub }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                No techniques match the selected filters. Try "All" to reset.
              </div>
            )}
            {techniques.length === 0 && !loading && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                <div style={{ fontWeight: 700, color: txt, fontSize: 16, marginBottom: 8 }}>Backend offline</div>
                <div style={{ color: sub }}>Start the Flask backend and refresh to load AI-generated techniques.</div>
                <button onClick={fetchTechniques} style={{ marginTop: 16, background: "#22c55e", color: "white", border: "none", padding: "10px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
                  🔄 Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
