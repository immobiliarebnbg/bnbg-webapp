import { useState } from "react";
import { User } from "../types";
import { Home, Search, List, User as UserIcon, LogOut, ShieldAlert, Heart, Menu, X } from "lucide-react";

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  currentPage: string;
  onLogout: () => void;
}

export default function Navbar({ currentUser, onNavigate, currentPage, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLinkClick = (page: string, params?: Record<string, any>) => {
    onNavigate(page, params);
    setIsOpen(false);
  };

  return (
    <nav id="navbar-main" className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div 
            id="nav-logo"
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleLinkClick("home")}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200 group-hover:bg-blue-700 transition-colors">
              B
            </div>
            <div>
              <span className="font-sans font-bold text-xl tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                BNBG
              </span>
              <span className="text-blue-600 font-sans font-bold text-xl">.</span>
              <p className="text-[10px] text-gray-500 font-mono -mt-1 uppercase tracking-wider">Immobiliare</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              id="nav-link-home"
              onClick={() => handleLinkClick("home")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "home" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Home
            </button>
            <button
              id="nav-link-buy"
              onClick={() => handleLinkClick("buy")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "buy" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Buy
            </button>
            <button
              id="nav-link-rent"
              onClick={() => handleLinkClick("rent")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "rent" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Rent
            </button>
            <button
              id="nav-link-about"
              onClick={() => handleLinkClick("about")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "about" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              About
            </button>
            <button
              id="nav-link-contact"
              onClick={() => handleLinkClick("contact")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "contact" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Contact
            </button>
          </div>

          {/* User Session Section */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="relative">
                <button
                  id="nav-user-menu-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-hidden"
                >
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.username)}`}
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover"
                  />
                  <span className="font-sans text-sm font-medium text-gray-700 pr-1 max-w-[120px] truncate">
                    {currentUser.username}
                  </span>
                </button>

                {showDropdown && (
                  <div 
                    id="nav-user-dropdown"
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                  >
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="font-sans font-semibold text-sm text-gray-900 truncate">
                        {currentUser.username}
                      </p>
                      <p className="font-mono text-xs text-gray-400 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                    </div>

                    {currentUser.role === "admin" && (
                      <button
                        id="dropdown-link-admin"
                        onClick={() => {
                          handleLinkClick("admin");
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2.5 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Dashboard
                      </button>
                    )}

                    <button
                      id="dropdown-link-profile"
                      onClick={() => {
                        handleLinkClick("profile");
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      My Profile
                    </button>

                    <button
                      id="dropdown-link-favorites"
                      onClick={() => {
                        handleLinkClick("profile", { activeTab: "favorites" });
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-400" />
                      Saved Favorites
                    </button>

                    <hr className="my-1 border-gray-100" />

                    <button
                      id="dropdown-link-logout"
                      onClick={() => {
                        onLogout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-gray-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="nav-login-btn"
                onClick={() => handleLinkClick("login")}
                className="font-sans text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-900 p-2 focus:outline-hidden"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div id="mobile-menu-drawer" className="md:hidden bg-white border-b border-gray-100 py-4 px-4 space-y-3 shadow-md">
          <button
            onClick={() => handleLinkClick("home")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Home
          </button>
          <button
            onClick={() => handleLinkClick("buy")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Buy Properties
          </button>
          <button
            onClick={() => handleLinkClick("rent")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Rent Properties
          </button>
          <button
            onClick={() => handleLinkClick("about")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            About Us
          </button>
          <button
            onClick={() => handleLinkClick("contact")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Contact
          </button>

          <hr className="border-gray-100 my-2" />

          {currentUser ? (
            <div className="space-y-1 pl-3">
              <div className="flex items-center gap-3 py-2">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.username)}`}
                  alt={currentUser.username}
                  className="w-10 h-10 rounded-full border border-gray-100 object-cover"
                />
                <div>
                  <p className="font-sans font-semibold text-sm text-gray-900">{currentUser.username}</p>
                  <p className="font-mono text-xs text-gray-400">{currentUser.email}</p>
                </div>
              </div>

              {currentUser.role === "admin" && (
                <button
                  onClick={() => handleLinkClick("admin")}
                  className="block w-full text-left py-2 text-base font-medium text-red-600 flex items-center gap-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  Admin Dashboard
                </button>
              )}

              <button
                onClick={() => handleLinkClick("profile")}
                className="block w-full text-left py-2 text-base font-medium text-gray-700 flex items-center gap-2"
              >
                <UserIcon className="w-5 h-5 text-gray-400" />
                My Profile
              </button>

              <button
                onClick={() => handleLinkClick("profile", { activeTab: "favorites" })}
                className="block w-full text-left py-2 text-base font-medium text-gray-700 flex items-center gap-2"
              >
                <Heart className="w-5 h-5 text-gray-400" />
                Saved Favorites
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-medium text-gray-500 flex items-center gap-2"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleLinkClick("login")}
              className="block w-full text-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl font-semibold shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
