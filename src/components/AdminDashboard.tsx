import React, { useState, useEffect, useRef } from "react";
import { Property, Inquiry, DashboardStats, PropertyType, PropertyStatus } from "../types";
import { Plus, Edit, Trash2, Mail, BarChart3, Building, MessageSquare, Clipboard, Sparkles, CheckCircle, CheckCircle2, HelpCircle, Loader2, RefreshCw, X, Trash, Upload, Link, Phone } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";

interface AdminDashboardProps {
  authToken: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  cities?: string[];
  propertyTypes?: string[];
  onRefreshMetadata?: () => void;
}

const parseLatLngFromGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  if (!url) return null;
  const regexes = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /place\/.*?\/@?(-?\d+\.\d+),(-?\d+\.\d+)/,
    /ll=(-?\d+\.\d+),(-?\d+\.\d+)/
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  }
  return null;
};

const getCityDefaults = (cityName: string) => {
  switch (cityName) {
    case "Miami": return { lat: 25.7617, lng: -80.1918 };
    case "New York": return { lat: 40.7128, lng: -74.0060 };
    case "San Francisco": return { lat: 37.7749, lng: -122.4194 };
    case "Austin": return { lat: 30.2672, lng: -97.7431 };
    case "Seattle": return { lat: 47.6062, lng: -122.3321 };
    default: return { lat: 37.7749, lng: -122.4194 };
  }
};

export default function AdminDashboard({ 
  authToken, 
  onNavigate,
  cities = ["Miami", "New York", "San Francisco", "Austin", "Seattle"],
  propertyTypes = ["villa", "house", "apartment", "loft", "condo", "townhouse"],
}: AdminDashboardProps) {
  const { formatPrice, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState<"stats" | "properties" | "inquiries" | "metadata">("stats");

  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State for Add/Edit Listing
  const [showForm, setShowForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priceCurrency, setPriceCurrency] = useState<"USD"|"EUR">("USD");
  const [status, setStatus] = useState<PropertyStatus>("sale");
  const [propertyType, setPropertyType] = useState<PropertyType>(propertyTypes[0] || "villa");
  const [address, setAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [blueprintUrl, setBlueprintUrl] = useState("");
  const [city, setCity] = useState(cities[0] || "Miami");
  const [neighborhood, setNeighborhood] = useState("");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [area, setArea] = useState("200");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [available, setAvailable] = useState(true);
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Generation State
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [aiError, setAiError] = useState("");

  // Metadata management state
  const [newCityInput, setNewCityInput] = useState("");
  const [newTypeInput, setNewTypeInput] = useState("");
  const [editingCityIndex, setEditingCityIndex] = useState<number | null>(null);
  const [editingCityValue, setEditingCityValue] = useState("");
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [editingTypeValue, setEditingTypeValue] = useState("");
  const [metaActionLoading, setMetaActionLoading] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [metaSuccess, setMetaSuccess] = useState("");

  const CITIES = cities;
  const TYPES = propertyTypes;
  const STANDARD_AMENITIES = ["Swimming Pool", "Garage", "Garden", "Parking", "Furnished", "Balcony", "Fireplace", "Smart Home System"];

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${authToken}` };

      const [resProps, resInqs, resStats] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/inquiries", { headers }),
        fetch("/api/stats", { headers })
      ]);

      const dataProps = await resProps.json();
      const dataInqs = await resInqs.json();
      const dataStats = await resStats.json();

      if (resProps.ok) setProperties(dataProps.properties || []);
      if (resInqs.ok) setInquiries(dataInqs.inquiries || []);
      if (resStats.ok) setStats(dataStats.stats || null);
    } catch (err) {
      console.error("Error fetching admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenAddForm = () => {
    setEditingPropertyId(null);
    setTitle("");
    setPrice("1500000");
    setPriceCurrency(currency as "USD"|"EUR");
    setStatus("sale");
    setPropertyType("villa");
    setAddress("");
    setGoogleMapsUrl("");
    setBlueprintUrl("");
    setCity("Miami");
    setNeighborhood("");
    setBedrooms("4");
    setBathrooms("3.5");
    setArea("350");
    setDescription("");
    setFeatured(false);
    setAvailable(true);
    setAmenities(["Swimming Pool", "Garage", "Parking"]);
    setImages([
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ]);
    setAiError("");
    setShowForm(true);
  };

  const handleOpenEditForm = (prop: Property) => {
    setEditingPropertyId(prop.id);
    setTitle(prop.title);
    
    // Convert DB price (always USD) to the currently selected global currency for editing
    const displayPrice = currency === "EUR" ? prop.price * 0.92 : prop.price;
    setPrice(String(Math.round(displayPrice)));
    setPriceCurrency(currency as "USD"|"EUR");
    
    setStatus(prop.status);
    setPropertyType(prop.propertyType);
    setAddress(prop.address);
    setGoogleMapsUrl(prop.googleMapsUrl || "");
    setBlueprintUrl(prop.blueprintUrl || "");
    setCity(prop.city);
    setNeighborhood(prop.neighborhood);
    setBedrooms(String(prop.bedrooms));
    setBathrooms(String(prop.bathrooms));
    setArea(String(prop.area));
    setDescription(prop.description);
    setFeatured(prop.featured);
    setAvailable(prop.available);
    setAmenities(prop.amenities);
    setImages(prop.images);
    setAiError("");
    setShowForm(true);
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !images.includes(imageInput.trim())) {
      setImages([...images, imageInput.trim()]);
      setImageInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = (files: FileList) => {
    setUploadError("");
    const maxFiles = 10;
    if (images.length + files.length > maxFiles) {
      setUploadError(`You can upload a maximum of ${maxFiles} images.`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select valid image files.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setUploadError("Each image must be smaller than 8MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            try {
              const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
              setImages((prev) => [...prev, dataUrl]);
            } catch (err) {
              setImages((prev) => [...prev, event.target?.result as string]);
            }
          } else {
            setImages((prev) => [...prev, event.target?.result as string]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !address || !city) return;

    setActionLoading(true);

    // Determine correct coordinates with fallback
    let lat = 37.7749;
    let lng = -122.4194;

    if (editingPropertyId) {
      const existing = properties.find((p) => p.id === editingPropertyId);
      if (existing) {
        lat = existing.latitude;
        lng = existing.longitude;
      }
    } else {
      const defaults = getCityDefaults(city);
      lat = defaults.lat;
      lng = defaults.lng;
    }

    // Try to extract from custom google maps url if specified
    const parsedCoords = parseLatLngFromGoogleMapsUrl(googleMapsUrl);
    if (parsedCoords) {
      lat = parsedCoords.lat;
      lng = parsedCoords.lng;
    }

    // Convert price back to USD for the database if they selected EUR
    const numericPrice = Number(price);
    const finalPriceInUsd = priceCurrency === "EUR" ? Math.round(numericPrice / 0.92) : numericPrice;

    const payload = {
      title,
      price: finalPriceInUsd,
      status,
      propertyType,
      address,
      city,
      neighborhood,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      area: Number(area),
      description,
      featured,
      available,
      amenities,
      images: images.length > 0 ? images : [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
      ],
      latitude: lat,
      longitude: lng,
      googleMapsUrl: googleMapsUrl.trim() || undefined,
      blueprintUrl: blueprintUrl.trim() || undefined
    };

    try {
      const url = editingPropertyId ? `/api/properties/${editingPropertyId}` : "/api/properties";
      const method = editingPropertyId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        loadDashboardData();
      }
    } catch (err) {
      console.error("Error saving property", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing permanently?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Error deleting property", err);
    } finally {
      setActionLoading(false);
    }
  };

  const showMetaSuccess = (msg: string) => {
    setMetaSuccess(msg);
    setMetaError("");
    setTimeout(() => setMetaSuccess(""), 4000);
  };

  const showMetaError = (msg: string) => {
    setMetaError(msg);
    setMetaSuccess("");
    setTimeout(() => setMetaError(""), 4000);
  };

  const handleAddCity = async () => {
    const val = newCityInput.trim();
    if (!val) return;
    if (cities.some(c => c.toLowerCase() === val.toLowerCase())) {
      showMetaError("This City Hub already exists!");
      return;
    }

    setMetaActionLoading(true);
    try {
      const res = await fetch("/api/meta/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ cities: [...cities, val] })
      });
      if (res.ok) {
        setNewCityInput("");
        onRefreshMetadata?.();
        showMetaSuccess(`City "${val}" added successfully!`);
      } else {
        const d = await res.json();
        showMetaError(d.error || "Failed to add City Hub");
      }
    } catch (e: any) {
      showMetaError(e.message || "Network error");
    } finally {
      setMetaActionLoading(false);
    }
  };

  const handleSaveEditCity = async (index: number) => {
    const val = editingCityValue.trim();
    if (!val) return;
    if (cities.some((c, i) => i !== index && c.toLowerCase() === val.toLowerCase())) {
      showMetaError("This City Hub already exists!");
      return;
    }

    setMetaActionLoading(true);
    try {
      const updatedCities = [...cities];
      updatedCities[index] = val;
      const res = await fetch("/api/meta/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ cities: updatedCities })
      });
      if (res.ok) {
        setEditingCityIndex(null);
        setEditingCityValue("");
        onRefreshMetadata?.();
        showMetaSuccess("City Hub updated successfully!");
      } else {
        const d = await res.json();
        showMetaError(d.error || "Failed to update City Hub");
      }
    } catch (e: any) {
      showMetaError(e.message || "Network error");
    } finally {
      setMetaActionLoading(false);
    }
  };

  const handleDeleteCity = async (cityName: string) => {
    const propertyCount = properties.filter(p => p.city === cityName).length;
    if (propertyCount > 0) {
      if (!confirm(`Warning: There are ${propertyCount} listings in "${cityName}". Deleting this hub may leave them without a city district assignment. Proceed anyway?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to remove "${cityName}"?`)) return;
    }

    setMetaActionLoading(true);
    try {
      const updatedCities = cities.filter(c => c !== cityName);
      const res = await fetch("/api/meta/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ cities: updatedCities })
      });
      if (res.ok) {
        onRefreshMetadata?.();
        showMetaSuccess(`City Hub "${cityName}" removed successfully.`);
      } else {
        const d = await res.json();
        showMetaError(d.error || "Failed to remove City Hub");
      }
    } catch (e: any) {
      showMetaError(e.message || "Network error");
    } finally {
      setMetaActionLoading(false);
    }
  };

  const handleAddType = async () => {
    const val = newTypeInput.trim().toLowerCase();
    if (!val) return;
    if (propertyTypes.some(t => t.toLowerCase() === val.toLowerCase())) {
      showMetaError("This Property Type already exists!");
      return;
    }

    setMetaActionLoading(true);
    try {
      const res = await fetch("/api/meta/property-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyTypes: [...propertyTypes, val] })
      });
      if (res.ok) {
        setNewTypeInput("");
        onRefreshMetadata?.();
        showMetaSuccess(`Property Type "${val}" added successfully!`);
      } else {
        const d = await res.json();
        showMetaError(d.error || "Failed to add Property Type");
      }
    } catch (e: any) {
      showMetaError(e.message || "Network error");
    } finally {
      setMetaActionLoading(false);
    }
  };

  const handleSaveEditType = async (index: number) => {
    const val = editingTypeValue.trim().toLowerCase();
    if (!val) return;
    if (propertyTypes.some((t, i) => i !== index && t.toLowerCase() === val.toLowerCase())) {
      showMetaError("This Property Type already exists!");
      return;
    }

    setMetaActionLoading(true);
    try {
      const updatedTypes = [...propertyTypes];
      updatedTypes[index] = val;
      const res = await fetch("/api/meta/property-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyTypes: updatedTypes })
      });
      if (res.ok) {
        setEditingTypeIndex(null);
        setEditingTypeValue("");
        onRefreshMetadata?.();
        showMetaSuccess("Property Type updated successfully!");
      } else {
        const d = await res.json();
        showMetaError(d.error || "Failed to update Property Type");
      }
    } catch (e: any) {
      showMetaError(e.message || "Network error");
    } finally {
      setMetaActionLoading(false);
    }
  };

  const handleDeleteType = async (typeName: string) => {
    const propertyCount = properties.filter(p => p.propertyType === typeName).length;
    if (propertyCount > 0) {
      if (!confirm(`Warning: There are ${propertyCount} listings typed as "${typeName}". Deleting this type may affect their search and category filtering. Proceed anyway?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to remove the "${typeName}" property type?`)) return;
    }

    setMetaActionLoading(true);
    try {
      const updatedTypes = propertyTypes.filter(t => t !== typeName);
      const res = await fetch("/api/meta/property-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyTypes: updatedTypes })
      });
      if (res.ok) {
        onRefreshMetadata?.();
        showMetaSuccess(`Property Type "${typeName}" removed successfully.`);
      } else {
        const d = await res.json();
        showMetaError(d.error || "Failed to remove Property Type");
      }
    } catch (e: any) {
      showMetaError(e.message || "Network error");
    } finally {
      setMetaActionLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, newStatus: "new" | "contacted" | "resolved") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inquiries/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Error updating inquiry", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm("Delete this inquiry record?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Error deleting inquiry", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Uses server-side Gemini to generate listing copy based on current form fields
  const handleGenerateAIDescription = async () => {
    if (!title) {
      setAiError("Please fill out the Property Title before generating description");
      return;
    }
    setGeneratingDescription(true);
    setAiError("");

    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title,
          propertyType,
          city,
          neighborhood,
          bedrooms,
          bathrooms,
          price: Number(price) || 0,
          status,
          amenities
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDescription(data.description);
      } else {
        setAiError(data.error || "AI Generation currently unavailable.");
      }
    } catch (err) {
      setAiError("An error occurred during AI content generation.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <div id="admin-dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans min-h-[600px]">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agent Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Manage luxury properties, follow up on client inquiries, and view analytics.</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add New Property
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2.5 ${
            activeTab === "stats"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Market Analytics
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2.5 ${
            activeTab === "properties"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Building className="w-4 h-4" />
          Active Listings ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2.5 ${
            activeTab === "inquiries"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => setActiveTab("metadata")}
          className={`px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2.5 ${
            activeTab === "metadata"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Clipboard className="w-4 h-4" />
          Hubs & Types Manager
        </button>
      </div>

      {/* General Loader */}
      {loading && !showForm && (
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm mt-3 font-medium">Syncing database registers...</p>
        </div>
      )}

      {/* TAB: MARKET ANALYTICS STATS */}
      {!loading && activeTab === "stats" && stats && (
        <div id="analytics-tab-panel" className="space-y-8 animate-in fade-in duration-250">
          {/* Bento Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Listings</span>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProperties}</p>
              <div className="flex gap-4 mt-3 text-xs font-mono text-gray-500">
                <span className="text-blue-600 font-bold">{stats.activeSales} Sales</span>
                <span className="text-emerald-600 font-bold">{stats.activeRentals} Rentals</span>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg House Value</span>
              <p className="text-3xl font-bold text-gray-900 mt-1">${stats.averagePriceSale.toLocaleString()}</p>
              <span className="inline-block text-[10px] text-gray-400 font-mono mt-3">From all active sale listings</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Monthly Rent</span>
              <p className="text-3xl font-bold text-gray-900 mt-1">${stats.averagePriceRent.toLocaleString()}/mo</p>
              <span className="inline-block text-[10px] text-gray-400 font-mono mt-3">From all active lease properties</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client Inquiries</span>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalInquiries}</p>
              <div className="flex items-center gap-1.5 mt-3 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-600 font-bold">{stats.newInquiries} New Messages</span>
              </div>
            </div>
          </div>

          {/* Custom SVG Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart 1: Inquiry Trends (6 Months) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs lg:col-span-2">
              <h3 className="font-bold text-base text-gray-900 mb-1">Inquiry Velocity</h3>
              <p className="text-xs text-gray-500 mb-6">Customer inquiries received across the last 6 months</p>

              <div className="h-64 w-full relative">
                <svg viewBox="0 0 500 220" className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1="40" y1="40" x2="480" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="90" x2="480" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="180" x2="480" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Y Axis Labels */}
                  <text x="25" y="44" fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">10</text>
                  <text x="25" y="94" fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">5</text>
                  <text x="25" y="144" fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">2</text>
                  <text x="25" y="184" fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">0</text>

                  {/* Draw Bar Data */}
                  {stats.monthlyInquiries.map((m, idx) => {
                    const x = 60 + idx * 75;
                    const val = m.count;
                    // Max height 140 (from y: 40 to y: 180)
                    const height = Math.min(140, (val / 10) * 140);
                    const y = 180 - height;

                    return (
                      <g key={idx}>
                        {/* Glowing shadow */}
                        <rect
                          x={x}
                          y={y}
                          width="32"
                          height={height}
                          rx="6"
                          fill="url(#blueGrad)"
                        />
                        {/* Tag text */}
                        {val > 0 && (
                          <text
                            x={x + 16}
                            y={y - 8}
                            fill="#1e3a8a"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="JetBrains Mono"
                          >
                            {val}
                          </text>
                        )}
                        {/* Month text */}
                        <text
                          x={x + 16}
                          y="202"
                          fill="#64748b"
                          fontSize="9.5"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {m.month}
                        </text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Chart 2: Listings by City */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
              <h3 className="font-bold text-base text-gray-900 mb-1">Geographic Spread</h3>
              <p className="text-xs text-gray-500 mb-6">Distribution of active listings by metropolitan hub</p>

              <div className="space-y-4">
                {Object.entries(stats.byCity).map(([city, count], idx) => {
                  const pct = Math.round(((count as number) / stats.totalProperties) * 100);
                  const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600"];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={city} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm font-sans">
                        <span className="font-semibold text-gray-700">{city}</span>
                        <span className="text-gray-400 font-mono text-xs">{count} properties ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-50 overflow-hidden border border-gray-100">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACTIVE LISTINGS TABLE */}
      {!loading && activeTab === "properties" && (
        <div id="properties-tab-panel" className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="px-6 py-5 border-b border-gray-50 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-900">Active Listings Management</h3>
              <p className="text-xs text-gray-400 mt-0.5">Edit detailed property specs or delete outdated listings.</p>
            </div>
            <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-bold">
              {properties.length} Total Properties Saved
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6">Property Name</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Status / Price</th>
                  <th className="py-4 px-6">Availability</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={prop.images[0]}
                          alt=""
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-gray-100"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate max-w-[200px]">{prop.title}</p>
                          <p className="font-mono text-[10px] text-gray-400">{prop.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-gray-800">{prop.city}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{prop.neighborhood || "General"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize px-2 py-0.5 rounded-md text-xs bg-slate-100 text-gray-600 font-medium">
                        {prop.propertyType}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">
                        {formatPrice(prop.price, prop.status)}
                      </p>
                      <span className={`inline-block text-[10px] font-bold uppercase ${prop.status === "sale" ? "text-blue-600" : "text-emerald-600"}`}>
                        For {prop.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        prop.available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${prop.available ? "bg-green-500" : "bg-red-500"}`} />
                        {prop.available ? "Available" : "Archived"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditForm(prop); }}
                        className="p-1.5 rounded-lg border border-gray-100 hover:bg-gray-100 text-gray-600 transition-colors inline-flex items-center cursor-pointer"
                        title="Edit Listing"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProperty(prop.id); }}
                        className="p-1.5 rounded-lg border border-red-50 hover:bg-red-50 text-red-600 transition-colors inline-flex items-center cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: INQUIRIES LIST */}
      {!loading && activeTab === "inquiries" && (
        <div id="inquiries-tab-panel" className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs animate-in fade-in duration-200">
          <div className="px-6 py-5 border-b border-gray-50 bg-slate-50">
            <h3 className="font-bold text-base text-gray-900">Customer Inquiries</h3>
            <p className="text-xs text-gray-400 mt-0.5">Track visitor messages, follow up, or archive resolved inquiries.</p>
          </div>

          {inquiries.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full tracking-wider uppercase ${
                        inq.status === "new"
                          ? "bg-red-100 text-red-700"
                          : inq.status === "contacted"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {inq.status}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        Received on {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-sans font-bold text-base text-gray-900">
                      Message from <span className="text-blue-600">{inq.name}</span>
                    </h4>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium items-center">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{inq.email}</span>
                      </span>
                      {inq.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{inq.phone}</span>
                        </span>
                      )}
                      <span 
                        onClick={() => onNavigate("details", { propertyId: inq.propertyId })}
                        className="text-blue-600 hover:underline cursor-pointer font-semibold"
                      >
                        Listing: {inq.propertyTitle}
                      </span>
                    </div>

                    <blockquote className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-gray-600 leading-relaxed max-w-2xl font-sans italic">
                      "{inq.message}"
                    </blockquote>
                  </div>

                  <div className="shrink-0 flex flex-row md:flex-col gap-2 items-start md:items-end justify-start whitespace-nowrap">
                    <span className="text-xs text-gray-400 font-mono mb-1 hidden md:block">Update Status</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, "contacted")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          inq.status === "contacted"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        Contacted
                      </button>
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, "resolved")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          inq.status === "resolved"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        Resolved
                      </button>
                      <button
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-600 transition-all inline-flex items-center cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-slate-50">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-lg text-gray-800">No Inquiries Found</h4>
              <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1">There are no client listings inquiries submitted yet.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: HUBS & TYPES MANAGER */}
      {!loading && activeTab === "metadata" && (
        <div id="metadata-tab-panel" className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Feedback */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Hubs & Property Types Manager</h3>
              <p className="text-sm text-gray-400 mt-1">Manage editable geographical cities and real estate category listings.</p>
            </div>
            {metaActionLoading && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving changes...
              </span>
            )}
          </div>

          {metaError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              {metaError}
            </div>
          )}

          {metaSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
              {metaSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COLUMN 1: CITY HUBS */}
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
              <div className="px-6 py-5 border-b border-gray-50 bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">City Hubs ({cities.length})</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Geographic locations featured on maps and filters.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Add City Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCityInput}
                    onChange={(e) => setNewCityInput(e.target.value)}
                    placeholder="e.g. Los Angeles, Paris"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:border-blue-500 outline-hidden"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                  />
                  <button
                    onClick={handleAddCity}
                    disabled={metaActionLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* City List */}
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl max-h-[350px] overflow-y-auto bg-slate-50/50">
                  {cities.map((cityName, index) => {
                    const isEditing = editingCityIndex === index;
                    const count = properties.filter(p => p.city === cityName).length;

                    return (
                      <div key={cityName} className="px-4 py-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/30 transition-colors">
                        {isEditing ? (
                          <div className="flex-1 flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingCityValue}
                              onChange={(e) => setEditingCityValue(e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 focus:border-blue-500 outline-hidden bg-white"
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEditCity(index)}
                            />
                            <button
                              onClick={() => handleSaveEditCity(index)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                              title="Save"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingCityIndex(null);
                                setEditingCityValue("");
                              }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-800">{cityName}</span>
                              <span className="text-[10px] font-mono font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                                {count} {count === 1 ? "listing" : "listings"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCityIndex(index);
                                  setEditingCityValue(cityName);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit City"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCity(cityName)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove City"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {cities.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">No cities in list. Add a city above.</div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: PROPERTY TYPES */}
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
              <div className="px-6 py-5 border-b border-gray-50 bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Property Types ({propertyTypes.length})</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Custom categories for architectural classification.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Add Property Type Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTypeInput}
                    onChange={(e) => setNewTypeInput(e.target.value)}
                    placeholder="e.g. cabin, penthouse, castle"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:border-blue-500 outline-hidden"
                    onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                  />
                  <button
                    onClick={handleAddType}
                    disabled={metaActionLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* Property Type List */}
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl max-h-[350px] overflow-y-auto bg-slate-50/50">
                  {propertyTypes.map((typeName, index) => {
                    const isEditing = editingTypeIndex === index;
                    const count = properties.filter(p => p.propertyType === typeName).length;

                    return (
                      <div key={typeName} className="px-4 py-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/30 transition-colors">
                        {isEditing ? (
                          <div className="flex-1 flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingTypeValue}
                              onChange={(e) => setEditingTypeValue(e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 focus:border-blue-500 outline-hidden bg-white"
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleSaveEditType(index)}
                            />
                            <button
                              onClick={() => handleSaveEditType(index)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                              title="Save"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTypeIndex(null);
                                setEditingTypeValue("");
                              }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded-md"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-800 capitalize">{typeName}</span>
                              <span className="text-[10px] font-mono font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                                {count} {count === 1 ? "listing" : "listings"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingTypeIndex(index);
                                  setEditingTypeValue(typeName);
                                }}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Type"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteType(typeName)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Type"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {propertyTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">No property types in list. Add a type above.</div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FLOATING LISTING MODAL FORM (ADD/EDIT) */}
      {showForm && (
        <div id="listing-modal" className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl flex flex-col animate-in scale-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {editingPropertyId ? "Edit Luxury Property Listing" : "Add Premium Real Estate Listing"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Define property specifications and media galleries.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProperty} className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900"
                    placeholder="e.g. Modernist Concrete Loft"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Price</label>
                  <div className="flex bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <select
                      value={priceCurrency}
                      onChange={(e) => setPriceCurrency(e.target.value as "USD"|"EUR")}
                      className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-hidden"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="flex-1 w-full px-4 py-2.5 outline-hidden"
                      placeholder="e.g. 1500000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Listing For</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PropertyStatus)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 bg-white"
                  >
                    <option value="sale">Sale</option>
                    <option value="rent">Rent / Lease</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 bg-white"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900"
                    placeholder="e.g. 104 Soho Arts St"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Google Maps Link (Optional)</label>
                  <input
                    type="url"
                    value={googleMapsUrl}
                    onChange={(e) => setGoogleMapsUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900"
                    placeholder="e.g. https://www.google.com/maps/place/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Blueprint (URL or Upload)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={blueprintUrl}
                      onChange={(e) => setBlueprintUrl(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900"
                      placeholder="e.g. https://... or click Upload"
                    />
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-3 rounded-xl border border-blue-200 text-sm font-bold transition-colors whitespace-nowrap">
                      Upload
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.type.startsWith("image/")) {
                              setUploadError("Blueprint must be an image.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new window.Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const maxDim = 1200;
                                let width = img.width;
                                let height = img.height;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  setBlueprintUrl(canvas.toDataURL("image/jpeg", 0.7));
                                }
                              };
                              if (event.target?.result) {
                                img.src = event.target.result as string;
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {blueprintUrl && blueprintUrl.startsWith('data:image') && (
                    <div className="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Blueprint image uploaded.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">City Hub</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 bg-white"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Neighborhood</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900"
                    placeholder="e.g. SoHo"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Beds</label>
                    <input
                      type="number"
                      required
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-gray-200 outline-hidden font-medium text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Baths</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-gray-200 outline-hidden font-medium text-sm text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Area (m²)</label>
                    <input
                      type="number"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-gray-200 outline-hidden font-medium text-sm text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Description & AI description assistant */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Description</label>
                  <button
                    id="ai-write-desc-btn"
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={generatingDescription}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 disabled:bg-blue-50/50 text-blue-700 font-bold text-xs transition-colors cursor-pointer border border-blue-200/50"
                  >
                    {generatingDescription ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI writing description...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Generate with Gemini AI
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <p className="text-xs font-semibold text-red-500">{aiError}</p>
                )}

                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 leading-relaxed"
                  placeholder="Describe your premium listing specs..."
                />
              </div>

              {/* Standard Amenities Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Standard Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STANDARD_AMENITIES.map((amen) => {
                    const checked = amenities.includes(amen);
                    return (
                      <button
                        key={amen}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            setAmenities(amenities.filter((a) => a !== amen));
                          } else {
                            setAmenities([...amenities, amen]);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-colors cursor-pointer ${
                          checked
                            ? "bg-blue-50 border-blue-300 text-blue-700 font-bold"
                            : "bg-white hover:bg-gray-50 border-gray-150 text-gray-600"
                        }`}
                      >
                        {checked ? "✓ " : "+ "}
                        {amen}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Amenities Addition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add Custom Amenities</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-hidden"
                      placeholder="e.g. Wine Cellar"
                    />
                    <button
                      type="button"
                      onClick={handleAddAmenity}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {/* Amenity Pills list */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {amenities.map((amen, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-150 text-xs font-semibold text-slate-700">
                        {amen}
                        <button type="button" onClick={() => handleRemoveAmenity(idx)} className="text-gray-400 hover:text-red-500 font-bold pl-1 font-mono">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Images addition */}
                <div className="sm:col-span-2 border border-gray-100 rounded-2xl p-5 bg-gray-50/30">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Property Media Gallery</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Drag & Drop Area */}
                    <div className="md:col-span-2">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            handleFileUpload(files);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[140px] ${
                          isDragging
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-gray-200 hover:border-blue-400 hover:bg-white"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              handleFileUpload(files);
                            }
                          }}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-xs font-semibold text-gray-700">Drag & drop images here</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">or click to browse your device</p>
                        <p className="text-[9px] text-gray-400 mt-3">Supports JPG, PNG, WEBP. Max 8MB per file.</p>
                      </div>
                    </div>

                    {/* Quick Stats & Url toggle */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Media Status</span>
                        <div className="space-y-1.5 text-xs text-gray-600 font-medium">
                          <p className="flex justify-between">
                            <span>Total images:</span>
                            <span className="font-bold text-blue-600">{images.length}/10</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Uploaded:</span>
                            <span className="font-semibold">{images.filter(img => img.startsWith("data:")).length} files</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Remote URLs:</span>
                            <span className="font-semibold">{images.filter(img => !img.startsWith("data:")).length} URLs</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Link className="w-3.5 h-3.5" />
                          {showUrlInput ? "Hide remote URL field" : "Or paste a remote image URL"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-xs font-semibold text-red-500 mt-2.5">{uploadError}</p>
                  )}

                  {showUrlInput && (
                    <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Paste Remote Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageInput}
                          onChange={(e) => setImageInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
                          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-hidden focus:border-blue-500"
                          placeholder="https://images.unsplash.com/..."
                        />
                        <button
                          type="button"
                          onClick={handleAddImage}
                          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl cursor-pointer whitespace-nowrap"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image Thumbnails list */}
                  {images.length > 0 && (
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Gallery Preview (hover to remove)</span>
                      <div className="flex flex-wrap gap-2.5 max-h-[140px] overflow-y-auto p-1 border border-gray-50 rounded-xl bg-gray-50/20">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-150 group shrink-0 shadow-xs">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute inset-0 bg-red-600/80 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] cursor-pointer"
                            >
                              Remove
                            </button>
                            <span className="absolute bottom-0.5 right-0.5 bg-black/50 text-[8px] text-white px-1 rounded-sm font-mono scale-90">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Switches Featured & Available */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="block text-sm font-bold text-gray-800">Featured Listing</span>
                    <span className="text-[10px] text-gray-400">Highlight this property on the homepage</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="block text-sm font-bold text-gray-800">Available Status</span>
                    <span className="text-[10px] text-gray-400">List on active sale/rent maps & catalogs</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  {actionLoading ? "Saving Listing..." : "Save Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
