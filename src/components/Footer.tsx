import React from "react";
import { MapPin, Phone, Mail, Map, MessageCircle } from "lucide-react";

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="footer-section" className="bg-gray-950 text-gray-400 font-sans border-t border-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                B
              </div>
              <span className="font-sans font-bold text-xl tracking-tight text-white">
                BNBG Immobiliare<span className="text-blue-500">.</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Quando i sogni diventano casa. Nasce a Bergamo, città ricca di storia e bellezza, nel cuore pulsante del centro BNBG Immobiliare S.r.l!
            </p>
            <p className="text-xs text-gray-500 font-mono">
              © 2026 BNBG Immobiliare S.r.l.
              <br />All rights reserved.
            </p>
          </div>

          {/* Quick Navigations */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Quick Links</h3>
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
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase">Contact Office</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                <span>Bergamo, Via San Bernardino 7/B</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <span>3896408184</span>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500 shrink-0" />
                <span>WhatsApp: 3896408184</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <span>immobiliare@bnbg.it</span>
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
