import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { Property, User, SearchFilters, PropertyType, PropertyStatus } from "./types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useCurrency } from "./contexts/CurrencyContext";
import PropertyCard from "./components/PropertyCard";
import CustomMap from "./components/CustomMap";
import UserProfile from "./components/UserProfile";
import AdminDashboard from "./components/AdminDashboard";
import { 
  Search, MapPin, ExternalLink, BedDouble, Bath, Square, ChevronRight, Phone, Mail, Clock, 
  ArrowRight, ShieldCheck, Star, Sparkles, Send, Share2, Heart, User as UserIcon, 
  Lock, Eye, EyeOff, CheckCircle2, ChevronLeft, Calendar, Compass, Shield, Award,
  Leaf, Handshake, Castle, Home, Building2, Layers, Gem, Building, MessageCircle, Map, X
} from "lucide-react";

export default function App() {
  const { t, i18n } = useTranslation();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const [currentPage, setCurrentPage] = useState<string>("home");
  const [navigationParams, setNavigationParams] = useState<Record<string, any>>({});
  const [properties, setProperties] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // Login/Signup Form States
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Search Page States (Shared filters)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("All");
  const [minBathrooms, setMinBathrooms] = useState("All");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Detailed Property Page States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);

  // Description auto-translation
  const [translatedDescription, setTranslatedDescription] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const translationCache = React.useRef<Record<string, string>>({});

  // About & Contact Page Form States
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // Fetch all listings
  const loadProperties = async () => {
    try {
      const res = await fetch("/api/properties");
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error("Error fetching properties", e);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const res = await fetch("/api/meta");
      const data = await res.json();
      if (res.ok) {
        setCities(data.cities || []);
        setPropertyTypes(data.propertyTypes || []);
      }
    } catch (e) {
      console.error("Error fetching metadata", e);
    }
  };

  // Auto-translate description via MyMemory (free, no API key needed)
  const translateDescription = async (text: string, targetLang: string) => {
    if (!text) return;
    // Italian is the source language — no translation needed
    if (targetLang === 'it') {
      setTranslatedDescription(text);
      return;
    }
    const cacheKey = `${targetLang}::${text.slice(0, 40)}`;
    if (translationCache.current[cacheKey]) {
      setTranslatedDescription(translationCache.current[cacheKey]);
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${targetLang}`
      );
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const result = data.responseData.translatedText;
        translationCache.current[cacheKey] = result;
        setTranslatedDescription(result);
      } else {
        setTranslatedDescription(text); // fallback to original
      }
    } catch {
      setTranslatedDescription(text); // fallback on network error
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    loadProperties();
    loadMetadata();

    // Check if user is already logged in (local storage)
    const storedUser = localStorage.getItem("haven_user");
    const storedToken = localStorage.getItem("haven_token");
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setAuthToken(storedToken);
      fetchFavoriteIds(storedToken);
    }

    // Handle hash-based routing
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const [pagePath, queryParams] = hash.slice(1).split('?');
        if (pagePath) {
          setCurrentPage(pagePath);
          if (queryParams) {
            const params = Object.fromEntries(new URLSearchParams(queryParams));
            setNavigationParams(params);
            if (params.filterCity) setFilterCity(params.filterCity);
          } else {
            setNavigationParams({});
          }
        }
      } else {
        setCurrentPage("home");
        setNavigationParams({});
      }
    };
    
    // Call once on mount
    handleHashChange();
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Trigger translation whenever the viewed property or language changes
  useEffect(() => {
    if (currentPage === 'details' && navigationParams.propertyId) {
      const property = properties.find((p) => p.id === navigationParams.propertyId);
      if (property?.description) {
        translateDescription(property.description, i18n.language);
      }
    }
  }, [navigationParams.propertyId, i18n.language, properties, currentPage]);


  const fetchFavoriteIds = async (token: string) => {
    try {
      const res = await fetch("/api/favorites", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFavoriteIds(data.favoriteIds || []);
      }
    } catch (e) {
      console.error("Error loading favorite IDs", e);
    }
  };

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    setNavigationParams(params);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update URL hash
    const searchParams = new URLSearchParams(params);
    const hash = `#${page}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    window.history.pushState(null, '', hash);

    // Handle direct city pre-filtering from links
    if (params.filterCity) {
      setFilterCity(params.filterCity);
    }
    if (params.activeTab) {
      // Used for user profile
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken("");
    setFavoriteIds([]);
    localStorage.removeItem("haven_user");
    localStorage.removeItem("haven_token");
    handleNavigate("home");
  };

  const handleToggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      handleNavigate("login");
      return;
    }

    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyId })
      });
      const data = await res.json();
      if (res.ok) {
        setFavoriteIds(data.favoriteIds || []);
      }
    } catch (err) {
      console.error("Error toggling favorite", err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!authEmail || !authPassword || (!isLoginView && !authUsername)) {
      setAuthError("Please fill out all fields.");
      return;
    }

    const endpoint = isLoginView ? "/api/auth/login" : "/api/auth/signup";
    const payload = isLoginView 
      ? { email: authEmail, password: authPassword }
      : { email: authEmail, username: authUsername, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setCurrentUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem("haven_user", JSON.stringify(data.user));
        localStorage.setItem("haven_token", data.token);
        
        setAuthSuccess(isLoginView ? "Welcome back!" : "Account created successfully!");
        fetchFavoriteIds(data.token);

        setTimeout(() => {
          setAuthEmail("");
          setAuthUsername("");
          setAuthPassword("");
          
          if (data.user.role === "admin") {
            handleNavigate("admin");
          } else {
            handleNavigate("home");
          }
        }, 1500);
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent, property: Property) => {
    e.preventDefault();
    if (!inquiryName || !inquiryEmail || !inquiryMessage) {
      return;
    }

    setSubmittingInquiry(true);
    setInquirySuccess(false);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          name: inquiryName,
          email: inquiryEmail,
          phone: inquiryPhone,
          message: inquiryMessage
        })
      });

      if (res.ok) {
        setInquirySuccess(true);
        setInquiryName("");
        setInquiryEmail("");
        setInquiryPhone("");
        setInquiryMessage("");
      }
    } catch (err) {
      console.error("Error submitting inquiry", err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSuccess(true);
    setContactName("");
    setContactEmail("");
    setContactSubject("");
    setContactMessage("");
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const handleShareClick = (property: Property) => {
    const simUrl = `${window.location.origin}/properties/${property.id}`;
    navigator.clipboard.writeText(simUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filter listings based on current filters and active page (sale or rent)
  const filteredProperties = useMemo(() => {
    const requiredStatus = currentPage === "buy" ? "sale" : currentPage === "rent" ? "rent" : null;

    return properties.filter((prop) => {
      // Filter out unavailable listings unless admin
      if (!prop.available && currentUser?.role !== "admin") return false;

      // Filter by sale/rent status if on appropriate tab
      if (requiredStatus && prop.status !== requiredStatus) return false;

      // Text query (title, description, city, neighborhood, address)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          prop.title.toLowerCase().includes(query) ||
          prop.description.toLowerCase().includes(query) ||
          prop.city.toLowerCase().includes(query) ||
          prop.address.toLowerCase().includes(query) ||
          prop.neighborhood.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // City filter
      if (filterCity !== "All" && prop.city.toLowerCase() !== filterCity.toLowerCase()) {
        return false;
      }

      // Type filter
      if (filterType !== "All" && prop.propertyType.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }

      // Min Price
      if (minPrice && prop.price < Number(minPrice)) return false;

      // Max Price
      if (maxPrice && prop.price > Number(maxPrice)) return false;

      // Bedrooms
      if (minBedrooms !== "All" && prop.bedrooms < Number(minBedrooms)) return false;

      // Bathrooms
      if (minBathrooms !== "All" && prop.bathrooms < Number(minBathrooms)) return false;

      // Amenities checklist
      if (selectedAmenities.length > 0) {
        const hasAll = selectedAmenities.every((amen) => prop.amenities.includes(amen));
        if (!hasAll) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });
  }, [properties, searchQuery, filterCity, filterType, minPrice, maxPrice, minBedrooms, minBathrooms, sortBy, selectedAmenities, currentPage, currentUser]);

  const featuredProperties = useMemo(() => {
    return properties.filter((p) => p.featured && p.available).slice(0, 3);
  }, [properties]);

  const latestProperties = useMemo(() => {
    return properties.filter((p) => p.available).slice(0, 4);
  }, [properties]);

  const handleCategoryClick = (type: PropertyType) => {
    setFilterType(type);
    handleNavigate("buy");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-gray-800">
      {/* Navigation Header */}
      <Navbar 
        currentUser={currentUser} 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        onLogout={handleLogout}
      />

      {/* Main Core Router Panels */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* =======================================================
              1. HOME PAGE
              ======================================================= */}
          {currentPage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-20 pb-20 font-sans"
            >
              {/* Premium Hero Section */}
              <div id="home-hero" className="relative h-[650px] w-full overflow-hidden bg-slate-900 flex items-center">
                {/* Background Image Banner */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80"
                    alt="Luxury Home Haven"
                    className="w-full h-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>

                {/* Hero Text Contents */}
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-3xl space-y-6">
                    <motion.span
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold uppercase tracking-wider"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Redefining Architectural Living
                    </motion.span>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]"
                    >
                      {t('hero.title1')} <span className="text-blue-500">{t('hero.title2')}</span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl"
                    >
                      {t('hero.subtitle')}
                    </motion.p>

                    {/* Integrated Search Console */}
                    <motion.div
                      initial={{ opacity: 0, y: 25 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="p-3 bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl max-w-2xl"
                    >
                      <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 shadow-sm flex flex-col sm:flex-row gap-2">
                        {/* Tab Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                          <button
                            onClick={() => handleNavigate("buy")}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-gray-800 bg-white shadow-xs transition-all"
                          >
                            {t('nav.buy')}
                          </button>
                          <button
                            onClick={() => handleNavigate("rent")}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 transition-all"
                          >
                            {t('nav.rent')}
                          </button>
                        </div>

                        {/* Search Input bar */}
                        <div className="flex-1 flex items-center px-2 min-w-0 border-l sm:border-l border-gray-100">
                          <Search className="w-5 h-5 text-gray-400 shrink-0 mr-2.5" />
                          <input
                            type="text"
                            placeholder={t('hero.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleNavigate("buy")}
                            className="w-full bg-transparent border-0 focus:ring-0 outline-hidden text-sm font-medium text-gray-900 placeholder-gray-400"
                          />
                        </div>

                        <button
                          onClick={() => handleNavigate("buy")}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {t('hero.searchButton')}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Property Categories Grid */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('home.architecturalCollections')}</h2>
                  <p className="text-gray-500 mt-2">{t('home.architecturalDesc')}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
                  {propertyTypes.filter(type => properties.some(p => p.propertyType === type)).map((type) => {
                    const count = properties.filter(p => p.propertyType === type).length;
                    const label = type.charAt(0).toUpperCase() + type.slice(1) + (type.toLowerCase().endsWith("s") || type.toLowerCase().endsWith("ch") || type.toLowerCase().endsWith("sh") ? "" : "s");
                    
                    const getIconForType = (t: string) => {
                      switch (t.toLowerCase()) {
                        case "villa": return <Castle className="w-6 h-6 text-blue-600" />;
                        case "house": return <Home className="w-6 h-6 text-blue-600" />;
                        case "apartment": return <Building2 className="w-6 h-6 text-blue-600" />;
                        case "loft": return <Layers className="w-6 h-6 text-blue-600" />;
                        case "condo": return <Gem className="w-6 h-6 text-blue-600" />;
                        case "townhouse": return <Building className="w-6 h-6 text-blue-600" />;
                        default: return <Home className="w-6 h-6 text-blue-600" />;
                      }
                    };

                    return (
                      <div
                        key={type}
                        onClick={() => handleCategoryClick(type as PropertyType)}
                        className="w-[160px] sm:w-[180px] bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                          {getIconForType(type)}
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{label}</h4>
                        <span className="text-[11px] font-mono text-gray-400 mt-1 block">{count} {t('home.listingsCount')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Featured Properties (Zillow / Airbnb luxury style) */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-10">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('home.curatedShowcases')}</h2>
                    <p className="text-gray-500 mt-2">{t('home.curatedDesc')}</p>
                  </div>
                  <button
                    onClick={() => handleNavigate("buy")}
                    className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    {t('home.viewAll')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-3xl h-80 border border-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : featuredProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredProperties.map((prop) => (
                      <PropertyCard
                        key={prop.id}
                        property={prop}
                        isFavorited={favoriteIds.includes(prop.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onClick={() => handleNavigate("details", { propertyId: prop.id })}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-400">{t('home.noShowcases')}</p>
                  </div>
                )}
              </div>


              {/* Core Statistics Block */}
              <div className="bg-slate-900 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                  <div>
                    <p className="text-4xl sm:text-5xl font-bold text-blue-500 font-mono">12,000+</p>
                    <p className="text-xs sm:text-sm text-slate-400 uppercase font-semibold tracking-wider mt-2">{t('home.stats.transactions')}</p>
                  </div>
                  <div>
                    <p className="text-4xl sm:text-5xl font-bold text-blue-500 font-mono">99.4%</p>
                    <p className="text-xs sm:text-sm text-slate-400 uppercase font-semibold tracking-wider mt-2">{t('home.stats.trust')}</p>
                  </div>
                  <div>
                    <p className="text-4xl sm:text-5xl font-bold text-blue-500 font-mono">24/7</p>
                    <p className="text-xs sm:text-sm text-slate-400 uppercase font-semibold tracking-wider mt-2">{t('home.stats.care')}</p>
                  </div>
                </div>
              </div>

              {/* Latest Listings */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('home.latestAdditions')}</h2>
                  <p className="text-gray-500 mt-2">{t('home.latestDesc')}</p>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-3xl h-80 border border-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : latestProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {latestProperties.map((prop) => (
                      <PropertyCard
                        key={prop.id}
                        property={prop}
                        isFavorited={favoriteIds.includes(prop.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onClick={() => handleNavigate("details", { propertyId: prop.id })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-6">No properties listed.</p>
                )}
              </div>

              {/* Why Choose Us */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                  <div className="space-y-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">{t('about.coreStrengths')}</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{t('about.title')}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {t('about.desc')}
                    </p>

                    <div className="space-y-4 pt-2">
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{t('about.vetted')}</h4>
                          <p className="text-xs text-gray-500 mt-1">{t('about.vettedDesc')}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{t('about.district')}</h4>
                          <p className="text-xs text-gray-500 mt-1">{t('about.districtDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 lg:mt-0 relative aspect-video sm:aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"
                      alt="Elegant Estate Design"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Call to Action Banner */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-blue-600 text-white rounded-3xl p-8 sm:p-16 text-center relative overflow-hidden shadow-xl shadow-blue-100">
                  {/* Decorative glow */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl" />
                  <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-700/30 blur-3xl" />

                  <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">{t('cta.title')}</h2>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                      {t('cta.desc')}
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => handleNavigate("contact")}
                        className="bg-white hover:bg-slate-50 text-blue-600 font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        {t('cta.contactBtn')}
                      </button>
                      <button
                        onClick={() => handleNavigate("about")}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm px-6 py-3.5 rounded-xl border border-blue-500/20 transition-colors cursor-pointer"
                      >
                        {t('cta.learnMoreBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =======================================================
              2. BUY & RENT CATALOGS (WITH INTERACTIVE STREET MAP)
              ======================================================= */}
          {(currentPage === "buy" || currentPage === "rent") && (
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans"
            >
              {/* Header and Counters */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    {currentPage === "buy" ? t('search.titleSale') : t('search.titleRent')}
                  </h1>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Currently showing {filteredProperties.length} active matching listings.
                  </p>
                </div>

                {/* Sorter and City filter shortcuts */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto shrink-0 pb-1 md:pb-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-hidden focus:border-blue-500"
                  >
                    <option value="newest">{t('search.sortNewest')}</option>
                    <option value="oldest">{t('search.sortOldest')}</option>
                    <option value="price_asc">{t('search.sortPriceAsc')}</option>
                    <option value="price_desc">{t('search.sortPriceDesc')}</option>
                  </select>
                </div>
              </div>

              {/* Grid Filter Bar panel */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 mb-8 shadow-xs grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('search.filters')}</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:border-blue-500 outline-hidden"
                    placeholder="e.g. Pool, ocean"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('search.city')}</label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white outline-hidden"
                  >
                    <option value="All">All Cities</option>
                    {cities.filter(c => properties.some(p => p.city === c)).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('search.type')}</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white outline-hidden"
                  >
                    <option value="All">All Types</option>
                    {propertyTypes.filter(type => properties.some(p => p.propertyType === type)).map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1) + (type.toLowerCase().endsWith("s") || type.toLowerCase().endsWith("ch") || type.toLowerCase().endsWith("sh") ? "" : "s")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('search.minPrice')}</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-hidden"
                      placeholder="$ Min"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('search.maxPrice')}</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-hidden"
                      placeholder="$ Max"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('search.minBeds')}</label>
                  <select
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white outline-hidden"
                  >
                    <option value="All">All Beds</option>
                    <option value="1">1+ Beds</option>
                    <option value="2">2+ Beds</option>
                    <option value="3">3+ Beds</option>
                    <option value="4">4+ Beds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Amenities Vibe</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {["Swimming Pool", "Garage", "Furnished"].map((amen) => {
                      const active = selectedAmenities.includes(amen);
                      return (
                        <button
                          key={amen}
                          onClick={() => {
                            if (active) {
                              setSelectedAmenities(selectedAmenities.filter(a => a !== amen));
                            } else {
                              setSelectedAmenities([...selectedAmenities, amen]);
                            }
                          }}
                          className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-colors cursor-pointer ${
                            active 
                              ? "bg-blue-50 border-blue-300 text-blue-600 font-bold" 
                              : "bg-white border-gray-200 text-gray-500"
                          }`}
                        >
                          {amen}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Side-by-Side List and Map Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Listings Grid panel (7 columns) */}
                <div className="lg:col-span-7 space-y-6">
                  {filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {filteredProperties.map((prop) => (
                        <PropertyCard
                          key={prop.id}
                          property={prop}
                          isFavorited={favoriteIds.includes(prop.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onClick={() => handleNavigate("details", { propertyId: prop.id })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-white border border-gray-100 rounded-3xl p-8">
                      <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
                        <Compass className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">No matching properties found</h3>
                      <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">Try widening your price range parameters or adjusting your search queries.</p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterCity("All");
                          setFilterType("All");
                          setMinPrice("");
                          setMaxPrice("");
                          setMinBedrooms("All");
                          setSelectedAmenities([]);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs mt-6 cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Geographical Street Map panel (5 columns) */}
                <div className="lg:col-span-5 relative">
                  <div className="sticky top-20">
                    <CustomMap
                      properties={filteredProperties}
                      onSelectProperty={(prop) => handleNavigate("details", { propertyId: prop.id })}
                      height="h-[520px] lg:h-[620px]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =======================================================
              3. PROPERTY DETAILS VIEW
              ======================================================= */}
          {currentPage === "details" && navigationParams.propertyId && (() => {
            const property = properties.find((p) => p.id === navigationParams.propertyId);
            if (!property) {
              return (
                <div className="py-24 text-center">
                  <p className="text-red-500 font-bold">Property not found.</p>
                  <button onClick={() => handleNavigate("home")} className="text-blue-600 font-semibold mt-4">Back Home</button>
                </div>
              );
            }

            const similarProperties = properties
              .filter((p) => p.id !== property.id && (p.city === property.city || p.propertyType === property.propertyType) && p.available)
              .slice(0, 3);

            return (
              <motion.div
                key="details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans"
              >
                {/* Back Link */}
                <button
                  onClick={() => handleNavigate(property.status === "sale" ? "buy" : "rent")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-6 group transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Properties for {property.status}</span>
                </button>

                {/* Main Headings */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${
                        property.status === "sale" ? "bg-blue-600" : "bg-emerald-600"
                      }`}>
                        For {property.status}
                      </span>
                      {property.featured && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white text-white shrink-0" />
                          <span>Featured Showcase</span>
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold capitalize">
                        {property.propertyType}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900">{property.title}</h1>
                    <p className="flex items-center gap-1.5 text-sm sm:text-base text-gray-500 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <a 
                        href={property.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline inline-flex items-center gap-1 group/link cursor-pointer text-slate-700"
                        title="Open address in Google Maps"
                      >
                        <span className="font-medium">{property.address}, {property.neighborhood}, {property.city}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity text-blue-500 shrink-0" />
                      </a>
                    </p>
                  </div>

                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Premium Valuation</p>
                    <p className="text-2xl sm:text-4xl font-bold text-gray-900 mt-1 font-sans">
                      {formatPrice(property.price, property.status)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Estimates based on prime local indices</p>
                  </div>
                </div>

                {/* Gorgeous Sliding Image Gallery */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-150 shadow-xl mb-10 group aspect-video sm:aspect-21/9 max-h-[500px]">
                  <img
                    src={property.images[activeImageIndex] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"}
                    alt={property.title}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />

                  {/* Left & Right Gallery Arrows */}
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-gray-800 flex items-center justify-center shadow-md transition-colors focus:outline-hidden"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs text-gray-800 flex items-center justify-center shadow-md transition-colors focus:outline-hidden"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Favorite and Share Overlay Buttons */}
                  <div className="absolute top-6 right-6 flex gap-2.5 z-10">
                    <button
                      onClick={() => handleShareClick(property)}
                      className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white backdrop-blur-xs text-gray-700 flex items-center justify-center shadow-md transition-colors font-semibold"
                      title="Copy simulated link"
                    >
                      {copiedLink ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={(e) => handleToggleFavorite(property.id, e)}
                      className="w-10 h-10 rounded-xl bg-white/90 hover:bg-white backdrop-blur-xs flex items-center justify-center shadow-md transition-colors"
                    >
                      <Heart className={`w-5 h-5 transition-transform active:scale-125 ${
                        favoriteIds.includes(property.id) ? "fill-red-500 text-red-500" : "text-gray-700"
                      }`} />
                    </button>
                    {property.blueprintUrl && (
                      <button
                        onClick={() => setShowBlueprintModal(true)}
                        className="px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors font-bold text-sm"
                      >
                        <Map className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 shrink-0" />
                        {t('property.viewBlueprint')}
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Row Indicator overlay */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-slate-950/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-lg">
                    {property.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          activeImageIndex === idx ? "bg-white w-5" : "bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Two-Column Specs & Inquiry Booking Block */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  {/* Left Column: Specs, description & localized street map (8 columns) */}
                  <div className="lg:col-span-8 space-y-10">
                    {/* Basic Grid specs bar */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs grid grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col items-center">
                        <BedDouble className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xl font-bold text-gray-900 font-mono">{property.bedrooms}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('propertyDetail.bedrooms')}</span>
                      </div>
                      <div className="flex flex-col items-center border-l border-r border-gray-100">
                        <Bath className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xl font-bold text-gray-900 font-mono">{property.bathrooms}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('propertyDetail.bathrooms')}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Square className="w-5.5 h-5.5 text-gray-400 mb-1" />
                        <span className="text-xl font-bold text-gray-900 font-mono">{property.area}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('propertyDetail.squareMeters')}</span>
                      </div>
                    </div>

                    {/* Editorial Description */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-bold text-xl text-gray-900 tracking-tight">{t('propertyDetail.descriptionTitle')}</h3>
                        {i18n.language !== 'it' && (
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest shrink-0">
                            {isTranslating ? '⟳ Translating...' : '🌐 Auto-translated'}
                          </span>
                        )}
                      </div>
                      {isTranslating ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-3.5 bg-gray-100 rounded-full w-full" />
                          <div className="h-3.5 bg-gray-100 rounded-full w-5/6" />
                          <div className="h-3.5 bg-gray-100 rounded-full w-4/5" />
                          <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-sans">
                          {translatedDescription || property.description}
                        </p>
                      )}
                    </div>

                    {/* Premium Amenities List */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-xl text-gray-900 tracking-tight">{t('propertyDetail.amenitiesTitle')}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {property.amenities.map((amen) => (
                          <div
                            key={amen}
                            className="flex items-center gap-2.5 p-3.5 bg-white border border-gray-100 rounded-2xl shadow-2xs font-sans text-xs sm:text-sm font-semibold text-gray-700 hover:border-gray-200 transition-colors"
                          >
                            <span className="text-lg">✦</span>
                            <span>{amen}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Local Area Map */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-xl text-gray-900 tracking-tight">{t('propertyDetail.mapTitle')}</h3>
                        <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">{t('propertyDetail.mapSubtitle')}</span>
                      </div>
                      <CustomMap
                        properties={[property]}
                        selectedProperty={property}
                        height="h-[320px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Broker Inquiry Booking (4 columns) */}
                  <div className="lg:col-span-4 sticky top-24">
                    {/* Blueprint Button */}
                    {property.blueprintUrl && (
                      <button
                        onClick={() => setShowBlueprintModal(true)}
                        className="w-full mb-4 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-base shadow-lg transition-all duration-200"
                      >
                        <Map className="w-5 h-5 shrink-0" />
                        {t('property.viewBlueprint')}
                      </button>
                    )}
                    <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-md">
                      <div className="flex gap-4 pb-5 border-b border-gray-100 mb-6 items-center">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-150 shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
                            alt="Broker Agent"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('propertyDetail.brokerTitle')}</p>
                          <h4 className="font-bold text-base text-gray-900">Vanessa Sterling</h4>
                          <p className="text-xs text-gray-400">{t('propertyDetail.brokerRole')}</p>
                        </div>
                      </div>

                      {inquirySuccess ? (
                        <div className="p-5 rounded-2xl bg-green-50 border border-green-150 text-center space-y-4 py-8">
                          <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto shadow-md">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-green-900 text-base">{t('propertyDetail.successTitle')}</h4>
                          <p className="text-xs text-green-700 leading-relaxed">
                            {t('propertyDetail.successMsg')}
                          </p>
                          <button
                            onClick={() => setInquirySuccess(false)}
                            className="text-xs font-bold text-green-800 hover:underline cursor-pointer"
                          >
                            {t('propertyDetail.sendAnother')}
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleInquirySubmit(e, property)} className="space-y-4">
                          <h4 className="font-bold text-sm text-gray-900 mb-3">{t('propertyDetail.inquiryFormTitle')}</h4>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('propertyDetail.labelName')}</label>
                            <input
                              type="text"
                              required
                              value={inquiryName}
                              onChange={(e) => setInquiryName(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900"
                              placeholder={t('propertyDetail.placeholderName')}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('propertyDetail.labelEmail')}</label>
                            <input
                              type="email"
                              required
                              value={inquiryEmail}
                              onChange={(e) => setInquiryEmail(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900"
                              placeholder={t('propertyDetail.placeholderEmail')}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('propertyDetail.labelPhone')}</label>
                            <input
                              type="tel"
                              value={inquiryPhone}
                              onChange={(e) => setInquiryPhone(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900"
                              placeholder={t('propertyDetail.placeholderPhone')}
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{t('propertyDetail.labelMessage')}</label>
                            <textarea
                              rows={3}
                              required
                              value={inquiryMessage}
                              onChange={(e) => setInquiryMessage(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-gray-900 leading-relaxed"
                              placeholder={t('propertyDetail.placeholderMessage')}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingInquiry}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm py-3 rounded-xl shadow-md cursor-pointer transition-colors"
                          >
                            {submittingInquiry ? t('propertyDetail.submittingBtn') : t('propertyDetail.submitBtn')}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                {/* Similar Properties Showcase list */}
                {similarProperties.length > 0 && (
                  <div className="mt-20 pt-16 border-t border-gray-150">
                    <h3 className="font-bold text-2xl text-gray-900 tracking-tight mb-8">{t('propertyDetail.similarTitle')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {similarProperties.map((prop) => (
                        <PropertyCard
                          key={prop.id}
                          property={prop}
                          isFavorited={favoriteIds.includes(prop.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onClick={() => handleNavigate("details", { propertyId: prop.id })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* =======================================================
              4. ABOUT US PAGE
              ======================================================= */}
          {currentPage === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-sans space-y-20"
            >
              {/* Mission Statement Hero */}
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">{t('aboutPage.subtitle')}</span>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">{t('aboutPage.title')}</h1>
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                  {t('aboutPage.desc1')}
                </p>
              </div>

              {/* Story Splits Block */}
              <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
                <div className="relative aspect-video sm:aspect-4/3 rounded-3xl overflow-hidden shadow-xl border border-gray-150">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                    alt="Corporate Workspace Design"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-6 mt-8 lg:mt-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('aboutPage.subtitle2')}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t('aboutPage.desc2')}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t('aboutPage.desc3')}
                  </p>

                  <div className="grid grid-cols-3 gap-4 text-center pt-4">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-1">
                        <Award className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="block font-bold text-base text-gray-900 font-mono">14+</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('aboutPage.awards')}</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
                        <Leaf className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="block font-bold text-base text-gray-900 font-mono">82%</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('aboutPage.eco')}</span>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1">
                        <Handshake className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="block font-bold text-base text-gray-900 font-mono">100%</span>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{t('aboutPage.escrow')}</span>
                    </div>
                  </div>
                </div>
              </div>


            </motion.div>
          )}

          {/* =======================================================
              5. CONTACT US PAGE
              ======================================================= */}
          {currentPage === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-sans space-y-12"
            >
              <div className="text-center max-w-3xl mx-auto space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Get In Touch</span>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-none">Connect with Our Offices</h1>
                <p className="text-gray-500 text-sm sm:text-base mt-2">Have a question? Drop us a brief, and our specialty agents will reach out instantly.</p>
              </div>

              {/* Two Column Layout: Contact Form & Coordinates list */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-md">
                  {contactSuccess ? (
                    <div className="p-6 rounded-2xl bg-green-50 border border-green-100 text-center py-10 space-y-4">
                      <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-green-950 text-lg">Message Delivered Successfully</h4>
                      <p className="text-sm text-green-700 max-w-sm mx-auto">
                        Thank you for your brief. A specialized Broker associated with your district will reach out within 1 business hour.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">My Full Name</label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 text-sm text-gray-900"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">My Email Address</label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 text-sm text-gray-900"
                            placeholder="e.g. john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subject Vibe</label>
                        <input
                          type="text"
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 text-sm text-gray-900"
                          placeholder="e.g. Land sale inquiry"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">My Message Brief</label>
                        <textarea
                          rows={4}
                          required
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-blue-500 text-sm text-gray-900 leading-relaxed"
                          placeholder="Tell us about your relocation requirements..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl shadow-md cursor-pointer transition-colors"
                      >
                        Submit Contact Inquiry
                      </button>
                    </form>
                  )}
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* Office Hours / Coordinates info card */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800">
                    <h3 className="font-bold text-lg mb-4">Sede Centrale</h3>
                    <div className="space-y-4 text-sm text-slate-300">
                      <p className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Bergamo (BG), Via San Bernardino 7/B</span>
                      </p>
                      <p className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                        <a href="tel:+393896408184" className="hover:text-blue-400 transition-colors">389 6408184</a>
                      </p>
                      <p className="flex items-center gap-3">
                        <MessageCircle className="w-4 h-4 text-blue-400 shrink-0" />
                        <a href="https://wa.me/393896408184" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">WhatsApp: 389 6408184</a>
                      </p>
                      <p className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                        <a href="mailto:immobiliare@bnbg.it" className="hover:text-blue-400 transition-colors">immobiliare@bnbg.it</a>
                      </p>
                    </div>

                    <hr className="border-slate-800 my-6" />

                    <h4 className="font-bold text-sm mb-2 text-white">Office Operating Hours</h4>
                    <ul className="text-xs space-y-1.5 text-slate-400">
                      <li>Monday - Friday: 8:00 AM - 7:00 PM</li>
                      <li>Saturday: 9:00 AM - 5:00 PM (Relocation tours)</li>
                      <li>Sunday: Closed (Broker helpline online)</li>
                    </ul>
                  </div>

                  {/* Visual Map Context */}
                  <div className="rounded-3xl overflow-hidden border border-gray-150 bg-slate-100 aspect-video shadow-xs">
                    <iframe
                      src="https://maps.google.com/maps?q=Via%20San%20Bernardino%207/B,%20Bergamo&t=&z=15&ie=UTF8&iwloc=&output=embed"
                      className="w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =======================================================
              6. AUTHENTICATION (LOGIN / SIGN UP)
              ======================================================= */}
          {currentPage === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto px-4 py-16 font-sans"
            >
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl">
                {/* Header Toggle */}
                <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
                  <button
                    id="auth-toggle-login"
                    onClick={() => {
                      setIsLoginView(true);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isLoginView ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    id="auth-toggle-signup"
                    onClick={() => {
                      setIsLoginView(false);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isLoginView ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Status messages */}
                {authSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 flex items-center gap-2 text-green-700 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{authSuccess}</span>
                  </div>
                )}

                {authError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-700 text-xs">
                    <Shield className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">
                      {isLoginView ? "Welcome back to BNBG" : "Create your free account"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isLoginView 
                        ? "Enter your credentials to manage properties or saved lists" 
                        : "Gain instant access to listings saving and inquiries."}
                    </p>
                  </div>

                  {!isLoginView && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-hidden focus:border-blue-500"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-hidden focus:border-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-hidden focus:border-blue-500"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-colors cursor-pointer pt-3"
                  >
                    {isLoginView ? "Sign In" : "Sign Up"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* =======================================================
              7. USER PROFILE PANEL (FAVORITES AND ACCOUNT SETTINGS)
              ======================================================= */}
          {currentPage === "profile" && currentUser && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <UserProfile
                currentUser={currentUser}
                authToken={authToken}
                onNavigate={handleNavigate}
                onUpdateUser={(updated) => {
                  setCurrentUser(updated);
                  localStorage.setItem("haven_user", JSON.stringify(updated));
                }}
                initialTab={navigationParams.activeTab || "profile"}
              />
            </motion.div>
          )}

          {/* =======================================================
              8. ADMIN DASHBOARD COMMAND CENTER
              ======================================================= */}
          {currentPage === "admin" && currentUser?.role === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard 
                authToken={authToken} 
                onNavigate={handleNavigate} 
                cities={cities}
                propertyTypes={propertyTypes}
                onRefreshMetadata={loadMetadata}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Footer component */}
      <Footer onNavigate={handleNavigate} />

      {/* Blueprint Modal */}
      <AnimatePresence>
        {showBlueprintModal && (() => {
          const prop = properties.find((p) => p.id === navigationParams.propertyId);
          return prop?.blueprintUrl ? (
            <motion.div
              key="blueprint-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowBlueprintModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900 text-lg">{t('property.viewBlueprint')} — {prop.title}</h3>
                  </div>
                  <button
                    onClick={() => setShowBlueprintModal(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="overflow-auto max-h-[80vh] p-4 bg-gray-50">
                  <img
                    src={prop.blueprintUrl}
                    alt={`${prop.title} blueprint`}
                    className="w-full h-auto rounded-xl object-contain"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : null;
        })()}
      </AnimatePresence>
    </div>
  );
}
