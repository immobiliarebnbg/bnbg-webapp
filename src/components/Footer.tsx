import React from "react";
import { MapPin, Phone, Mail, Map, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer id="footer-section" className="bg-gray-950 text-gray-400 font-sans border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
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
                  Featured Properties
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("buy")}
                  className="hover:text-white transition-colors"
                >
                  Properties for Sale
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("rent")}
                  className="hover:text-white transition-colors"
                >
                  Properties for Rent
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors"
                >
                  Our Vision & Story
                </button>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Premium Cities</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={() => onNavigate("buy", { filterCity: "Miami" })}
                  className="hover:text-white transition-colors"
                >
                  Miami Coastal Villas
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("buy", { filterCity: "New York" })}
                  className="hover:text-white transition-colors"
                >
                  New York Lofts
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("buy", { filterCity: "San Francisco" })}
                  className="hover:text-white transition-colors"
                >
                  San Francisco High-Rises
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate("buy", { filterCity: "Austin" })}
                  className="hover:text-white transition-colors"
                >
                  Austin Luxury Homes
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
                Find Us on Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
