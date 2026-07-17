import React from "react";
import { MapPin, Phone, Mail, Map, MessageCircle, Instagram, Facebook } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer id="footer-section" className="bg-gray-950 text-gray-400 font-sans border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center cursor-pointer mb-2" onClick={() => onNavigate("home")}>
              <img width="240" height="80" loading="lazy" decoding="async" src="/logo.png" alt="BNBG Immobiliare" className="h-20 w-auto brightness-0 invert opacity-90" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.aboutText')}
            </p>
            <p className="text-xs text-gray-500 font-mono">
              © 2026 BNBG Immobiliare S.r.l.
              <br />{t('footer.rights')}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 pt-2 text-gray-400">
              <a href="https://www.instagram.com/bnbgimmobiliare" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 hover:text-pink-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/share/1BZbQyNLgj/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 hover:text-blue-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.tiktok.com/@bnbgimmobiliare" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Navigations */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={() => onNavigate("home")}
                  className="hover:text-white transition-colors"
                >
                  {t('footer.featuredProperties')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("buy")}
                  className="hover:text-white transition-colors"
                >
                  {t('footer.propertiesForSale')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("rent")}
                  className="hover:text-white transition-colors"
                >
                  {t('footer.propertiesForRent')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors"
                >
                  {t('footer.ourVision')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Information & Maps */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase">{t('footer.contactInfo')}</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                <span>Bergamo, Via San Bernardino 7/B</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <a href="tel:+393896408184" className="hover:text-gray-300 transition-colors">389 6408184</a>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500 shrink-0" />
                <a href="https://wa.me/393896408184" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">WhatsApp: 389 6408184</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <a href="mailto:immobiliare@bnbg.it" className="hover:text-gray-300 transition-colors">immobiliare@bnbg.it</a>
              </p>
            </div>
            <div className="pt-2 border-t border-gray-950">
              <a 
                href="https://maps.google.com/?q=Via+San+Bernardino+7/B+Bergamo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
              >
                <Map className="w-3.5 h-3.5" />
                {t('footer.googleMaps')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
