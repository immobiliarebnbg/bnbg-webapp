import { useState } from "react";
import { User } from "../types";
import { Home, Search, List, User as UserIcon, LogOut, ShieldAlert, Heart, Menu, X, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  currentPage: string;
  onLogout: () => void;
}

export default function Navbar({ currentUser, onNavigate, currentPage, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const { t, i18n } = useTranslation();

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
            className="flex items-center cursor-pointer group"
            onClick={() => handleLinkClick("home")}
          >
            <img src="/logo.png" alt="BNBG Immobiliare" className="h-20 w-auto drop-shadow-sm hover:scale-105 transition-transform" />
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
              {t('nav.home')}
            </button>
            <button
              id="nav-link-buy"
              onClick={() => handleLinkClick("buy")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "buy" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t('nav.buy')}
            </button>
            <button
              id="nav-link-rent"
              onClick={() => handleLinkClick("rent")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "rent" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t('nav.rent')}
            </button>
            <button
              id="nav-link-about"
              onClick={() => handleLinkClick("about")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "about" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t('nav.about')}
            </button>
            <button
              id="nav-link-contact"
              onClick={() => handleLinkClick("contact")}
              className={`font-sans text-sm font-medium transition-colors ${
                currentPage === "contact" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t('nav.contact')}
            </button>
          </div>

          {/* User Session & Language Section */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-hidden"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{i18n.language}</span>
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white border border-gray-100 shadow-xl py-2 z-50">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'it', label: 'Italian' },
                    { code: 'fr', label: 'French' },
                    { code: 'ar', label: 'Arabic' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${i18n.language === lang.code ? 'text-blue-600 font-bold' : 'text-gray-700'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                        {t('nav.adminDashboard')}
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
                      {t('nav.profile')}
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
                      {t('nav.favorites')}
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
                      <LogOut className="w-4 h-4" />
                      {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="nav-link-login"
                onClick={() => handleLinkClick("login")}
                className="font-sans font-bold text-sm bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
              >
                {t('nav.signIn')}
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
            {t('nav.home')}
          </button>
          <button
            onClick={() => handleLinkClick("buy")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('nav.buy')}
          </button>
          <button
            onClick={() => handleLinkClick("rent")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('nav.rent')}
          </button>
          <button
            onClick={() => handleLinkClick("about")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('nav.about')}
          </button>
          <button
            onClick={() => handleLinkClick("contact")}
            className="block w-full text-left px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('nav.contact')}
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
                  {t('nav.adminDashboard')}
                </button>
              )}

              <button
                onClick={() => handleLinkClick("profile")}
                className="block w-full text-left py-2 text-base font-medium text-gray-700 flex items-center gap-2"
              >
                <UserIcon className="w-5 h-5 text-gray-400" />
                {t('nav.profile')}
              </button>

              <button
                onClick={() => handleLinkClick("profile", { activeTab: "favorites" })}
                className="block w-full text-left py-2 text-base font-medium text-gray-700 flex items-center gap-2"
              >
                <Heart className="w-5 h-5 text-gray-400" />
                {t('nav.favorites')}
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="block w-full text-left py-2 text-base font-medium text-gray-500 flex items-center gap-2 mt-2 border-t border-gray-100 pt-3"
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                {t('nav.signOut')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleLinkClick("login")}
              className="block w-full text-center bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md mt-2"
            >
              {t('nav.signIn')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
