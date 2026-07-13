import React, { useState, useEffect, useRef } from "react";
import { Property } from "../types";
import { ZoomIn, ZoomOut, Navigation, MapPin, X, ExternalLink } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CustomMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onSelectProperty?: (property: Property) => void;
  height?: string;
}

export default function CustomMap(props: CustomMapProps) {
  const { properties, selectedProperty, onSelectProperty, height = "h-[450px]" } = props;
  const [activeTooltip, setActiveTooltip] = useState<Property | null>(null);
  const { formatPrice, formatPriceCompact } = useCurrency();
  
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Sync activeTooltip when selectedProperty changes
  useEffect(() => {
    if (selectedProperty) {
      setActiveTooltip(selectedProperty);
    }
  }, [selectedProperty]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the map instance
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false, // We'll render a super clean minimal custom attribution or keep it minimal
    }).setView([40.7233, -74.003], 12);

    // Beautiful Google Maps Standard Tiles (Free alternative to full API)
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3']
    }).addTo(map);

    mapRef.current = map;

    // Handle map clicks to close tooltip
    map.on("click", () => {
      setActiveTooltip(null);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers and center map when properties or selected property changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers from map
    Object.values(markersRef.current).forEach((marker: any) => {
      if (marker) marker.remove();
    });
    markersRef.current = {};

    if (properties.length === 0) return;

    const bounds = L.latLngBounds([]);

    const coordCounts: Record<string, number> = {};

    properties.forEach((prop) => {
      const isSelected = selectedProperty?.id === prop.id;
      const priceText = formatPriceCompact(prop.price, prop.status);
      
      // Handle overlapping markers by adding a slight offset
      const coordKey = `${prop.latitude},${prop.longitude}`;
      let lat = prop.latitude;
      let lng = prop.longitude;
      
      if (coordCounts[coordKey]) {
        lat += coordCounts[coordKey] * 0.0003;
        lng += coordCounts[coordKey] * 0.0003;
        coordCounts[coordKey]++;
      } else {
        coordCounts[coordKey] = 1;
      }
      
      // Highly-styled, custom HTML price tag marker
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div class="relative flex flex-col items-center justify-end cursor-pointer select-none" style="transform: translate(-50%, -100%)">
            <div class="px-2.5 py-1.5 rounded-full text-[10px] font-mono font-bold shadow-md transition-all duration-200 flex items-center justify-center border ${
              isSelected 
                ? "bg-blue-600 border-blue-600 text-white scale-110 z-[1000] animate-pulse" 
                : "bg-white border-slate-200 text-slate-800 hover:border-blue-500 hover:text-blue-600 hover:scale-105"
            }">
              ${priceText}
            </div>
            <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] -mt-[1px] transition-all duration-200 ${
              isSelected ? "border-t-blue-600 scale-110" : "border-t-white"
            }"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setActiveTooltip(prop);
          if (onSelectProperty) onSelectProperty(prop);
        });

      markersRef.current[prop.id] = marker;
      bounds.extend([prop.latitude, prop.longitude]);
    });

    // Center/fit map based on selection or bounds
    if (selectedProperty) {
      map.setView([selectedProperty.latitude, selectedProperty.longitude], 15, {
        animate: true,
        duration: 0.5
      });
    } else if (properties.length > 0) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
        animate: true,
        duration: 0.5
      });
    }
  }, [properties, selectedProperty]);

  const handleZoom = (direction: "in" | "out") => {
    const map = mapRef.current;
    if (!map) return;
    if (direction === "in") {
      map.zoomIn();
    } else {
      map.zoomOut();
    }
  };

  const handleReset = () => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedProperty) {
      map.setView([selectedProperty.latitude, selectedProperty.longitude], 15);
    } else if (properties.length > 0) {
      const bounds = L.latLngBounds(properties.map((p) => [p.latitude, p.longitude]));
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15
      });
    }
  };

  return (
    <div id="interactive-map-container" className={`relative rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-50 flex flex-col ${height} select-none shadow-sm z-10`}>
      
      {/* Map Element */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        id="leaflet-map-element"
      />

      {/* Custom Zoom/Reset Overlay Controls */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-1.5">
        <button
          onClick={() => handleZoom("in")}
          className="w-10 h-10 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center text-gray-800 border border-gray-100 shadow-md transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="w-10 h-10 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center text-gray-800 border border-gray-100 shadow-md transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center text-gray-800 border border-gray-100 shadow-md transition-colors cursor-pointer"
          title="Reset Map View"
        >
          <Navigation className="w-5 h-5 rotate-45 text-slate-600" />
        </button>
      </div>

      {/* Minimal attribution indicator */}
      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-slate-400 font-sans pointer-events-none z-[500]">
        &copy; Google Maps
      </div>

      {/* Property Detail Tooltip Card */}
      {activeTooltip && (
        <div
          id="map-tooltip-card"
          className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-2xl p-3 z-[600] animate-in fade-in slide-in-from-bottom-5 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setActiveTooltip(null)}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex gap-3">
            {/* Tooltip Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-50">
              <img
                src={activeTooltip.images[0]}
                alt={activeTooltip.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Tooltip Description */}
            <div className="flex-1 min-w-0 pr-4">
              <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider text-white mb-1 ${
                activeTooltip.status === "sale" ? "bg-blue-600" : "bg-emerald-600"
              }`}>
                For {activeTooltip.status}
              </span>

              <h4 className="font-sans font-bold text-sm text-gray-900 truncate">
                {activeTooltip.title}
              </h4>

              <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">
                {formatPrice(activeTooltip.price, activeTooltip.status)}
              </p>

              <p className="font-sans text-[11px] text-gray-500 truncate mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a
                  href={activeTooltip.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${activeTooltip.address}, ${activeTooltip.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-blue-600 hover:underline inline-flex items-center gap-0.5 group/link cursor-pointer text-slate-700 font-medium"
                  title="Open in Google Maps"
                >
                  <span className="truncate">{activeTooltip.address}</span>
                  <ExternalLink className="w-2.5 h-2.5 text-blue-500 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {onSelectProperty && (
            <div className="flex gap-2 mt-3 pt-2.5 border-t border-gray-50">
              <button
                onClick={() => {
                  onSelectProperty(activeTooltip);
                  setActiveTooltip(null);
                }}
                className="flex-1 py-1.5 text-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-sans font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                View Full Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

