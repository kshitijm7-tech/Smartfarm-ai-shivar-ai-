import { useState, useEffect } from "react";
import { useLang } from "./App";
import { TRANSLATIONS } from "./translations";


// ─── DATA ────────────────────────────────────────────────────────
// Comprehensive crop name → image map.
const CROP_IMAGE_MAP = {
  wheat:      "/crop_wheat_real.jpg",
  tomato:     "/crop_tomato_real.jpg",
  sugarcane:  "/crop_sugarcane_real.jpg",
  "गेहूं":   "/crop_wheat_real.jpg",
  "टमाटर":   "/crop_tomato_real.jpg",
  "गन्ना":   "/crop_sugarcane_real.jpg",
};
const FALLBACK_CROP_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Midsummer_Mead.jpg/400px-Midsummer_Mead.jpg";

async function searchCropImage(cropName) {
  if (!cropName) return FALLBACK_CROP_IMG;
  const key = cropName.trim().toLowerCase();
  if (CROP_IMAGE_MAP[key]) return CROP_IMAGE_MAP[key];
  if (CROP_IMAGE_MAP[cropName.trim()]) return CROP_IMAGE_MAP[cropName.trim()];

  try {
    const q = encodeURIComponent(cropName + " crop agriculture");
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${q}&pithumbsize=400&generator=search&gsrsearch=${q}&gsrlimit=1`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const thumb = pages[pageId].thumbnail?.source;
      if (thumb) return thumb;
    }
  } catch (e) {}
  return FALLBACK_CROP_IMG;
}

const PRODUCE = [
  { id: 1, name: "Fresh Wheat", nameHi: "ताजा गेहूं", farmer: "Ramesh Patil", loc: "Pune, MH", price: 2275, aiPrice: 2340, unit: "per quintal", qty: "48 q available", image: "", cat: "grains", rating: 4.8, reviews: 124, badge: "AI Price ✓", fresh: "Harvested 3 days ago", delivery: "2–3 days", organic: false, trending: true },
  { id: 2, name: "Organic Tomato", nameHi: "जैविक टमाटर", farmer: "Sunita Devi", loc: "Nashik, MH", price: 1200, aiPrice: 1350, unit: "per quintal", qty: "12 q available", image: "", cat: "vegetables", rating: 4.9, reviews: 87, badge: "Organic 🌿", fresh: "Harvested today", delivery: "1 day", organic: true, trending: true },
  { id: 3, name: "Green Chilli", nameHi: "हरी मिर्च", farmer: "Kiran Kumar", loc: "Guntur, AP", price: 3500, aiPrice: 3800, unit: "per quintal", qty: "8 q available", image: "", cat: "vegetables", rating: 4.6, reviews: 52, badge: "Premium", fresh: "Harvested 1 day ago", delivery: "2 days", organic: false, trending: false },
  { id: 4, name: "Soybean", nameHi: "सोयाबीन", farmer: "Anita Sharma", loc: "Indore, MP", price: 4600, aiPrice: 4800, unit: "per quintal", qty: "35 q available", image: "", cat: "grains", rating: 4.7, reviews: 68, badge: "AI Price ✓", fresh: "Harvested 5 days ago", delivery: "3 days", organic: false, trending: false },
  { id: 5, name: "Sugarcane Jaggery", nameHi: "गन्ने का गुड़", farmer: "Vijay Patil", loc: "Kolhapur, MH", price: 5400, aiPrice: 5800, unit: "per quintal", image: "", qty: "20 q available", cat: "processed", rating: 5.0, reviews: 203, badge: "Best Seller ⭐", fresh: "Processed this week", delivery: "2 days", organic: true, trending: true },
  { id: 6, name: "Onion", nameHi: "प्याज", farmer: "Rajesh More", loc: "Lasalgaon, MH", price: 1100, aiPrice: 1200, unit: "per quintal", qty: "60 q available", image: "", cat: "vegetables", rating: 4.4, reviews: 41, badge: "Bulk Available", fresh: "Harvested 2 days ago", delivery: "1–2 days", organic: false, trending: false },
  { id: 7, name: "Basmati Rice", nameHi: "बासमती चावल", farmer: "Gurpreet Singh", loc: "Amritsar, PB", price: 6200, aiPrice: 6500, unit: "per quintal", image: "", qty: "25 q available", cat: "grains", rating: 4.9, reviews: 156, badge: "GI Tagged 🏷️", fresh: "Harvested last week", delivery: "3–4 days", organic: false, trending: true },
  { id: 8, name: "Fresh Turmeric", nameHi: "ताजा हल्दी", farmer: "Lakshmi Rao", loc: "Erode, TN", price: 7800, aiPrice: 8200, unit: "per quintal", image: "", qty: "10 q available", cat: "spices", rating: 4.8, reviews: 93, badge: "Organic 🌿", fresh: "Dried & packed fresh", delivery: "2 days", organic: true, trending: false },
];

const EXOTIC_PRODUCE = [
  { id: 101, name: "Avocado", nameHi: "एवोकैडो", farmer: "Rahul Shetty", loc: "Coorg, KA", price: 18000, aiPrice: 19500, unit: "per quintal", qty: "5 q available", image: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?w=600&q=80", cat: "exotic", rating: 4.9, reviews: 42, badge: "Premium Exotic 🥑", fresh: "Harvested 2 days ago", delivery: "2–3 days", organic: false, trending: true },
  { id: 102, name: "Dragon Fruit", nameHi: "ड्रैगन फ्रूट", farmer: "Priya Nair", loc: "Nashik, MH", price: 25000, aiPrice: 27000, unit: "per quintal", qty: "3 q available", image: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&q=80", cat: "exotic", rating: 4.8, reviews: 31, badge: "Trending 🔥", fresh: "Harvested Today", delivery: "1 day", organic: false, trending: true },
  { id: 103, name: "Blueberry", nameHi: "ब्लूबेरी", farmer: "Arun Mehta", loc: "Mahabaleshwar, MH", price: 45000, aiPrice: 48000, unit: "per quintal", qty: "2 q available", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&q=80", cat: "exotic", rating: 4.9, reviews: 56, badge: "Organic 🌿", fresh: "Harvested 1 day ago", delivery: "2 days", organic: true, trending: false },
  { id: 104, name: "Kiwi", nameHi: "कीवी", farmer: "Deepak Sharma", loc: "Himachal, HP", price: 22000, aiPrice: 24000, unit: "per quintal", qty: "4 q available", image: "https://images.unsplash.com/photo-1618897996318-5a901fa696ca?w=600&q=80", cat: "exotic", rating: 4.7, reviews: 28, badge: "AI Price ✓", fresh: "Harvested 3 days ago", delivery: "3–4 days", organic: false, trending: false },
  { id: 105, name: "Strawberry", nameHi: "स्ट्रॉबेरी", farmer: "Sunita Patil", loc: "Mahabaleshwar, MH", price: 35000, aiPrice: 38000, unit: "per quintal", qty: "3 q available", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80", cat: "exotic", rating: 5.0, reviews: 74, badge: "Premium 🍓", fresh: "Harvested Today", delivery: "1 day", organic: false, trending: true },
  { id: 106, name: "Asparagus", nameHi: "शतावरी", farmer: "Vijay Kumar", loc: "Pune, MH", price: 28000, aiPrice: 30000, unit: "per quintal", qty: "2 q available", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80", cat: "exotic", rating: 4.6, reviews: 19, badge: "Exotic 🌿", fresh: "Harvested 2 days ago", delivery: "2 days", organic: false, trending: false },
  { id: 107, name: "Cherry Tomato", nameHi: "चेरी टमाटर", farmer: "Meena Rao", loc: "Bengaluru, KA", price: 8500, aiPrice: 9200, unit: "per quintal", qty: "6 q available", image: "https://images.unsplash.com/photo-1561136594-7f68413baa99?w=600&q=80", cat: "exotic", rating: 4.8, reviews: 38, badge: "Organic 🌿", fresh: "Harvested Today", delivery: "1–2 days", organic: true, trending: true },
  { id: 108, name: "Broccoli", nameHi: "ब्रोकली", farmer: "Raj Patel", loc: "Surat, GJ", price: 6500, aiPrice: 7000, unit: "per quintal", qty: "8 q available", image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&q=80", cat: "exotic", rating: 4.7, reviews: 23, badge: "Fresh ✅", fresh: "Harvested 1 day ago", delivery: "2 days", organic: false, trending: false },
];


const FERTILIZERS = [
  { id: 1, name: "Urea (46% N)", nameHi: "यूरिया (46% N)", brand: "IFFCO", price: 285, defaultImg: '1', unit: "per 45kg bag", image: "/urea.png", rating: 4.7, inStock: true, discount: "5% off" },
  { id: 2, name: "DAP Fertilizer", nameHi: "डीएपी उर्वरक", brand: "Coromandel", price: 1350, unit: "per 50kg bag", image: "/dap.png", rating: 4.8, inStock: true, discount: "Free delivery" },
  { id: 3, name: "NPK 10-26-26", nameHi: "एनपीके 10-26-26", brand: "Zuari", price: 1180, unit: "per 50kg bag", image: "/npk.png", rating: 4.6, inStock: true, discount: null },
  { id: 4, name: "Neem Coated Urea", nameHi: "नीम लेपित यूरिया", brand: "Kribhco", price: 310, unit: "per 45kg bag", image: "/neem_urea.png", rating: 4.9, inStock: true, discount: "Recommended" },
  { id: 5, name: "Potash (MOP)", nameHi: "पोटाश (MOP)", brand: "IPL", price: 890, unit: "per 50kg bag", image: "/potash.png", rating: 4.5, inStock: false, discount: null },
  { id: 6, name: "Zinc Sulphate", nameHi: "जिंक सल्फेट", brand: "Tata", price: 420, unit: "per 25kg bag", image: "/zinc.png", rating: 4.7, inStock: true, discount: "New Stock" },
];

const EQUIPMENT = [
  { id: 1, name: "Knapsack Sprayer 16L", nameHi: "नॅपसॅक स्प्रेयर 16L", brand: "Neptune", price: 1850, image: "/sprayer_real.jpg", rating: 4.6, inStock: true },
  { id: 2, name: "Soil pH Tester Kit", nameHi: "मिट्टी पीएच परीक्षक किट", brand: "Dr.Meter", price: 2400, image: "/tester_real.jpg", rating: 4.8, inStock: true },
  { id: 3, name: "Mini Drip Kit 1 acre", nameHi: "मिनी ड्रिप किट 1 एकड़", brand: "Jain Irrigation", price: 8500, image: "/drip_real.jpg", rating: 4.9, inStock: true },
  { id: 4, name: "Manual Seed Drill", nameHi: "मैनुअल सीड ड्रिल", brand: "Kissan", price: 3200, image: "/drill_real.jpg", rating: 4.5, inStock: false },
];

const CATS = ["All", "Grains", "Vegetables", "Spices", "Processed", "Exotic"];
const SORT_OPTIONS = ["Newest", "Price: Low–High", "Price: High–Low", "Best Rated", "Trending"];

function getDaysAgo(freshStr) {
  if (!freshStr) return 99;
  const s = freshStr.toLowerCase();
  if (s.includes('today') || s.includes('fresh')) return 0;
  const match = s.match(/(\d+)\s+day/);
  if (match) return parseInt(match[1], 10);
  if (s.includes('last week')) return 7;
  if (s.includes('this week')) return 3;
  return 99;
}

function applySort(items, sortType) {
  const arr = [...items];
  switch (sortType) {
    case "Newest":
      return arr.sort((a, b) => getDaysAgo(a.fresh) - getDaysAgo(b.fresh));
    case "Price: Low–High":
      return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "Price: High–Low":
      return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "Best Rated":
      return arr.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.reviews || 0) - (a.reviews || 0);
      });
    case "Trending":
      const getTrendScore = (p) => {
        if (p.trending || (p.badge && typeof p.badge === 'string' && p.badge.includes('Trending'))) return 3;
        if (p.organic || (p.badge && typeof p.badge === 'string' && p.badge.includes('Organic'))) return 2;
        if (p.badge && typeof p.badge === 'string' && p.badge.includes('Premium')) return 1;
        return 0;
      };
      return arr.sort((a, b) => getTrendScore(b) - getTrendScore(a));
    default:
      return arr;
  }
}

function Stars({ n }) {
  return <span style={{ color: "#fbbf24", fontSize: 12 }}>{"★".repeat(Math.floor(n))}{"☆".repeat(5 - Math.floor(n))}</span>;
}

function Badge({ text, color = "#4ade80", bg = "rgba(74,222,128,.12)" }) {
  return <span style={{ fontSize: 10, fontWeight: 700, background: bg, color, border: `1px solid ${color}33`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{text}</span>;
}

function Tag({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 16px", borderRadius: 999, border: `1px solid ${active ? "#22c55e" : "rgba(0,0,0,.12)"}`, background: active ? "#22c55e" : "white", color: active ? "white" : "#4b5563", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all .2s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

const API_BASE = "http://127.0.0.1:5000";

// ─── MAIN ────────────────────────────────────────────────────────
export default function Marketplace() {
  const [tab, setTab] = useState("buy");
  const [marketItems, setMarketItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [search, setSearch] = useState("");

  const handleSortChange = (newSort) => {
    setSort(newSort);
    setDisplayItems(prev => applySort(prev, newSort));
  };
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [liked, setLiked] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [sellDone, setSellDone] = useState(false);
  const [negotiating, setNegotiating] = useState(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  // GET LOGGED IN USER
  const rawUser = JSON.parse(localStorage.getItem("sfai_user") || localStorage.getItem("smartfarm_user") || 'null') || { farmer_id: 1, name: "Ramesh Patil", farmSize: "5.0" };
  const user = rawUser;
  const { lang } = useLang();
  const s = TRANSLATIONS[lang];

  const AI_PRICES = {
    "Wheat": 2340, "Rice": 6500, "Tomato": 1350, "Onion": 1200,
    "Soybean": 4800, "Maize": 2100, "Cotton": 7200, "Mustard": 5400,
    "Chilli": 3800, "Potato": 1800, "Sugarcane": 3200, "Grapes": 8500,
    "Avocado": 19500, "Strawberry": 38000, "Dragon Fruit": 27000
  };

  const CAT_MAP_HI = { "All": "सभी", "Grains": "अनाज", "Vegetables": "सब्जियां", "Spices": "मसाले", "Processed": "संसाधित", "Exotic": "विदेशी" };
  const SORT_MAP_HI = { "Newest": "नवीनतम", "Price: Low–High": "कीमत: कम से अधिक", "Price: High–Low": "कीमत: अधिक से कम", "Best Rated": "सर्वश्रेष्ठ रेटिंग", "Trending": "ट्रेंडिंग" };

  const INDIAN_CROPS = [
    "🌾 Wheat", "🍚 Rice", "🍅 Tomato", "🧅 Onion", "🎋 Sugarcane",
    "☁️ Cotton", "🫘 Soybean", "🌻 Mustard", "🌽 Maize", "🌶️ Chilli",
    "🥔 Potato", "🍇 Grapes", "🥑 Avocado", "🍓 Strawberry", "🐉 Dragon Fruit", "Other"
  ];

  const [sellForm, setSellForm] = useState({
    farmerName: user.name || "",
    location: user.location || user.city || "Maharashtra, India",
    farmSize: user.farmSize || "5.0",
    crop: "",
    quality: "Premium A Grade",
    harvestDate: "",
    qty: "",
    organic: false,
    price: "",
    deliveryAvailable: true,
    deliveryRadius: "Within 50km",
    availableFrom: "",
    notes: ""
  });

  // My Listings
  const [userListings, setUserListings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user_listings") || "[]"); } catch { return []; }
  });
  const [editingListingId, setEditingListingId] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  // FETCH LISTINGS
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/market/view`);
      const data = await res.json();
      if (data.status === "success") {
        const enriched = data.listings.map((item, idx) => ({
          ...item,
          id: item.id,
          name: item.crop_name,
          farmer: `Farmer #${item.farmer_id}`,
          loc: "Recent Listing",
          price: item.price_per_kg * 100,
          unit: "per quintal",
          qty: `${item.expected_yield_kg} kg available`,
          image: `/produce_${(item.crop_name || 'wheat').toLowerCase()}.png`,
          cat: "grains",
          rating: 4.5 + (idx % 10) / 20,
          badge: "New Listing",
          fresh: "Verified",
          delivery: "2–3 days",
        }));
        setMarketItems(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch market items", err);
    } finally {
      setIsLoading(false);
    }
  };

  const [displayItems, setDisplayItems] = useState(PRODUCE);

  useEffect(() => {
    const loadImages = async () => {
      const savedListings = JSON.parse(localStorage.getItem("user_listings") || "[]");
      const allItems = [...(marketItems.length > 0 ? marketItems : PRODUCE), ...EXOTIC_PRODUCE, ...savedListings];
      const enriched = await Promise.all(allItems.map(async item => {
        if (!item.image || item.image.startsWith("/produce_")) {
          const img = await searchCropImage(item.name.replace("Fresh ", "").replace("Organic ", ""));
          return { ...item, image: img };
        }
        return item;
      }));
      setDisplayItems(applySort(enriched, sort));
    };
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketItems, tab, userListings]);

  useEffect(() => {
    if (tab === "buy") fetchListings();
  }, [tab]);

  const handleNegotiate = (item) => {
    const prompt = `I'm interested in the ${item.name} listed at ₹${item.price}/${item.unit} by ${item.farmer}. Can you help me negotiate a better price or ask about the quality?`;
    localStorage.setItem("sfai_chat_redirect", prompt);
    window.setActiveScreen("chat");
  };

  const filtered = displayItems.filter(p => {
    const matchCat = cat === "All" || (p.cat || "").toLowerCase() === cat.toLowerCase();
    const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.farmer || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addCart = (item) => {
    setCart(c => c.find(x => x.id === item.id) ? c : [...c, { ...item, cartQty: 1 }]);
  };
  const removeCart = (id) => setCart(c => c.filter(x => x.id !== id));
  const toggleLike = (id) => setLiked(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id]);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.cartQty, 0);

  const handleSellSubmit = () => {
    if (!sellForm.crop || !sellForm.qty || !sellForm.price) {
      setError("Please fill in Crop, Quantity and Price fields.");
      return;
    }
    setError("");
    const cropName = sellForm.crop.replace(/^[^a-zA-Z]+/, "").trim();
    const newListing = {
      id: Date.now(),
      name: cropName,
      farmer: sellForm.farmerName || user.name || "You",
      loc: sellForm.location || "Maharashtra, India",
      price: parseFloat(sellForm.price),
      aiPrice: AI_PRICES[cropName] || null,
      unit: "per quintal",
      qty: `${sellForm.qty} q available`,
      image: photoPreview || "",
      cat: "grains",
      rating: 5.0,
      reviews: 0,
      badge: "Your Listing",
      fresh: sellForm.harvestDate ? `Harvested ${sellForm.harvestDate}` : "Freshly Harvested",
      delivery: sellForm.deliveryAvailable ? sellForm.deliveryRadius : "Pickup Only",
      organic: sellForm.organic,
      trending: false,
      isOwn: true
    };
    const existing = JSON.parse(localStorage.getItem("user_listings") || "[]");
    const updated = [newListing, ...existing];
    localStorage.setItem("user_listings", JSON.stringify(updated));
    setUserListings(updated);
    setSellDone(true);
    setTimeout(() => {
      setSellDone(false);
      setSellForm({ farmerName: user.name || "", location: user.location || "Maharashtra, India", farmSize: user.farmSize || "5.0", crop: "", quality: "Premium A Grade", harvestDate: "", qty: "", organic: false, price: "", deliveryAvailable: true, deliveryRadius: "Within 50km", availableFrom: "", notes: "" });
      setPhotoPreview(null);
      setTab("mylistings");
    }, 2500);
  };

  const removeUserListing = (id) => {
    const updated = userListings.filter(l => l.id !== id);
    localStorage.setItem("user_listings", JSON.stringify(updated));
    setUserListings(updated);
  };

  const saveEditPrice = (id) => {
    if (!editPrice) return;
    const updated = userListings.map(l => l.id === id ? { ...l, price: parseFloat(editPrice) } : l);
    localStorage.setItem("user_listings", JSON.stringify(updated));
    setUserListings(updated);
    setEditingListingId(null);
    setEditPrice("");
  };

  const TABS = lang === 'hi' ? [
    { id: "buy", icon: "🛒", label: "उपज खरीदें" },
    { id: "sell", icon: "📤", label: "अपनी फसल बेचें" },
    { id: "mylistings", icon: "📦", label: "मेरी लिस्टिंग" },
    { id: "fertilizer", icon: "🧪", label: "उर्वरक" },
    { id: "equipment", icon: "🔧", label: "उपकरण" },
  ] : [
    { id: "buy", icon: "🛒", label: "Buy Produce" },
    { id: "sell", icon: "📤", label: "Sell Your Crop" },
    { id: "mylistings", icon: "📦", label: "My Listings" },
    { id: "fertilizer", icon: "🧪", label: "Fertilizers" },
    { id: "equipment", icon: "🔧", label: "Equipment" },
  ];

  const selectedCropName = sellForm.crop.replace(/^[^a-zA-Z]+/, "").trim();
  const aiSuggestedPrice = AI_PRICES[selectedCropName];


  return (
    <div style={{ minHeight: "100vh", background: "#f8fdf9", fontFamily: "'Nunito', 'Poppins', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 10px; }
        .prod-card { background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.04); border: 1px solid #f1f5f9; transition: all .3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .prod-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(22,163,74,.1); border-color: #dcfce7; }
        .fert-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,.03); border: 1px solid #f1f5f9; transition: all .25s; }
        .fert-card:hover { transform: translateY(-4px); box-shadow: 0 12px 25px rgba(22,163,74,.08); }
        .tab-pill { cursor: pointer; border: none; font-family: inherit; transition: all .3s; border-radius: 16px; position: relative; }
        .tab-pill.active::after { content: ''; position: absolute; bottom: 0; left: 24px; right: 24px; height: 3px; background: #16a34a; border-radius: 999px; }
        .slide-in { animation: slideIn .4s ease-out forwards; }
        @keyframes slideIn { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:none} }
        .pop-in { animation: popIn .3s cubic-bezier(.4,0,.2,1) forwards; }
        @keyframes popIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        .btn { border: none; border-radius: 16px; cursor: pointer; font-family: inherit; font-weight: 800; transition: all .2s; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(22,163,74,.2); }
        .btn-green { background: linear-gradient(135deg,#22c55e,#15803d); color: white; }
        .btn-outline { background: white; border: 2px solid #e2e8f0 !important; color: #4b5563; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #22c55e !important; box-shadow: 0 0 0 4px rgba(34,197,94,.1); }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; }
        .cart-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 400px; background: white; box-shadow: -15px 0 50px rgba(0,0,0,.15); z-index: 90; display: flex; flex-direction: column; transition: transform .3s ease; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .luxury-header { background: white; border-bottom: 1px solid #f1f5f9; }
        .card-stagger:nth-child(n){ animation-delay: calc(0.05s * var(--i)); }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="luxury-header" style={{ padding: "0", position: "sticky", top: 0, zIndex: 40 }}>
        {/* Top bar */}
        <div style={{ padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#0a2e1f,#166534)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(22,163,74,.25)", overflow: "hidden", flexShrink: 0 }}>
                <img src="/smartfarm_logo.png" alt="SmartFarm AI" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display='none'; e.target.insertAdjacentHTML('afterend', '<span style="font-size:22px">🌿</span>'); }} />
              </div>
            <div>
              <div style={{ color: "#111827", fontWeight: 900, fontSize: 20, letterSpacing: "-.5px" }}>Smart<span style={{ color: "#16a34a" }}>Farm</span> Market</div>
              <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>{lang === 'hi' ? 'सीधे किसान का मार्केटप्लेस' : 'Direct to Farmer Marketplace'}</div>
            </div>
          </div>

          <div style={{ flex: 1, maxWidth: 500, margin: "0 48px", position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, opacity: .5 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'hi' ? "गेहूं, चावल, किसानों को खोजें..." : "Search for wheat, rice, farmers..."}
              style={{ width: "100%", padding: "12px 20px 12px 48px", borderRadius: 16, border: "2px solid #f1f5f9", background: "#f8fafc", color: "#111827", fontSize: 14, fontWeight: 500, fontFamily: "inherit" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ background: "#f1f5f9", border: "none", color: "#475569", borderRadius: 14, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>📍 {lang === 'hi' ? 'पुणे, MH' : 'Pune, MH'}</button>
            <button onClick={() => setCartOpen(true)} style={{ background: "#16a34a", border: "none", borderRadius: 16, padding: "11px 24px", fontSize: 14, fontWeight: 800, color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", boxShadow: "0 6px 15px rgba(22,163,74,.25)" }}>
              🛒 {lang === 'hi' ? 'कार्ट' : 'Cart'} {cart.length > 0 && <span style={{ background: "white", color: "#16a34a", borderRadius: "50%", width: 22, height: 22, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{cart.length}</span>}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", padding: "0 32px", gap: 8 }}>
          {TABS.map(t => (
            <button key={t.id} className={`tab-pill ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}
              style={{ padding: "14px 28px", background: "transparent", color: tab === t.id ? "#16a34a" : "#64748b", fontSize: 15, fontWeight: tab === t.id ? 800 : 600 }}>
              {t.icon} <span style={{ marginLeft: 6 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── BUY TAB ─────────────────────────────────────────────── */}
      {tab === "buy" && (
        <div style={{ padding: "32px" }}>
          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
            {(lang === 'hi' ? [
              { label: "सत्यापित किसान", val: "2,400+", icon: "👨‍🌾", color: "#16a34a" },
              { label: "दैनिक ताज़ा आइटम", val: "180+", icon: "🥬", color: "#0891b2" },
              { label: "मुफ़्त डिलीवरी", val: "Across MH", icon: "🚚", color: "#7c3aed" },
              { label: "कुल लेनदेन", val: "₹1.2 Cr", icon: "💰", color: "#ca8a04" },
            ] : [
              { label: "Verified Farmers", val: "2,400+", icon: "👨‍🌾", color: "#16a34a" },
              { label: "Daily Fresh Items", val: "180+", icon: "🥬", color: "#0891b2" },
              { label: "Free Delivery", val: "Across MH", icon: "🚚", color: "#7c3aed" },
              { label: "Total Transactions", val: "₹1.2 Cr", icon: "💰", color: "#ca8a04" },
            ]).map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: 24, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,.02)" }}>
                <div style={{ fontSize: 32 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {CATS.map(c => <Tag key={c} active={cat === c} onClick={() => setCat(c)}>{lang === 'hi' ? CAT_MAP_HI[c] : c}</Tag>)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>{lang === 'hi' ? 'क्रमबद्ध करें:' : 'Sort By:'}</span>
              <select value={sort} onChange={e => handleSortChange(e.target.value)}
                style={{ padding: "10px 16px", borderRadius: 14, border: "2px solid #f1f5f9", fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "inherit", cursor: "pointer", background: "white" }}>
                {SORT_OPTIONS.map(o => <option key={o} value={o}>{lang === 'hi' ? SORT_MAP_HI[o] : o}</option>)}
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {filtered.map((p, i) => (
              <div key={p.id} className="prod-card slide-in" style={{ "--i": i }} onClick={() => setModalItem(p)}>
                {/* Image Section */}
                <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }} className="hover-zoom" />
                  <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8 }}>
                    {p.trending && <Badge text="🔥 Trending" color="#ef4444" bg="white" />}
                    <Badge text={p.badge} color={p.badge.includes("Organic") ? "#16a34a" : "#0369a1"} bg="white" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleLike(p.id); }}
                    style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "white", border: "none", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
                    {liked.includes(p.id) ? "❤️" : "🤍"}
                  </button>
                </div>

                {/* Content Section */}
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#111827", marginBottom: 4 }}>{lang === 'hi' && p.nameHi ? p.nameHi : p.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginBottom: 12 }}>👨‍🌾 {p.farmer} • 📍 {p.loc}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#475569" }}>🕒 {p.fresh}</div>
                    <div style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#475569" }}>🚚 {p.delivery}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>₹{p.price.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{p.unit}</div>
                      {p.aiPrice && <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, marginTop: 2 }}>AI: ₹{p.aiPrice.toLocaleString()}/q</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); handleNegotiate(p); }} className="btn" style={{ padding: "10px 16px", fontSize: 13, background: "rgba(74,222,128,.1)", color: "#16a34a", border: "1px solid rgba(74,222,128,.3)" }}>
                        🤝 {lang === 'hi' ? 'बातचीत करें' : 'Negotiate'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); addCart(p); }} className="btn btn-green" style={{ padding: "10px 20px", fontSize: 14 }}>
                        {cart.find(c => c.id === p.id) ? (lang === 'hi' ? "✓ जोड़ा गया" : "✓ Added") : (lang === 'hi' ? "+ जोड़ें" : "+ Add")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SELL TAB ─────────────────────────────────────────────── */}
      {tab === "sell" && (
        <div style={{ padding: "32px", maxWidth: 860, margin: "0 auto" }}>
          {sellDone ? (
            <div style={{ background: "white", padding: 56, borderRadius: 28, textAlign: "center", boxShadow: "0 8px 30px rgba(22,163,74,.12)", border: "2px solid #dcfce7" }}>
              <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#15803d", marginBottom: 10 }}>Your crop is now live on the marketplace!</h2>
              <p style={{ color: "#64748b", fontWeight: 600, fontSize: 15 }}>Buyers can see it instantly. Redirecting to My Listings…</p>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 28, boxShadow: "0 4px 20px rgba(0,0,0,.05)", border: "1px solid #e8f5e9", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,#0a2e1f,#166534)", padding: "28px 40px" }}>
                <div style={{ color: "#86efac", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>{lang === 'hi' ? 'मार्केटप्लेस' : 'Marketplace'}</div>
                <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>📤 {lang === 'hi' ? 'स्मार्टफार्म मार्केट पर अपनी फसल सूचीबद्ध करें' : 'List Your Crop on SmartFarm Market'}</div>
                <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13, marginTop: 4 }}>{lang === 'hi' ? 'नीचे विवरण भरें और सीधे हजारों खरीदारों तक पहुंचें' : 'Fill in the details below and reach thousands of buyers directly'}</div>
              </div>
              <div style={{ padding: "40px" }}>

                {/* Section 1 — Farmer Details */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#15803d", color: "white", width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>1</span>
                    Farmer Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    {[{ label: "👨‍🌾 Farmer Name", val: sellForm.farmerName }, { label: "📍 Location", val: sellForm.location }, { label: "🌾 Farm Size (Acres)", val: sellForm.farmSize }].map((f, i) => (
                      <div key={i}><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{f.label}</label>
                        <input readOnly value={f.val} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, background: "#f8fafc", color: "#374151", fontFamily: "inherit" }} /></div>
                    ))}
                  </div>
                </div>

                {/* Section 2 — Crop Details */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#15803d", color: "white", width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>2</span>
                    Crop Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Crop Name *</label>
                      <select value={sellForm.crop} onChange={e => setSellForm({ ...sellForm, crop: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit", background: "white" }}>
                        <option value="">Select crop…</option>
                        {INDIAN_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                    <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Crop Quality</label>
                      <select value={sellForm.quality} onChange={e => setSellForm({ ...sellForm, quality: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit", background: "white" }}>
                        <option>Premium A Grade</option><option>Standard B Grade</option><option>Economy C Grade</option>
                      </select></div>
                    <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Harvest Date</label>
                      <input type="date" value={sellForm.harvestDate} onChange={e => setSellForm({ ...sellForm, harvestDate: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit" }} /></div>
                    <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Quantity Available (Quintals) *</label>
                      <input type="number" placeholder="e.g. 50" value={sellForm.qty} onChange={e => setSellForm({ ...sellForm, qty: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit" }} /></div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🌿 Organic Certified?</label>
                    <button onClick={() => setSellForm({ ...sellForm, organic: !sellForm.organic })} style={{ background: sellForm.organic ? "#16a34a" : "#e2e8f0", border: "none", borderRadius: 999, width: 48, height: 26, cursor: "pointer", position: "relative", transition: "all .2s" }}>
                      <span style={{ position: "absolute", top: 3, left: sellForm.organic ? 24 : 3, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "left .2s" }} />
                    </button>
                    <span style={{ fontSize: 13, color: sellForm.organic ? "#16a34a" : "#9ca3af", fontWeight: 700 }}>{sellForm.organic ? "Yes" : "No"}</span>
                  </div>
                </div>

                {/* Section 3 — Pricing */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#15803d", color: "white", width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>3</span>
                    Pricing
                  </div>
                  <div style={{ maxWidth: 360 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Your Expected Price per Quintal (₹) *</label>
                    <input type="number" placeholder="e.g. 2200" value={sellForm.price} onChange={e => setSellForm({ ...sellForm, price: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 16, fontFamily: "inherit", fontWeight: 700 }} />
                    {aiSuggestedPrice && <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#16a34a", fontWeight: 700 }}>🤖 AI suggests ₹{aiSuggestedPrice.toLocaleString()}/q for {selectedCropName}</div>}
                  </div>
                </div>

                {/* Section 4 — Delivery */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#15803d", color: "white", width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>4</span>
                    Delivery Details
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🚚 Delivery Available?</label>
                    <button onClick={() => setSellForm({ ...sellForm, deliveryAvailable: !sellForm.deliveryAvailable })} style={{ background: sellForm.deliveryAvailable ? "#16a34a" : "#e2e8f0", border: "none", borderRadius: 999, width: 48, height: 26, cursor: "pointer", position: "relative", transition: "all .2s" }}>
                      <span style={{ position: "absolute", top: 3, left: sellForm.deliveryAvailable ? 24 : 3, width: 20, height: 20, background: "white", borderRadius: "50%", transition: "left .2s" }} />
                    </button>
                    <span style={{ fontSize: 13, color: sellForm.deliveryAvailable ? "#16a34a" : "#9ca3af", fontWeight: 700 }}>{sellForm.deliveryAvailable ? "Yes" : "No"}</span>
                  </div>
                  {sellForm.deliveryAvailable && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Delivery Radius</label>
                        <select value={sellForm.deliveryRadius} onChange={e => setSellForm({ ...sellForm, deliveryRadius: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit", background: "white" }}>
                          <option>Within 10km</option><option>Within 50km</option><option>Within 100km</option><option>Pan Maharashtra</option><option>Pan India</option>
                        </select></div>
                      <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Available From</label>
                        <input type="date" value={sellForm.availableFrom} onChange={e => setSellForm({ ...sellForm, availableFrom: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit" }} /></div>
                    </div>
                  )}
                  <div><label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Additional Notes</label>
                    <textarea rows={3} placeholder="Describe quality, packaging, special requirements..." value={sellForm.notes} onChange={e => setSellForm({ ...sellForm, notes: e.target.value })} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #f1f5f9", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} /></div>
                </div>

                {/* Section 5 — Photo */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "#15803d", color: "white", width: 20, height: 20, borderRadius: "50%", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>5</span>
                    {lang === 'hi' ? 'फसल की फोटो अपलोड करें' : 'Upload Crop Photo'}
                  </div>
                  <label style={{ fontSize: 12, color: "#64748b", marginBottom: 10, display: "block" }}>{lang === 'hi' ? 'फसल की फोटो अपलोड करें (वैकल्पिक लेकिन अनुशंसित — खरीदार की रुचि बढ़ाता है)' : 'Upload crop photo (optional but recommended — increases buyer interest)'}</label>
                  <div style={{ border: "2px dashed #bbf7d0", borderRadius: 16, padding: "24px", textAlign: "center", background: "#f0fdf4", cursor: "pointer" }} onClick={() => document.getElementById('sell-photo-input').click()}>
                    {photoPreview ? <img src={photoPreview} alt="Preview" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 12, objectFit: "cover" }} /> : <div><div style={{ fontSize: 36, marginBottom: 8 }}>📸</div><div style={{ fontWeight: 700, color: "#374151" }}>{lang === 'hi' ? 'फोटो अपलोड करने के लिए क्लिक करें' : 'Click to upload a photo'}</div><div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>JPG, PNG up to 10MB</div></div>}
                    <input id="sell-photo-input" type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const file = e.target.files[0]; if (file) { setPhotoFile(file); const reader = new FileReader(); reader.onload = ev => setPhotoPreview(ev.target.result); reader.readAsDataURL(file); } }} />
                  </div>
                  {photoPreview && <button onClick={() => { setPhotoPreview(null); setPhotoFile(null); }} style={{ marginTop: 8, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{lang === 'hi' ? 'फोटो हटाएं' : 'Remove photo'}</button>}
                </div>

                {error && <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13, marginBottom: 16, padding: "10px 16px", background: "#fef2f2", borderRadius: 10 }}>⚠️ {error}</div>}
                <button onClick={handleSellSubmit} className="btn btn-green" style={{ width: "100%", padding: "18px 24px", fontSize: 17, borderRadius: 16 }}>🚀 {lang === 'hi' ? 'बाजार में मेरी फसल सूचीबद्ध करें' : 'List My Crop on Market'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MY LISTINGS TAB */}
      {tab === "mylistings" && (
        <div style={{ padding: "32px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>📦 {lang === 'hi' ? 'मेरी लिस्टिंग' : 'My Listings'}</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{lang === 'hi' ? 'सभी फसलें जो आपने मार्केटप्लेस पर सूचीबद्ध की हैं' : 'All crops you have listed on the marketplace'}</p>
          </div>
          {userListings.length === 0 ? (
            <div style={{ background: "white", borderRadius: 24, padding: "64px 40px", textAlign: "center", border: "2px dashed #e2e8f0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🌾</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#374151", marginBottom: 8 }}>{lang === 'hi' ? 'अभी तक कोई लिस्टिंग नहीं' : 'No listings yet'}</div>
              <p style={{ color: "#94a3b8", marginBottom: 24 }}>{lang === 'hi' ? 'अपनी पहली फसल सूचीबद्ध करने के लिए अपनी फसल बेचें पर जाएं!' : 'Go to Sell Your Crop to list your first crop!'}</p>
              <button onClick={() => setTab("sell")} className="btn btn-green" style={{ padding: "12px 28px", fontSize: 14 }}>{lang === 'hi' ? '+ एक फसल सूचीबद्ध करें' : '+ List a Crop'}</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
              {userListings.map(l => (
                <div key={l.id} style={{ background: "white", borderRadius: 24, overflow: "hidden", border: "2px solid #dcfce7", boxShadow: "0 4px 20px rgba(22,163,74,.08)" }}>
                  <div style={{ height: 160, position: "relative", background: "linear-gradient(135deg,#0a2e1f,#166534)", overflow: "hidden" }}>
                    {l.image ? <img src={l.image} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 56 }}>🌾</div>}
                    <div style={{ position: "absolute", top: 10, left: 10 }}><Badge text="🟢 Your Listing" color="#16a34a" bg="white" /></div>
                    <button onClick={() => removeUserListing(l.id)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(239,68,68,.9)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", color: "white", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#111827", marginBottom: 4 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>📍 {l.loc} • {l.qty}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 10 }}>🕒 {l.fresh} • 🚚 {l.delivery}</div>
                    {editingListingId === l.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="New price" style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "2px solid #22c55e", fontSize: 14, fontFamily: "inherit" }} />
                        <button onClick={() => saveEditPrice(l.id)} className="btn btn-green" style={{ padding: "8px 14px", fontSize: 13 }}>Save</button>
                        <button onClick={() => setEditingListingId(null)} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "#64748b" }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>₹{l.price.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>per quintal</div>
                        </div>
                        <button onClick={() => { setEditingListingId(l.id); setEditPrice(l.price); }} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid #22c55e", background: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>✏️ Edit Price</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FERTILIZER TAB ─────────────────────────────────────────────── */}
      {tab === "fertilizer" && (
        <div style={{ padding: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {FERTILIZERS.map((f, i) => (
              <div key={f.id} className="fert-card slide-in" style={{ "--i": i, overflow: "hidden" }}>
                <div style={{ height: 160, position: "relative", marginBottom: 16, margin: "-20px -20px 16px -20px" }}>
                  <img src={f.image} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }} className="hover-zoom" />
                  {f.discount && (
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <Badge text={f.discount} color="#c2410c" bg="#ffedd5" />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{f.brand}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#111827", marginBottom: 8 }}>{lang === 'hi' && f.nameHi ? f.nameHi : f.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <Stars n={f.rating} /> <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{f.rating}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>₹{f.price.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{f.unit}</div>
                  </div>
                  <button onClick={() => addCart(f)} disabled={!f.inStock} className="btn btn-green" style={{ padding: "8px 16px", fontSize: 13, opacity: f.inStock ? 1 : 0.5 }}>
                    {f.inStock ? (lang === 'hi' ? "+ जोड़ें" : "+ Add") : (lang === 'hi' ? "आउट ऑफ स्टॉक" : "Out of Stock")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EQUIPMENT TAB ─────────────────────────────────────────────── */}
      {tab === "equipment" && (
        <div style={{ padding: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {EQUIPMENT.map((e, i) => (
              <div key={e.id} className="fert-card slide-in" style={{ "--i": i, overflow: "hidden" }}>
                <div style={{ height: 160, position: "relative", marginBottom: 16, margin: "-20px -20px 16px -20px" }}>
                  <img src={e.image} alt={e.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }} className="hover-zoom" />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{e.brand}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#111827", marginBottom: 8 }}>{lang === 'hi' && e.nameHi ? e.nameHi : e.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <Stars n={e.rating} /> <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>{e.rating}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>₹{e.price.toLocaleString()}</div>
                  <button onClick={() => addCart(e)} disabled={!e.inStock} className="btn btn-green" style={{ padding: "8px 16px", fontSize: 13, opacity: e.inStock ? 1 : 0.5 }}>
                    {e.inStock ? (lang === 'hi' ? "+ जोड़ें" : "+ Add") : (lang === 'hi' ? "आउट ऑफ स्टॉक" : "Out of Stock")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER STYLE OVERRIDE ─────────────────────────────── */}
      <style>{`
        .hover-zoom:hover { transform: scale(1.1); }
      `}</style>

      {/* ── MODALS (inherited from original but light-themed) ────────── */}
      {modalItem && (
        <div className="overlay" onClick={() => setModalItem(null)}>
          <div className="pop-in" style={{ background: "white", borderRadius: 32, width: 620, maxHeight: "90vh", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 280, position: "relative" }}>
              <img src={modalItem.image} alt={modalItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => setModalItem(null)} style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,.3)", backdropFilter: "blur(10px)", border: "none", borderRadius: "50%", width: 44, height: 44, color: "white", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ padding: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#111827" }}>{lang === 'hi' && modalItem.nameHi ? modalItem.nameHi : modalItem.name}</h2>
                <Badge text={modalItem.badge} color="#16a34a" bg="#f0fdf4" />
              </div>
              <p style={{ color: "#64748b", fontWeight: 600, marginBottom: 24 }}>Farmer: {modalItem.farmer} • Region: {modalItem.loc}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                <div style={{ background: "#f8fafc", padding: 20, borderRadius: 20, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Price</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#16a34a" }}>₹{modalItem.price.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{modalItem.unit}</div>
                </div>
                <div style={{ background: "#f8fafc", padding: 20, borderRadius: 20, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Availability</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#334155" }}>{modalItem.qty.split(' ')[0]}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>Quintals Available</div>
                </div>
              </div>
              <button onClick={() => { addCart(modalItem); setModalItem(null); }} className="btn btn-green" style={{ width: "100%", padding: 20, fontSize: 18 }}>🛒 Add to Cart — ₹{modalItem.price.toLocaleString()}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CART PANEL (Partial Fix) ───────────────────────── */}
      {cartOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)", zIndex: 80 }} onClick={() => setCartOpen(false)} />
          <div className="cart-panel pop-in" style={{ zIndex: 90, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900 }}>Your Cart</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
                  <p style={{ color: "#64748b", fontWeight: 600 }}>{lang === 'hi' ? 'आपकी कार्ट खाली है।' : 'Your cart is empty.'}</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 16, marginBottom: 20, background: "#f8fafc", padding: 16, borderRadius: 20 }}>
                  <img src={item.image} style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{lang === 'hi' && item.nameHi ? item.nameHi : item.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>₹{item.price.toLocaleString()}</div>
                  </div>
                  <button onClick={() => removeCart(item.id)} style={{ background: "transparent", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>Total</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>₹{cartTotal.toLocaleString()}</span>
                </div>
                <button className="btn btn-green" style={{ width: "100%", padding: 20, fontSize: 18 }}>Checkout Now</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
