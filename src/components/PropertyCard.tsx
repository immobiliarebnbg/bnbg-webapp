import React from "react";
import { useTranslation } from "react-i18next";
import { Property } from "../types";
import { Heart, MapPin, ExternalLink, BedDouble, Bath, Square, ChevronRight, Star } from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";

interface PropertyCardProps {
  key?: string;
  property: Property;
  isFavorited: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
}

export default function PropertyCard({ property, isFavorited, onToggleFavorite, onClick }: PropertyCardProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  return (
    <div
      id={`property-card-${property.id}`}
      onClick={onClick}
      className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Property Image & Badges */}
      <div className="relative aspect-video sm:aspect-4/3 w-full overflow-hidden bg-gray-100">
        <img width="800" height="600"
          src={property.images[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80"}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Button */}
        <button
          id={`favorite-btn-${property.id}`}
          onClick={(e) => onToggleFavorite(property.id, e)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-white shadow-xs transition-colors focus:outline-hidden"
        >
          <Heart
            className={`w-5 h-5 transition-transform active:scale-125 ${
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider text-white shadow-sm ${
            property.status === "sale" ? "bg-blue-600" : "bg-emerald-600"
          }`}>
            {property.status === "sale" ? t('nav.buy') : t('nav.rent')}
          </span>
          {property.featured && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500 text-white shadow-sm uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span>{t('property.featured')}</span>
            </span>
          )}
        </div>

        {/* Property Type Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-gray-950/70 backdrop-blur-xs text-white capitalize">
            {t(`propertyTypes.${property.propertyType.toLowerCase()}`, { defaultValue: property.propertyType })}
          </span>
        </div>
      </div>

      {/* Property Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Price & Title */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-sans font-bold text-xl text-gray-900 tracking-tight">
            {formatPrice(property.price, property.status)}
          </h3>
        </div>

        <h4 className="font-sans font-semibold text-base text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {property.title}
        </h4>

        {/* Address */}
        <p className="flex items-center gap-1.5 text-sm text-gray-500 font-sans mt-1 mb-4">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <a
            href={property.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.address}, ${property.city}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="truncate hover:text-blue-600 hover:underline flex items-center gap-1 group/link cursor-pointer"
            title="Open address in Google Maps"
          >
            <span className="truncate">{property.address}, {property.city}</span>
            <ExternalLink className="w-3 h-3 text-blue-500 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
        </p>

        {/* Specs Row */}
        <div className="grid grid-cols-3 gap-2 py-3 px-1 border-t border-b border-gray-50 text-gray-600 mb-4 text-xs font-sans">
          <div className="flex items-center gap-1.5 justify-center">
            <BedDouble className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium truncate">{property.bedrooms} {t('property.beds')}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center border-l border-r border-gray-100">
            <Bath className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium truncate">{property.bathrooms} {t('property.baths')}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center">
            <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-medium truncate">{property.area} m²</span>
          </div>
        </div>

        {/* Card Action Link */}
        <div className="flex items-center justify-between mt-auto pt-2 text-sm text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
          <span>{t('property.viewDetails')}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
