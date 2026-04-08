import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:5000";

export default function SmartFarmAuth({ setActive, active }) {
    const [isLogin, setIsLogin] = React.useState(active === "login");
    const [formData, setFormData] = useState({
        phone: "", name: "", password: "", farmSize: "", crop: ""
    });
    const [error, setError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setPhoneError("");
        setPwdError("");
        
        let hasError = false;
        if (formData.phone.length !== 10) {
            setPhoneError("Please enter a valid 10 digit mobile number.");
            hasError = true;
        }
        if (formData.password.length < 6) {
            setPwdError("Password must be at least 6 characters.");
            hasError = true;
        }
        if (hasError) return;

        setLoading(true);

        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

        const payload = isLogin
            ? { phone: formData.phone, password: formData.password }
            : {
                name: formData.name,
                phone: formData.phone,
                password: formData.password,
                farm_size: formData.farmSize,
                primary_crop: formData.crop,
            };

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong. Please try again.");
                setLoading(false);
                return;
            }

            // Explicitly requested exact structure for smartfarm_user
            localStorage.setItem("smartfarm_user", JSON.stringify({
                name: formData.name || data.name || "Farmer",
                mobile: formData.phone || data.phone || "",
                farmSize: formData.farmSize || data.farm_size || "5.0",
                primaryCrop: formData.crop || data.primary_crop || ""
            }));

            // Save user data returned from the real backend
            localStorage.setItem("sfai_user", JSON.stringify({
                farmer_id: data.farmer_id,
                name: data.name || formData.name,
                phone: data.phone || formData.phone,
                farmSize: data.farm_size || formData.farmSize || "5.0",
                crop: data.primary_crop || formData.crop || "",
            }));

            // Force clear old cached crops from previous sessions so the dashboard correctly loads the new primaryCrop!
            localStorage.removeItem("smartfarm_crops");

            if (setActive) setActive("dashboard");

        } catch (err) {
            setError("Could not connect to the server. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            width: "100%", minHeight: "100vh", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            fontFamily: "'Poppins', sans-serif", overflow: "hidden"
        }}>
            <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .glass-panel {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-right: none;
          border-radius: 40px 0 0 40px;
          box-shadow: -10px 0 50px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 16px 20px;
          color: white;
          font-size: 15px;
          outline: none;
          transition: all 0.3s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .input-field::placeholder { color: rgba(255, 255, 255, 0.7); }
        .input-field:focus {
          background: rgba(255, 255, 255, 0.3);
          border-color: #4ade80;
          box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.2);
        }
        .auth-btn {
          width: 100%;
          background: linear-gradient(135deg, #22c55e, #15803d);
          color: white;
          border: none;
          border-radius: 16px;
          padding: 18px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
          font-family: inherit;
        }
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(34, 197, 94, 0.6);
        }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .toggle-link {
          color: #86efac;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s;
        }
        .toggle-link:hover { color: #4ade80; text-decoration: underline; }
        .error-banner {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 12px;
          padding: 12px 16px;
          color: #fca5a5;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>

            {/* Background Image Setup */}
            <img src="/auth_bg.png" alt="Indian Farmer" style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover", zIndex: 0
            }} />
            <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, rgba(2,44,34,0.3) 0%, rgba(2,44,34,0.7) 60%, rgba(2,44,34,0.95) 100%)",
                zIndex: 1
            }} />

            {/* Top Left Logo Nav */}
            <div style={{ position: "absolute", top: 40, left: 40, zIndex: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setActive && setActive("landing")}>
                <img src="/logo.png" alt="SmartFarm AI" style={{ width: 44, height: 44, borderRadius: 14, objectFit: "cover", boxShadow: "0 4px 15px rgba(22,163,74,.4)" }} />
                <span style={{ fontWeight: 900, fontSize: 26, color: "white", letterSpacing: "-.5px", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>Smart<span style={{ color: "#4ade80" }}>Farm</span> <span style={{ fontWeight: 400 }}>AI</span></span>
            </div>

            {/* Auth Panel */}
            <div className="glass-panel" style={{
                position: "relative", zIndex: 10, width: "100%", maxWidth: 540,
                height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
                padding: "0 60px", boxSizing: "border-box"
            }}>

                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 38, fontWeight: 900, color: "white", marginBottom: 12, lineHeight: 1.1, letterSpacing: "-1px" }}>
                        {isLogin ? "Welcome Back, Kisaan" : "Join SmartFarm Today"}
                    </h1>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: 500, lineHeight: 1.6 }}>
                        {isLogin
                            ? "Login to access your high-yield intelligence dashboard and market insights."
                            : "Register your farm to unlock powerful AI-driven insights, soil analysis, and direct mandi prices."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {!isLogin && (
                        <input
                            type="text" placeholder="Full Name (eg. Ramesh Patil)" required className="input-field"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    )}

                    <input
                        type="tel" placeholder="Mobile Number (10 digits)" required className="input-field"
                        value={formData.phone} onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 10) setFormData({ ...formData, phone: val });
                        }}
                    />
                    {phoneError && <div style={{ color: "#ef4444", fontSize: 13, marginTop: -10, paddingLeft: 8, fontWeight: 500 }}>{phoneError}</div>}

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input
                            type="password" placeholder="Password (6 characters)" required className="input-field"
                            maxLength={6}
                            value={formData.password} 
                            onChange={e => {
                                if (e.target.value.length <= 6) setFormData({ ...formData, password: e.target.value });
                            }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px" }}>
                            <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{pwdError}</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{formData.password.length}/6</div>
                        </div>
                    </div>

                    {!isLogin && (
                        <div style={{ display: "flex", gap: 16 }}>
                            <input
                                type="text" placeholder="Farm Size (Acres)" className="input-field" style={{ flex: 1 }}
                                value={formData.farmSize} onChange={e => setFormData({ ...formData, farmSize: e.target.value })}
                            />
                            <select
                                className="input-field" style={{ flex: 1.2, color: formData.crop ? "white" : "rgba(255,255,255,0.7)", cursor: "pointer" }}
                                value={formData.crop} onChange={e => setFormData({ ...formData, crop: e.target.value })}
                            >
                                <option value="" style={{ color: "black" }}>Primary Crop</option>
                                <option value="Wheat" style={{ color: "black" }}>🌾 Wheat</option>
                                <option value="Rice" style={{ color: "black" }}>🍚 Rice</option>
                                <option value="Tomato" style={{ color: "black" }}>🍅 Tomato</option>
                                <option value="Onion" style={{ color: "black" }}>🧅 Onion</option>
                                <option value="Sugarcane" style={{ color: "black" }}>🎋 Sugarcane</option>
                                <option value="Cotton" style={{ color: "black" }}>☁️ Cotton</option>
                                <option value="Soybean" style={{ color: "black" }}>🫘 Soybean</option>
                                <option value="Mustard" style={{ color: "black" }}>🌻 Mustard</option>
                                <option value="Maize" style={{ color: "black" }}>🌽 Maize</option>
                                <option value="Chilli" style={{ color: "black" }}>🌶️ Chilli</option>
                                <option value="Potato" style={{ color: "black" }}>🥔 Potato</option>
                                <option value="Grapes" style={{ color: "black" }}>🍇 Grapes</option>
                            </select>
                        </div>
                    )}

                    {error && (
                        <div className="error-banner">⚠️ {error}</div>
                    )}

                    <div style={{ marginTop: 8 }}>
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading
                                ? (isLogin ? "Logging in…" : "Registering…")
                                : (isLogin ? "Login to Dashboard" : "Register Farm & Continue")}
                        </button>
                    </div>
                </form>

                <div style={{ marginTop: 28, textAlign: "center", fontSize: 15, color: "rgba(255,255,255,0.6)" }}>
                    {isLogin ? "Don't have an account yet? " : "Already registered your farm? "}
                    <span className="toggle-link" onClick={() => { setIsLogin(!isLogin); setError(""); setPhoneError(""); setPwdError(""); }}>
                        {isLogin ? "Register Now" : "Login Here"}
                    </span>
                </div>

            </div>
        </div>
    );
}
