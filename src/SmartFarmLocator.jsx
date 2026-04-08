import { useState, useRef, useEffect } from "react";
import { useLang } from "./App";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

// GeoSearch
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function SmartFarmLocator() {
    const { lang } = useLang();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const drawnItems = useRef(null);

    const [mapType, setMapType] = useState("satellite"); // 'street' or 'satellite'
    const [area, setArea] = useState({ acres: 0, hectares: 0 });
    const [coords, setCoords] = useState([]);

    const [formData, setFormData] = useState({
        farm_name: "",
        state: "",
        district: "",
        season: "Kharif (Monsoon - June to October)",
        soil_type: "Loamy",
        irrigation: "Well"
    });

    const [status, setStatus] = useState("idle"); // idle, saving, success
    const [isAutoDetected, setIsAutoDetected] = useState(false);

    const fetchLocationDetails = async (lat, lon) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            
            let detectedState = data.address?.state || "";
            let detectedDistrict = data.address?.state_district || data.address?.county || data.address?.city || data.address?.town || "";
            
            if (!detectedState || !detectedDistrict) {
                 throw new Error("Incomplete Nominatim data");
            }
            
            detectedDistrict = detectedDistrict.replace(/ District/gi, "").trim();

            setFormData(prev => ({ ...prev, state: detectedState, district: detectedDistrict }));
            setIsAutoDetected(true);
        } catch (err) {
            console.log("Nominatim failed, trying fallback API...", err);
            try {
                const fallRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                const fallData = await fallRes.json();
                
                let detectedState = fallData.principalSubdivision || "";
                let detectedDistrict = fallData.city || fallData.locality || "";
                
                setFormData(prev => ({ ...prev, state: detectedState, district: detectedDistrict }));
                setIsAutoDetected(true);
            } catch (fallbackErr) {
                console.error("Both geocoding APIs failed", fallbackErr);
            }
        }
    };

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Center on India
        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
        mapInstance.current = map;

        // Base layers
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri'
        });

        // Add initial layer
        (mapType === 'satellite' ? satelliteLayer : streetLayer).addTo(map);

        // Save layers on map object for easy switching
        map.layers = { street: streetLayer, satellite: satelliteLayer };

        // Initialize Draw Control
        const drawFeatureGroup = new L.FeatureGroup();
        map.addLayer(drawFeatureGroup);
        drawnItems.current = drawFeatureGroup;

        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawFeatureGroup,
                remove: true
            },
            draw: {
                polygon: {
                    shapeOptions: {
                        color: '#4ade80',
                        weight: 3,
                        fillOpacity: 0.3
                    }
                },
                polyline: false,
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false,
            }
        });
        map.addControl(drawControl);

        // Add Geosearch Control
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            autoComplete: true,
            autoCompleteDelay: 250,
            showMarker: false,
            retainZoomLevel: false,
            animateZoom: true,
            autoClose: true,
            searchLabel: 'Search for place or village...',
            keepResult: true
        });
        map.addControl(searchControl);

        // Try to get user's location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                map.setView([position.coords.latitude, position.coords.longitude], 15);
            });
        }

        // Handle Location Click
        map.on('click', (e) => {
            fetchLocationDetails(e.latlng.lat, e.latlng.lng);
        });

        // Handle Draw Events
        map.on(L.Draw.Event.CREATED, (e) => {
            // Clear previous drawings (only allow 1 polygon)
            drawFeatureGroup.clearLayers();

            const layer = e.layer;
            drawFeatureGroup.addLayer(layer);

            handlePolygonChange(layer);
            
            const latlngs = layer.getLatLngs()[0];
            if (latlngs && latlngs.length > 0) {
                fetchLocationDetails(latlngs[0].lat, latlngs[0].lng);
            }
        });

        map.on(L.Draw.Event.EDITED, (e) => {
            e.layers.eachLayer(layer => {
                handlePolygonChange(layer);
                const latlngs = layer.getLatLngs()[0];
                if (latlngs && latlngs.length > 0) {
                    fetchLocationDetails(latlngs[0].lat, latlngs[0].lng);
                }
            });
        });

        map.on(L.Draw.Event.DELETED, () => {
            setArea({ acres: 0, hectares: 0 });
            setCoords([]);
        });

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []); // Only run once

    // Handle Layer Switching
    useEffect(() => {
        if (!mapInstance.current?.layers) return;
        const map = mapInstance.current;

        // Remove both
        map.removeLayer(map.layers.street);
        map.removeLayer(map.layers.satellite);

        // Add selected
        map.layers[mapType].addTo(map);
    }, [mapType]);

    // Calculate Area
    const handlePolygonChange = (layer) => {
        let latlngs = layer.getLatLngs ? layer.getLatLngs()[0] : null;
        if (!latlngs && layer.getLatLng) {
           latlngs = [layer.getLatLng()];
        }
        
        if (latlngs) setCoords(latlngs);

        if (!latlngs || latlngs.length < 3) return;

        let areaSqMeters = 0;
        if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
            areaSqMeters = L.GeometryUtil.geodesicArea(latlngs);
        } else {
            const earthRadius = 6378137;
            for (let i = 0; i < latlngs.length; i++) {
                let p1 = latlngs[i];
                let p2 = latlngs[(i + 1) % latlngs.length];
                areaSqMeters += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
            }
            areaSqMeters = areaSqMeters * earthRadius * earthRadius / 2.0;
            areaSqMeters = Math.abs(areaSqMeters * Math.PI / 180.0);
        }

        const areaHectares = areaSqMeters / 10000;
        const areaAcres = areaHectares * 2.47105;

        setArea({
            hectares: parseFloat(areaHectares.toFixed(2)),
            acres: parseFloat(areaAcres.toFixed(2))
        });
    };

    const handleSave = async () => {
        if (area.acres === 0) {
            alert("Please draw your farm boundary on the map first.");
            return;
        }

        setStatus("saving");

        // 1. Capture the map image FIRST before any UI changes
        let mapImageBase64 = null;
        try {
            if (mapRef.current) {
                // Since npm install is hanging, dynamically load from CDN
                await new Promise((resolve, reject) => {
                    if (window.html2canvas) return resolve();
                    const script = document.createElement("script");
                    script.src = "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                // html2canvas requires useCORS for maps
                const canvas = await window.html2canvas(mapRef.current, { useCORS: true, allowTaint: true });
                mapImageBase64 = canvas.toDataURL("image/jpeg", 0.8);
            }
        } catch (e) {
            console.error("Failed to capture map image:", e);
        }

        const user = JSON.parse(localStorage.getItem("sfai_user") || 'null') || { id: 1 };
        const coordsStr = JSON.stringify(coords.map(c => ({ lat: c.lat, lng: c.lng })));

        const payload = {
            ...formData,
            farmer_id: user.id || 1,
            area_acres: area.acres,
            area_hectares: area.hectares,
            coordinates: coordsStr
        };

        try {
            const res = await fetch("http://localhost:5000/api/farm/locate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Save coordinates + image to localStorage so Analyzer can pick it up
                localStorage.setItem("sfai_latest_farm", JSON.stringify({
                    farmer_id: payload.farmer_id,
                    coordinates: coordsStr,
                    image: mapImageBase64
                }));

                // Instantly redirect to AI Analyzer page
                if (window.setActiveScreen) {
                    window.setActiveScreen("analyzer");
                } else {
                    setStatus("success");
                }
            } else {
                setStatus("idle");
                alert("Failed to save location data.");
            }
        } catch (err) {
            console.error(err);
            setStatus("idle");
            alert("Network error while saving.");
        }
    };

    if (status === "success") {
        return (
            <div style={{ padding: "40px", textAlign: "center", maxWidth: 600, margin: "0 auto", marginTop: 60 }}>
                <div style={{ fontSize: 72, marginBottom: 20 }}>✅</div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#166534", marginBottom: 12 }}>{lang === 'hi' ? 'खेत का स्थान सहेजा गया!' : 'Farm Location Saved!'}</h2>
                <p style={{ color: "#4b5563", marginBottom: 30 }}>{lang === 'hi' ? `आपका कृषि डेटा (${formData.district} में ${area.acres} एकड़) सफलतापूर्वक मैप किया और सहेजा गया है।` : `Your farm data (${area.acres} acres in ${formData.district}) has been successfully mapped and saved.`}</p>
                <button
                    onClick={() => {
                        if (window.setActiveScreen) window.setActiveScreen("analyzer");
                    }}
                    style={{ background: "#22c55e", color: "white", padding: "12px 24px", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 16 }}>
                    {lang === 'hi' ? 'AI विश्लेषक पर आगे बढ़ें ➔' : 'Proceed to AI Analyzer ➔'}
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>

            <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: 0 }}>📍 {lang === 'hi' ? 'अपने खेत का पता लगाएं' : 'Locate Your Farm'}</h1>
                <p style={{ color: "#6b7280", margin: "4px 0 0 0", fontSize: 14 }}>{lang === 'hi' ? 'सटीक क्षेत्रफल की गणना करने और हाइपर-लोकल AI अंतर्दृष्टि प्राप्त करने के लिए अपनी भूमि की सीमा बनाएं।' : 'Draw your land boundary to calculate exact area and get hyper-local AI insights.'}</p>
            </div>

            <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>

                {/* LEFT COL: MAP */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "white" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 700, color: "#374151" }}>{lang === 'hi' ? 'सीमा बनाएं' : 'Draw Boundary'}</div>

                        {/* Map Toggle */}
                        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 4 }}>
                            <button
                                onClick={() => setMapType("satellite")}
                                style={{ background: mapType === "satellite" ? "white" : "transparent", color: mapType === "satellite" ? "#16a34a" : "#6b7280", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: mapType === "satellite" ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>
                                🛰️ {lang === 'hi' ? 'सैटेलाइट देखें' : 'Satellite View'}
                            </button>
                            <button
                                onClick={() => setMapType("street")}
                                style={{ background: mapType === "street" ? "white" : "transparent", color: mapType === "street" ? "#16a34a" : "#6b7280", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: mapType === "street" ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>
                                🗺️ {lang === 'hi' ? 'नक्शा देखें' : 'Map View'}
                            </button>
                        </div>
                    </div>

                    <div
                        ref={mapRef}
                        style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: "1px solid #d1d5db", zIndex: 1 }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: 12 }}>
                        <div>
                            <div style={{ fontSize: 12, color: "#166534", fontWeight: 700, marginBottom: 2 }}>{lang === 'hi' ? 'पाया गया क्षेत्रफल' : 'Calculated Area'}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "#15803d" }}>
                                {area.acres > 0 ? area.acres : "--"} <span style={{ fontSize: 14 }}>{lang === 'hi' ? 'एकड़' : 'Acres'}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, color: "#166534", fontWeight: 700, marginBottom: 2 }}>{lang === 'hi' ? 'हेक्टेयर में' : 'In Hectares'}</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a", marginTop: 4 }}>
                                {area.hectares > 0 ? area.hectares : "--"} ha
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: FORM */}
                <div style={{ width: 360, background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>

                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>{lang === 'hi' ? 'खेत का विवरण' : 'Farm Details'}</h3>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>{lang === 'hi' ? 'किसान का नाम' : 'Farmer Name'}</label>
                        <input
                            value={formData.farm_name} onChange={e => setFormData({ ...formData, farm_name: e.target.value })}
                            placeholder={lang === 'hi' ? "उदा. रमेश पाटिल" : "e.g. Ramesh Patil"}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>
                                {lang === 'hi' ? 'राज्य' : 'State'}
                                {isAutoDetected && <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>📍 {lang === 'hi' ? 'स्वतः-पता' : 'Auto-detected'}</span>}
                            </label>
                            <input
                                value={formData.state} onChange={e => !isAutoDetected && setFormData({ ...formData, state: e.target.value })}
                                placeholder="Maharashtra"
                                readOnly={isAutoDetected}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: isAutoDetected ? "#f8fafc" : "white", color: isAutoDetected ? "#374151" : "inherit", outline: "none" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>
                                {lang === 'hi' ? 'जिला' : 'District'}
                                {isAutoDetected && <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>📍 {lang === 'hi' ? 'स्वतः-पता' : 'Auto-detected'}</span>}
                            </label>
                            <input
                                value={formData.district} onChange={e => !isAutoDetected && setFormData({ ...formData, district: e.target.value })}
                                placeholder="Pune"
                                readOnly={isAutoDetected}
                                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: isAutoDetected ? "#f8fafc" : "white", color: isAutoDetected ? "#374151" : "inherit", outline: "none" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>{lang === 'hi' ? 'रोपण का मौसम' : 'Planting Season'}</label>
                        <select
                            value={formData.season} onChange={e => setFormData({ ...formData, season: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "white" }}>
                            <option>{lang === 'hi' ? 'खरीफ (मानसून - जून से अक्टूबर)' : 'Kharif (Monsoon - June to October)'}</option>
                            <option>{lang === 'hi' ? 'रबी (सर्दी - अक्टूबर से मार्च)' : 'Rabi (Winter - October to March)'}</option>
                            <option>{lang === 'hi' ? 'जायद (गर्मी - मार्च से जून)' : 'Zaid (Summer - March to June)'}</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>{lang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type'}</label>
                        <select
                            value={formData.soil_type} onChange={e => setFormData({ ...formData, soil_type: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "white" }}>
                            <option>{lang === 'hi' ? 'दोमट (Loamy)' : 'Loamy'}</option>
                            <option>{lang === 'hi' ? 'काली कपास (Black Cotton)' : 'Black Cotton'}</option>
                            <option>{lang === 'hi' ? 'लाल मिट्टी (Red Soil)' : 'Red Soil'}</option>
                            <option>{lang === 'hi' ? 'जलोढ़ (Alluvial)' : 'Alluvial'}</option>
                            <option>{lang === 'hi' ? 'रेतीली (Sandy)' : 'Sandy'}</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4b5563", marginBottom: 6 }}>{lang === 'hi' ? 'सिंचाई की उपलब्धता' : 'Irrigation Availability'}</label>
                        <select
                            value={formData.irrigation} onChange={e => setFormData({ ...formData, irrigation: e.target.value })}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, background: "white" }}>
                            <option>{lang === 'hi' ? 'कुआं (Well)' : 'Well'}</option>
                            <option>{lang === 'hi' ? 'नहर (Canal)' : 'Canal'}</option>
                            <option>{lang === 'hi' ? 'ड्रिप (Drip)' : 'Drip'}</option>
                            <option>{lang === 'hi' ? 'केवल बारिश (Rainfed only)' : 'Rainfed only'}</option>
                        </select>
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: 16 }}>
                        <button
                            onClick={handleSave}
                            disabled={status === "saving" || area.acres === 0}
                            style={{
                                width: "100%", background: area.acres > 0 ? "#16a34a" : "#9ca3af", color: "white",
                                border: "none", padding: "12px", borderRadius: 8, fontSize: 15, fontWeight: 700,
                                cursor: area.acres > 0 ? "pointer" : "not-allowed"
                            }}>
                            {status === "saving" ? (lang === 'hi' ? "सहेजा जा रहा है..." : "Saving...") : (lang === 'hi' ? "भूमि डेटा सहेजें" : "Save Land Data")}
                        </button>
                        {area.acres === 0 && (
                            <p style={{ fontSize: 11, color: "#ef4444", textAlign: "center", marginTop: 8 }}>
                                {lang === 'hi' ? 'सहेजने को सक्षम करने के लिए पहले मानचित्र पर अपना खेत बनाएं।' : 'Draw your farm on the map first to enable saving.'}
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
