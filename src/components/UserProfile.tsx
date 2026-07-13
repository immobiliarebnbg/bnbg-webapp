import React, { useState, useEffect, useRef } from "react";
import { User, Property } from "../types";
import { User as UserIcon, Lock, Heart, Edit3, Image, Key, ChevronRight, Save, CheckCircle2, ShieldAlert, Upload, Trash2, Link } from "lucide-react";
import PropertyCard from "./PropertyCard";

interface UserProfileProps {
  currentUser: User | null;
  authToken: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onUpdateUser: (updatedUser: User) => void;
  initialTab?: string;
}

export default function UserProfile({ currentUser, authToken, onNavigate, onUpdateUser, initialTab = "profile" }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [username, setUsername] = useState(currentUser?.username || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [favorites, setFavorites] = useState<Property[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndSetAvatar = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image is too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          try {
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
            setAvatar(compressedDataUrl);
            setProfileSuccess("New photo prepared! Click 'Save Profile Details' to persist your changes.");
            setTimeout(() => setProfileSuccess(""), 4000);
          } catch (err) {
            console.error("Canvas toDataURL failed, using fallback base64 string", err);
            setAvatar(event.target?.result as string);
          }
        } else {
          setAvatar(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setProfileError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setAvatar(currentUser.avatar || "");
    }
  }, [currentUser]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load favorites
  const loadFavorites = async () => {
    if (!currentUser || !authToken) return;
    setLoadingFavs(true);
    try {
      const res = await fetch("/api/favorites", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setFavorites(data.favorites || []);
        setFavoriteIds(data.favoriteIds || []);
      }
    } catch (e) {
      console.error("Error loading favorites", e);
    } finally {
      setLoadingFavs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "favorites") {
      loadFavorites();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ username, avatar })
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateUser(data.user);
        setProfileSuccess("Profile updated successfully!");
        setTimeout(() => setProfileSuccess(""), 3000);
      } else {
        setProfileError(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      setProfileError("An error occurred during update.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(""), 3000);
      } else {
        setPasswordError(data.error || "Failed to update password");
      }
    } catch (err: any) {
      setPasswordError("An error occurred during update.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleToggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ propertyId })
      });
      if (res.ok) {
        // Refresh list
        loadFavorites();
      }
    } catch (err) {
      console.error("Error toggling favorite", err);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center font-sans">
        <h2 className="text-2xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-gray-500 mt-2 mb-6">You must be logged in to view your profile settings.</p>
        <button
          onClick={() => onNavigate("login")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-xs"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div id="user-profile-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans min-h-[600px]">
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-1 mb-8 lg:mb-0">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col items-center text-center">
            {/* User Avatar with Edit Trigger */}
            <div 
              className="relative group mb-4 cursor-pointer"
              title="Click to upload a new profile photo"
              onClick={() => {
                if (activeTab === "profile") {
                  fileInputRef.current?.click();
                } else {
                  setActiveTab("profile");
                  setTimeout(() => {
                    fileInputRef.current?.click();
                  }, 120);
                }
              }}
            >
              <div className="relative">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.username)}`}
                  alt={currentUser.username}
                  className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover shadow-md group-hover:brightness-90 transition-all duration-200"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Upload className="w-5 h-5 text-white animate-bounce" />
                  <span className="text-[10px] text-white font-semibold mt-1">Upload</span>
                </div>
              </div>
              <span className={`absolute bottom-0 right-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full text-white ${
                currentUser.role === "admin" ? "bg-red-500" : "bg-blue-500"
              }`}>
                {currentUser.role === "admin" ? "Agent" : "User"}
              </span>
            </div>

            <h2 className="font-bold text-lg text-gray-900 truncate w-full pr-1">{currentUser.username}</h2>
            <p className="font-mono text-xs text-gray-400 mt-0.5 mb-6 truncate w-full pr-1">{currentUser.email}</p>

            {/* Sidebar Buttons */}
            <div className="w-full space-y-1">
              <button
                id="profile-tab-btn"
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "profile"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                Profile Details
              </button>
              <button
                id="password-tab-btn"
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "password"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                Change Password
              </button>
              <button
                id="favorites-tab-btn"
                onClick={() => setActiveTab("favorites")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "favorites"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Heart className="w-4 h-4 shrink-0" />
                Saved Favorites
              </button>
              {currentUser.role === "admin" && (
                <button
                  id="profile-admin-shortcut-btn"
                  onClick={() => onNavigate("admin")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/50 mt-4 border border-dashed border-red-200 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Go to Admin Panel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          {/* TAB: PROFILE DETAILS */}
          {activeTab === "profile" && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-5 mb-6">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-xl text-gray-900 tracking-tight">Profile Details</h3>
              </div>

              {profileSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2.5 text-green-700 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 text-red-700 text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username / Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 transition-all"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address (Read-only)</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 outline-hidden font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/30">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profile Photo</label>
                  
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
                            compressAndSetAvatar(files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
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
                              compressAndSetAvatar(files[0]);
                            }
                          }}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                          <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Drag & drop your photo here</p>
                        <p className="text-xs text-gray-500 mt-1">or click to browse your device</p>
                        <p className="text-[10px] text-gray-400 mt-4">Supports JPG, PNG, WEBP. Max 5MB.</p>
                      </div>
                    </div>

                    {/* Preview Box & Toggle option */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Live Preview</span>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || currentUser.username)}`}
                              alt="Profile Preview"
                              className="w-16 h-16 rounded-full object-cover border border-gray-200 bg-gray-50"
                            />
                            {avatar && (
                              <button
                                type="button"
                                onClick={() => setAvatar("")}
                                className="absolute -top-1 -right-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 shadow-xs transition-colors cursor-pointer"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                              {avatar.startsWith("data:") ? "Uploaded Image" : avatar ? "External Link" : "Default Initials"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              {avatar.startsWith("data:") ? `${Math.round(avatar.length * 0.75 / 1024)} KB` : avatar ? "Remote URL" : "Auto-generated"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(!showUrlInput)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Link className="w-3.5 h-3.5" />
                          {showUrlInput ? "Hide image URL field" : "Or paste an image URL instead"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {showUrlInput && (
                    <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 space-y-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Avatar Image URL</label>
                      <div className="relative">
                        <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 transition-all"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <p className="text-[10px] text-gray-400">Provide a public Unsplash or image address URL.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingProfile ? "Saving Details..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: CHANGE PASSWORD */}
          {activeTab === "password" && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-5 mb-6">
                <Key className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-xl text-gray-900 tracking-tight">Change Password</h3>
              </div>

              {passwordSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2.5 text-green-700 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 text-red-700 text-sm">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 transition-all"
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 transition-all"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden font-medium text-sm text-gray-900 transition-all"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: SAVED FAVORITES */}
          {activeTab === "favorites" && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-5 mb-6">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h3 className="font-bold text-xl text-gray-900 tracking-tight">Saved Favorites</h3>
              </div>

              {loadingFavs ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favorites.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      isFavorited={true}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={() => onNavigate("details", { propertyId: prop.id })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-800">Your Favorite List is Empty</h4>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2 mb-6">
                    Start browsing our premium collections and click the heart icon to save listings you love!
                  </p>
                  <button
                    onClick={() => onNavigate("buy")}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Browse Properties</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
