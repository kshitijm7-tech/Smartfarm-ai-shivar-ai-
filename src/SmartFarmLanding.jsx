import { useState, useEffect, useRef } from "react";
import { useLang } from "./App";
import { TRANSLATIONS } from "./translations";

// --- Advanced FadeIn with Direction ---
function FadeIn({ children, delay = 0, direction = "up", threshold = 0.15 }) {
  const [isVisible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  let xOffset = 0;
  let yOffset = 0;
  if (direction === "up") yOffset = 50;
  if (direction === "left") xOffset = -50;
  if (direction === "right") xOffset = 50;

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0, 0)" : `translate(${xOffset}px, ${yOffset}px)`,
        transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        width: "100%",
        height: "100%"
      }}
    >
      {children}
    </div>
  );
}

// --- Letter By Letter Typewriter ---
function TypewriterHeading({ text, delayStart = 0, className = "", style = {} }) {
  const [isVisible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ display: "inline-block", ...style }}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateX(0)" : "translateX(-20px)",
            transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${delayStart + index * 0.03}s`,
            display: "inline-block",
            whiteSpace: char === " " ? "pre" : "normal"
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

// --- Animated Counter ---
function StatCounter({ end, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const inc = end / steps;

    const timer = setInterval(() => {
      start += inc;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [visible, end]);

  return <span ref={ref}>{prefix}{count.toFixed(decimals)}{suffix}</span>;
}

export default function SmartFarmLanding({ setActive }) {
  const { lang, setLang } = useLang();
  const s = TRANSLATIONS[lang];
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeNav, setActiveNav] = useState("");

  const TESTIMONIALS = [
    { name: "Ramesh Patil", loc: "Pune, MH", text: lang === "hi" ? "पहली बार मेरी फसल का सही भाव मिला। स्मार्ट फार्म ने मुझे ₹40,000 ज्यादा कमाने में मदद की!" : "For the first time I got the right price for my crop. SmartFarm helped me earn ₹40,000 more!", crop: "Wheat" },
    { name: "Sunita Devi", loc: "Nashik, MH", text: lang === "hi" ? "मिट्टी की जांच से पता चला कि फास्फोरस कम है। अब मेरी टमाटर की फसल 2x बेहतर है!" : "Soil testing revealed low phosphorus. Now my tomato crop is 2x better!", crop: "Tomato" },
    { name: "Kiran Kumar", loc: "Guntur, AP", text: lang === "hi" ? "एआई ने 3 दिन पहले ही बता दिया कि कीड़े आने वाले हैं। मैंने स्प्रे किया और पूरी फसल बचा ली!" : "AI told me 3 days in advance that pests were coming. I sprayed and saved the entire crop!", crop: "Chilli" },
  ];

  const STATS = [
    { val: "140M+", end: 140, suffix: "M+", label: s.stats_farmers, icon: "👨‍🌾", percent: 92 },
    { val: "₹1.5L Cr", prefix: "₹", end: 1.5, decimals: 1, suffix: "L Cr", label: s.stats_loss, icon: "💸", percent: 75 },
    { val: "89%", end: 89, suffix: "%", label: s.stats_agronomist, icon: "🌾", percent: 89 },
    { val: "4x", end: 4, suffix: "x", label: s.stats_yield, icon: "📈", percent: 100 },
  ];

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);

      // Simple spy logic for active nav
      const sections = ["features", "how-it-works", "testimonials"];
      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) current = section;
        }
      }
      setActiveNav(current);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: "#ffffff", color: "#111827", width: "100%", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #86efac; border-radius: 10px; }
        
        .section-container { max-width: 1440px; margin: 0 auto; padding: 0 5vw; width: 100%; position: relative; }
        
        /* Typography Gradients */
        .text-gradient {
          background: linear-gradient(135deg, #15803d 0%, #4ade80 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        /* Animations */
        @keyframes float3D {
          0%, 100% { transform: translateY(0) rotateX(2deg) rotateY(-2deg); }
          50% { transform: translateY(-20px) rotateX(-2deg) rotateY(2deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(74,222,128,0.4), 0 0 40px rgba(74,222,128,0.2); transform: scale(1); }
          50% { box-shadow: 0 0 35px rgba(74,222,128,0.6), 0 0 60px rgba(74,222,128,0.3); transform: scale(1.03); }
        }
        @keyframes pulseGlowWhite {
          0%, 100% { box-shadow: 0 0 30px rgba(255,255,255,0.4); transform: scale(1); }
          50% { box-shadow: 0 0 50px rgba(255,255,255,0.7); transform: scale(1.05); }
        }
        @keyframes scanline {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes tickerTape {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes floatUp {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
        }
        @keyframes tickDraw {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Nav Underline */
        .nav-link { position: relative; color: #4b5563; font-weight: 600; text-decoration: none; font-size: 15px; padding-bottom: 4px; transition: color 0.3s; cursor: pointer; }
        .nav-link:hover, .nav-link.active { color: #15803d; }
        .nav-link::after { content: ""; position: absolute; bottom: 0; left: 0; width: 0%; height: 2px; background: #4ade80; transition: width 0.3s cubic-bezier(0.16,1,0.3,1); }
        .nav-link:hover::after, .nav-link.active::after { width: 100%; }

        /* Generic UI Elements */
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 40px rgba(22,163,74,0.06);
          border-radius: 32px;
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px);
          border-radius: 28px; padding: 40px 32px;
          border: 1px solid rgba(134,239,172,0.3);
          box-shadow: 0 10px 40px rgba(0,0,0,0.04), inset 0 0 20px rgba(255,255,255,0.5);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative; overflow: hidden;
        }
        .stat-card:hover { transform: translateY(-10px); box-shadow: 0 25px 50px rgba(22,163,74,0.12); border-color: #4ade80; }
        .stat-progress { height: 4px; background: #dcfce7; border-radius: 4px; margin-top: 24px; overflow: hidden; position: relative; }
        .stat-progress-fill { position: absolute; left: 0; top: 0; height: "100%"; background: linear-gradient(90deg, #22c55e, #15803d); transform-origin: left; transition: transform 1.5s cubic-bezier(0.16,1,0.3,1) 0.5s; }

        .image-halo { position: absolute; inset: -15px; background: radial-gradient(circle, rgba(74,222,128,0.2) 0%, transparent 70%); z-index: -1; filter: blur(20px); }
        .luxury-img { width: 100%; border-radius: 28px; box-shadow: 0 30px 60px rgba(0,0,0,0.15); display: block; }
        
        .feature-bullet { display: flex; alignItems: center; gap: 16px; margin-bottom: 20px; }
        .feature-tick { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #15803d); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 4px 10px rgba(34,197,94,0.4); }

        /* Testimonials 3D Tilt Hover */
        .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px; perspective: 1000px; }
        .testimonial-card-3d {
          background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); border-radius: 24px; padding: 40px 32px;
          border: 1px solid rgba(134,239,172,0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          transition: transform 0.4s ease, box-shadow 0.4s ease; transform-style: preserve-3d;
          display: flex; flex-direction: column; height: 100%;
        }
        .testimonial-card-3d:hover { transform: perspective(1000px) rotateX(4deg) rotateY(-4deg) translateY(-8px); box-shadow: -15px 25px 40px rgba(22,163,74,0.15); border-color: #86efac; }
        
        /* Grid Texture CTA */
        .grid-texture {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255, 255, 255, 0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(74,222,128,0.5)" : "1px solid transparent",
        boxShadow: scrolled ? "0 10px 30px rgba(0, 0, 0, 0.05)" : "none",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        padding: "16px 5vw", display: "flex", alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/logo.png" alt="SmartFarm AI" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", boxShadow: "0 6px 15px rgba(22,163,74,0.2)" }} />
          <span style={{ fontWeight: 900, fontSize: 24, color: "#111827", letterSpacing: "-.5px" }}>Smart<span style={{ color: "#16a34a" }}>Farm</span> <span style={{ fontWeight: 400 }}>AI</span></span>
        </div>
        <div style={{ display: "flex", gap: 40, overflowX: "auto" }} className="nav-container">
          {["Features", "How It Works", "Testimonials"].map(l => {
            const id = l.toLowerCase().replace(/ /g, "-");
            return (
              <a key={l} href={`#${id}`}
                 className={`nav-link ${activeNav === id ? "active" : ""}`}
                 onClick={(e) => {
                   e.preventDefault();
                   document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                 }}>
                {l}
              </a>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={() => setActive && setActive("login")} style={{ padding: "12px 24px", borderRadius: 999, background: "transparent", border: "1px solid transparent", color: "#111827", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .3s" }} className="nav-link">{lang === "hi" ? "लॉगिन" : "Login"}</button>
          <button onClick={() => setActive && setActive("register")} style={{ padding: "12px 28px", borderRadius: 999, fontSize: 15, fontWeight: 800, background: "linear-gradient(135deg,#22c55e,#15803d)", color: "white", border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 20px rgba(34,197,94,.3)", transition: "all .3s ease" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>{lang === "hi" ? "शुरू करें" : "Get Started"}</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ height: "100vh", position: "relative", display: "flex", alignItems: "center", width: "100%", overflow: "hidden" }}>
        {/* Parallax Background */}
        <div style={{ position: "absolute", inset: -50, overflow: "hidden", zIndex: 0 }}>
          <img src="/realistic_farm_hero.png" alt="Indian Farm" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translateY(${scrollY * 0.4}px)`, transition: "transform 0.1s linear" }} />
        </div>
        {/* Left Warm Gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 35%, rgba(255,255,255,0.4) 65%, transparent 100%)", zIndex: 1 }} />

        {/* Floating Firefly Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute", zIndex: 2, left: `${Math.random() * 50}%`,
            width: Math.random() * 4 + 2, height: Math.random() * 4 + 2,
            background: "#4ade80", borderRadius: "50%",
            boxShadow: "0 0 10px 2px rgba(74,222,128,0.8)",
            animation: `floatUp ${Math.random() * 5 + 5}s linear infinite ${Math.random() * 5}s`,
            opacity: 0
          }} />
        ))}

        <div className="section-container" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Left Content */}
          <div style={{ maxWidth: "60%" }}>
            <FadeIn delay={0.1}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(220,252,231,0.85)", backdropFilter: "blur(8px)", border: "1px solid #86efac", borderRadius: 999, padding: "8px 20px", marginBottom: 32, boxShadow: "0 8px 20px rgba(22,163,74,0.15)" }}>
                <span style={{ width: 8, height: 8, background: "#16a34a", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #22c55e" }} className="pulse" />
                <span style={{ fontSize: 13, color: "#166534", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>{s.landing_badge}</span>
              </div>
            </FadeIn>
            <h1 style={{ fontSize: "clamp(56px, 6vw, 84px)", fontWeight: 900, lineHeight: 1.05, marginBottom: 32, color: "#111827", letterSpacing: "-1.5px" }}>
              <TypewriterHeading text="Asli Krishi" delayStart={0.2} /> <br />
              <TypewriterHeading text="Intelligence" delayStart={0.6} className="text-gradient" /> <br />
              <TypewriterHeading text="Har Kisan Ke Liye" delayStart={1.0} />
            </h1>
            <FadeIn delay={1.4}>
              <p style={{ fontSize: 24, color: "#374151", lineHeight: 1.6, marginBottom: 48, fontWeight: 500, maxWidth: 650 }}>
                Sirf ek photo se apne khet ki poori jaankari paayein. Mitti, bimari, aur mandi ka bhav — sab kuch ab aapke haath mein!
              </p>
            </FadeIn>
            <FadeIn delay={1.6}>
              <button onClick={() => setActive && setActive("register")} style={{ background: "linear-gradient(135deg,#22c55e,#15803d)", color: "white", border: "none", borderRadius: 999, padding: "22px 50px", fontSize: 20, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", animation: "pulseGlow 3s infinite" }}>
                {s.cta_start}
              </button>
            </FadeIn>
          </div>


        </div>
      </section>

      {/* STATS SECTION */}
      <section style={{ padding: "120px 0", background: "#f0fdf4", position: "relative" }}>
        <div style={{ position: "absolute", top: -50, left: 0, right: 0, height: 100, background: "linear-gradient(to bottom, transparent, #f0fdf4)", zIndex: 1 }} />
        <div className="section-container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {STATS.map((stat, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div style={{ fontSize: 54, filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.1))" }}>{stat.icon}</div>
                    <div style={{ background: "#dcfce7", color: "#15803d", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>+{stat.percent}% YoY</div>
                  </div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: "#111827", letterSpacing: "-2px" }}>
                    <StatCounter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                  </div>
                  <div style={{ fontSize: 15, color: "#6b7280", fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: 1.5 }}>{stat.label}</div>
                  <div className="stat-progress">
                    <FadeIn delay={0.6 + (i * 0.1)}>
                      <div className="stat-progress-fill" style={{ transform: `scaleX(${stat.percent / 100})` }} />
                    </FadeIn>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE: AI ANALYSIS */}
      <section id="features" style={{ padding: "180px 0", background: "#ffffff", overflow: "hidden" }}>
        <div className="section-container">
          <div style={{ display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap", flexDirection: "row" }}>
            <div style={{ flex: "1 1 500px" }}>
              <FadeIn direction="left">
                <div style={{ color: "#16a34a", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, fontSize: 15, marginBottom: 16 }}>{s.feature_ai_scanner}</div>
                <h2 style={{ fontSize: "clamp(48px, 5vw, 64px)", fontWeight: 900, color: "#111827", marginBottom: 32, lineHeight: 1.1, letterSpacing: "-1.5px" }}>
                  <span className="text-gradient">{s.feature_ai_title.split(" ")[0]}</span> {s.feature_ai_title.split(" ").slice(1).join(" ")}
                </h2>
                <p style={{ fontSize: 22, color: "#4b5563", lineHeight: 1.8, marginBottom: 48, fontWeight: 400 }}>
                  {s.feature_ai_desc}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {["Pest & Disease Detection in Microseconds", "Real-time Leaf Health Monitoring", "Instant Chemical Custom Recommendations"].map((item, i) => (
                    <FadeIn key={i} delay={0.2 + (i * 0.15)} direction="left">
                      <div className="feature-bullet">
                        <div className="feature-tick" style={{ animation: `tickDraw 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i*0.15}s both` }}>✓</div>
                        <span style={{ fontWeight: 600, fontSize: 20, color: "#111827" }}>{item}</span>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </FadeIn>
            </div>
            <div style={{ flex: "1 1 500px", position: "relative" }}>
              <FadeIn delay={0.3} direction="right">
                <div style={{ position: "relative" }}>
                  <div className="image-halo" />
                  <div style={{ position: "relative", borderRadius: 40, boxShadow: "0 40px 80px rgba(0,0,0,0.1), 0 0 0 10px rgba(74,222,128,0.1)", overflow: "hidden" }}>
                    <img src="/realistic_ai_leaf.png" alt="AI Analysis" style={{ width: "100%", display: "block", transform: "scale(1.02)", transition: "transform 1s ease" }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.08)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1.02)"} />
                    {/* Glowing pulse scanline */}
                    <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: "linear-gradient(90deg, transparent, #4ade80, #22c55e, #4ade80, transparent)", boxShadow: "0 0 30px 10px rgba(74,222,128,0.6)", animation: "scanline 3s linear infinite", zIndex: 10, mixBlendMode: "overlay" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#fff", boxShadow: "0 0 10px 2px #fff", animation: "scanline 3s linear infinite", zIndex: 11 }} />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE: SOIL ANALYSIS */}
      <section id="how-it-works" style={{ padding: "180px 0", background: "#f0fdf4", position: "relative" }}>
        <div className="section-container">
          <div style={{ display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap", flexDirection: "row-reverse" }}>
            <div style={{ flex: "1 1 500px" }}>
              <FadeIn direction="right">
                <div style={{ color: "#d97706", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, fontSize: 15, marginBottom: 16 }}>{s.feature_soil_intel}</div>
                <h2 style={{ fontSize: "clamp(48px, 5vw, 64px)", fontWeight: 900, color: "#111827", marginBottom: 32, lineHeight: 1.1, letterSpacing: "-1.5px" }}>
                  <span style={{ background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Deep</span> {s.feature_soil_title}
                </h2>
                <p style={{ fontSize: 22, color: "#4b5563", lineHeight: 1.8, marginBottom: 48, fontWeight: 400 }}>
                  {s.feature_soil_desc}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {["N-P-K Deficiency Scan", "Moisture Level Tracking mapped in 3D", "Custom Automated Fertilizer Advisor"].map((item, i) => (
                    <FadeIn key={i} delay={0.2 + (i * 0.15)} direction="right">
                      <div className="feature-bullet">
                        <div className="feature-tick" style={{ background: "linear-gradient(135deg, #d97706, #b45309)", boxShadow: "0 4px 10px rgba(217,119,6,0.3)", animation: `tickDraw 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i*0.15}s both` }}>✓</div>
                        <span style={{ fontWeight: 600, fontSize: 20, color: "#111827" }}>{item}</span>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </FadeIn>
            </div>
            <div style={{ flex: "1 1 500px", position: "relative" }}>
              <FadeIn delay={0.3} direction="left">
                <div style={{ position: "relative" }}>
                  <div className="image-halo" style={{ background: "radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)" }} />
                  <div style={{ borderRadius: 40, boxShadow: "0 40px 80px rgba(180,83,9,0.15)", overflow: "hidden", border: "12px solid white", transform: "rotate(-2deg)", transition: "transform 0.5s ease" }} onMouseOver={e=>e.currentTarget.style.transform="rotate(0deg) scale(1.02)"} onMouseOut={e=>e.currentTarget.style.transform="rotate(-2deg) scale(1)"}>
                    {/* Parallax Image Scale on Scroll */}
                    <img src="/realistic_soil_test.png" alt="Soil Analysis" style={{ width: "100%", display: "block", transform: `scale(${1 + (scrollY * 0.0001)})`, transition: "transform 0.1s linear" }} />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE: MANDI PRICES WITH TICKER */}
      <section style={{ padding: "0 0 180px", background: "#ffffff", overflow: "hidden" }}>
        {/* Animated Market Ticker Strip */}
        <div style={{ width: "100%", background: "#111827", padding: "16px 0", display: "flex", borderBottom: "4px solid #16a34a", color: "white", fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap", marginBottom: 120 }}>
          <div style={{ display: "inline-block", paddingLeft: "100%", animation: "tickerTape 30s linear infinite" }}>
            🌾 WHEAT: ₹2,400 <span style={{color:"#4ade80"}}>↑ 2%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🍅 TOMATO: ₹1,200 <span style={{color:"#f87171"}}>↓ 4%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🧅 ONION: ₹1,800 <span style={{color:"#4ade80"}}>↑ 1%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            ☁️ COTTON: ₹7,200 <span style={{color:"#4ade80"}}>↑ 5%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🌻 MUSTARD: ₹5,400 <span style={{color:"#f87171"}}>↓ 1%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🍚 RICE: ₹1,980 <span style={{color:"#4ade80"}}>↑ 3%</span>
            {/* Duplicated for seamless loop */}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🌾 WHEAT: ₹2,400 <span style={{color:"#4ade80"}}>↑ 2%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🍅 TOMATO: ₹1,200 <span style={{color:"#f87171"}}>↓ 4%</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            🧅 ONION: ₹1,800 <span style={{color:"#4ade80"}}>↑ 1%</span>
          </div>
        </div>

        <div className="section-container">
          <div style={{ display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap", flexDirection: "row" }}>
            <div style={{ flex: "1 1 500px" }}>
              <FadeIn direction="left">
                <div style={{ color: "#16a34a", fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, fontSize: 15, marginBottom: 16 }}>{s.feature_market_access}</div>
                <h2 style={{ fontSize: "clamp(48px, 5vw, 64px)", fontWeight: 900, color: "#111827", marginBottom: 32, lineHeight: 1.1, letterSpacing: "-1.5px" }}>
                  <span className="text-gradient">Live</span> {s.feature_market_title}
                </h2>
                <p style={{ fontSize: 22, color: "#4b5563", lineHeight: 1.8, marginBottom: 48, fontWeight: 400 }}>
                  {s.feature_market_desc}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {["1000+ Verified Mandis Real-time Data", "Smart Selling Indicators (Hold/Sell)", "Predictive AI Price Forecasting"].map((item, i) => (
                    <FadeIn key={i} delay={0.2 + (i * 0.15)} direction="left">
                      <div className="feature-bullet">
                        <div className="feature-tick" style={{ animation: `tickDraw 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i*0.15}s both` }}>✓</div>
                        <span style={{ fontWeight: 600, fontSize: 20, color: "#111827" }}>{item}</span>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </FadeIn>
            </div>
            <div style={{ flex: "1 1 500px", position: "relative" }}>
              <FadeIn delay={0.3} direction="right">
                <div style={{ position: "relative" }}>
                  <div className="image-halo" />
                  <div className="float" style={{ borderRadius: 40, boxShadow: "0 40px 80px rgba(0,0,0,0.15), 0 0 0 10px rgba(74,222,128,0.1)", overflow: "hidden" }}>
                    <img src="/realistic_mandi_market.png" alt="Mandi Market" style={{ width: "100%", display: "block" }} />
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" style={{ padding: "160px 0", background: "#f0fdf4", borderTop: "1px solid #dcfce7" }}>
        <div className="section-container">
          <FadeIn direction="up">
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <h2 style={{ fontSize: "clamp(48px, 5vw, 64px)", fontWeight: 900, color: "#111827", letterSpacing: "-1.5px" }}>
                Farmers <span className="text-gradient">Success</span> Stories
              </h2>
              <p style={{ fontSize: 24, color: "#6b7280", marginTop: 16, fontWeight: 400 }}>{s.testimonial_subtitle}</p>
            </div>
          </FadeIn>
          
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 0.2} direction="up">
                <div className="testimonial-card-3d">
                  <div style={{ fontSize: 22, letterSpacing: 8, marginBottom: 24 }}>⭐⭐⭐⭐⭐</div>
                  <p style={{ fontSize: 19, color: "#374151", lineHeight: 1.8, margin: "0 0 40px 0", fontStyle: "italic", fontWeight: 500, flexGrow: 1 }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 20 }}>
                    <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, border: "3px solid #bbf7d0", flexShrink: 0, boxShadow: "0 4px 10px rgba(22,163,74,0.3)" }}>👨‍🌾</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 19, color: "#111827" }}>{t.name}</div>
                      <div style={{ color: "#15803d", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
                        <span style={{ background: "#dcfce7", padding: "4px 8px", borderRadius: 8 }}>{t.crop}</span> • {t.loc}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION WITH DEEP PARALLAX */}
      <section style={{ padding: "200px 0", background: "linear-gradient(135deg,#166534,#064e3b)", position: "relative", overflow: "hidden" }}>
        <div className="grid-texture" style={{ position: "absolute", inset: 0, opacity: 0.15 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(74,222,128,0.2) 0%, transparent 70%)" }} />
        
        {/* Deep Parallax Floating Crop Elements */}
        {Array.from({ length: 24 }).map((_, i) => {
          const depth = Math.random(); // 0 to 1
          const scale = depth * 1.5 + 0.5;
          const blur = (1 - depth) * 4; // Further elements are blurrier
          const zIndex = depth > 0.5 ? 2 : 0;
          return (
            <div key={i} style={{
              position: "absolute", left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`, fontSize: 30 * scale,
              opacity: depth * 0.5 + 0.1, zIndex,
              filter: `blur(${blur}px)`,
              transform: `translate(${(scrollY * depth * 0.05)}px, ${(scrollY * -depth * 0.1)}px)`,
              transition: "transform 0.1s linear",
            }}>
              <div style={{ animation: `float ${Math.random() * 5 + 4}s ease-in-out infinite ${Math.random() * 5}s` }}>
                {["🌾", "🌱", "🍂", "✨", "💧"][Math.floor(Math.random() * 5)]}
              </div>
            </div>
          );
        })}

        <div className="section-container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <FadeIn>
            <h2 style={{ fontSize: "clamp(52px, 7vw, 84px)", fontWeight: 900, marginBottom: 32, color: "white", letterSpacing: "-2px", textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
              {s.cta_bottom_title}
            </h2>
            <p style={{ fontSize: 26, color: "#86efac", marginBottom: 64, maxWidth: 800, margin: "0 auto 64px", fontWeight: 400, lineHeight: 1.6 }}>
              {s.cta_bottom_desc}
            </p>
            <button onClick={() => setActive && setActive("register")} style={{ background: "white", color: "#166534", fontSize: 24, fontWeight: 900, padding: "28px 84px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit", animation: "pulseGlowWhite 3s infinite", transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              {s.cta_bottom_btn}
            </button>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "80px 0 60px", background: "#ffffff", borderTop: "1px solid #f3f4f6" }}>
        <div className="section-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src="/logo.png" alt="SmartFarm AI Logo" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
              <span style={{ fontWeight: 900, color: "#111827", fontSize: 26, letterSpacing: "-.5px" }}>SmartFarm <span style={{ color: "#16a34a" }}>AI</span></span>
            </div>
            <div style={{ fontWeight: 600, color: "#6b7280", fontSize: 16 }}>{s.hackathon_footer}</div>
            <div style={{ fontWeight: 800, color: "#16a34a", fontSize: 18, padding: "8px 16px", background: "#dcfce7", borderRadius: 20 }}>#JaiKisan 🇮🇳</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
