export type PropertyStatus = "sale" | "rent";

export type PropertyType = string;

export interface Property {
  id: string;
  title: string;
  description: string;
  status: PropertyStatus;
  price: number;
  address: string;
  city: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  area: number; // in m²
  propertyType: PropertyType;
  amenities: string[];
  images: string[];
  featured: boolean;
  available: boolean;
  googleMapsUrl?: string;
  blueprintUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  password?: string; // used server-side only
  avatar?: string;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted" | "resolved";
}

export interface SearchFilters {
  status?: PropertyStatus;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  neighborhood?: string;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  garage?: boolean;
  garden?: boolean;
  swimmingPool?: boolean;
  parking?: boolean;
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc";
}

export interface DashboardStats {
  totalProperties: number;
  activeRentals: number;
  activeSales: number;
  totalInquiries: number;
  newInquiries: number;
  averagePriceSale: number;
  averagePriceRent: number;
  byType: Record<string, number>;
  byCity: Record<string, number>;
  monthlyInquiries: { month: string; count: number }[];
}
