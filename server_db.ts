import fs from "fs";
import path from "path";
import { Property, User, Inquiry, SearchFilters, DashboardStats } from "./src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

const DEFAULT_CITIES = ["Miami", "New York", "San Francisco", "Austin", "Seattle"];
const DEFAULT_PROPERTY_TYPES = ["villa", "house", "apartment", "loft", "condo", "townhouse"];

interface DatabaseSchema {
  properties: Property[];
  users: User[];
  inquiries: Inquiry[];
  favorites: Record<string, string[]>; // userEmail -> propertyId[]
  cities?: string[];
  propertyTypes?: string[];
}

const SEED_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    title: "The Grand Horizon Villa",
    description: "Experience absolute luxury in this architectural masterpiece situated in Coconut Grove. Boasting panoramic ocean views, a seamless indoor-outdoor open floor plan, and a world-class infinity edge swimming pool. Crafted with state-of-the-art automation, high-end Italian finishes, a climate-controlled wine cellar, and a private 3-car garage, this villa represents the absolute peak of coastal living.",
    status: "sale",
    price: 4850000,
    address: "2748 Ocean Vista Blvd",
    city: "Miami",
    neighborhood: "Coconut Grove",
    latitude: 25.7275,
    longitude: -80.2520,
    bedrooms: 5,
    bathrooms: 6,
    area: 580,
    propertyType: "villa",
    amenities: ["Swimming Pool", "Garage", "Garden", "Parking", "Furnished", "Wine Cellar", "Home Theater", "Smart Home System"],
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true,
    available: true,
    blueprintUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-2",
    title: "Modernist Concrete Loft",
    description: "Nestled in the historic heart of SoHo, this exceptionally designed loft offers double-height ceilings, raw concrete statement walls, and historic cast-iron window frames. Boasting luxury designer furniture, high-speed fiber internet, chef's custom kitchen, and exclusive building rooftop terrace access. A rare find for lovers of premium industrial design.",
    status: "rent",
    price: 4200,
    address: "104 Soho Arts St",
    city: "New York",
    neighborhood: "SoHo",
    latitude: 40.7233,
    longitude: -74.0030,
    bedrooms: 2,
    bathrooms: 2,
    area: 140,
    propertyType: "loft",
    amenities: ["Garage", "Furnished", "Parking", "Rooftop Terrace", "Gym Access", "Concierge Service"],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true,
    available: true,
    blueprintUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-3",
    title: "The Emerald Forest Cabin",
    description: "Surround yourself with tranquil Northwest nature in this beautiful luxury cabin on Bainbridge Island. Custom-crafted from premium red cedar, this home combines timeless rustic warmth with state-of-the-art sustainable elements like dynamic solar panels, high-efficiency geothermal heating, and deep wrap-around wooden decks perfect for enjoying sunset views over Puget Sound.",
    status: "sale",
    price: 1250000,
    address: "849 Whispering Pines Rd",
    city: "Seattle",
    neighborhood: "Bainbridge Island",
    latitude: 47.6263,
    longitude: -122.5212,
    bedrooms: 3,
    bathrooms: 2,
    area: 210,
    propertyType: "house",
    amenities: ["Garden", "Parking", "Furnished", "Fireplace", "Wood Deck", "Solar Panels"],
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: false,
    available: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-4",
    title: "Pacific Heights Glass Condo",
    description: "A breathtaking high-rise condominium in San Francisco's elite Pacific Heights district. Experience awe-inspiring, completely unobstructed floor-to-ceiling views of the Golden Gate Bridge and San Francisco Bay. Key details include curated modern art, premium appliances, full-time doorman service, a temperature-controlled indoor-outdoor lap pool, and two assigned parking stalls.",
    status: "rent",
    price: 6500,
    address: "2100 Broadway Ave, Apt 14B",
    city: "San Francisco",
    neighborhood: "Pacific Heights",
    latitude: 37.7946,
    longitude: -122.4356,
    bedrooms: 2,
    bathrooms: 2.5,
    area: 165,
    propertyType: "condo",
    amenities: ["Swimming Pool", "Garage", "Parking", "Furnished", "Concierge Service", "Balcony", "Floor-to-ceiling Windows"],
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true,
    available: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-5",
    title: "Minimalist Oasis Townhouse",
    description: "Tucked inside an exclusive residential enclave in downtown Austin, this architectural gem features clean lines, warm natural materials, and an outstanding private courtyard garden. The multi-level structure includes an expansive chef's kitchen, custom white oak cabinetry, private rooftop viewing deck, and smart integrated systems throughout.",
    status: "sale",
    price: 2400000,
    address: "402 Colorado Blvd",
    city: "Austin",
    neighborhood: "Downtown",
    latitude: 30.2672,
    longitude: -97.7431,
    bedrooms: 4,
    bathrooms: 3.5,
    area: 310,
    propertyType: "townhouse",
    amenities: ["Garden", "Parking", "Garage", "Rooftop Deck", "Smart Thermostat", "Security Alarm System"],
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true,
    available: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-6",
    title: "Sunset Strip Coastal Villa",
    description: "An extraordinary custom estate capturing the ultimate spirit of glamorous South Beach living. This pristine villa offers dynamic open living areas, dual private master wings, state-of-the-art spa baths, and a sprawling resort-style heated swimming pool bordered by high privacy hedges. Completely furnished with custom Italian pieces.",
    status: "rent",
    price: 12000,
    address: "1490 Ocean Dr",
    city: "Miami",
    neighborhood: "South Beach",
    latitude: 25.7826,
    longitude: -80.1300,
    bedrooms: 4,
    bathrooms: 4,
    area: 380,
    propertyType: "villa",
    amenities: ["Swimming Pool", "Garage", "Garden", "Parking", "Furnished", "Beach Access", "Outdoor Kitchen"],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: false,
    available: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-7",
    title: "Capitol Hill Cozy Apartment",
    description: "A lovely and light-filled penthouse-level apartment situated on Capitol Hill. Enjoy high ceilings, original brick details, fully renovated appliances, and a private wooden balcony. Ideal location within footsteps of Seattle's trendiest bakeries, vibrant boutique shops, and pristine city parks. Dedicated parking space included.",
    status: "rent",
    price: 2800,
    address: "1105 E Olive Way, Apt 302",
    city: "Seattle",
    neighborhood: "Capitol Hill",
    latitude: 47.6160,
    longitude: -122.3190,
    bedrooms: 1,
    bathrooms: 1,
    area: 75,
    propertyType: "apartment",
    amenities: ["Parking", "Furnished", "Pets Allowed", "Balcony", "Laundry in Unit"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: false,
    available: true,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "prop-8",
    title: "Sleek Waterfront Penthouse",
    description: "Step into this extraordinary modern penthouse overlooking the sparkling waters of Austin's Lady Bird Lake. Featuring a stunning custom steel staircase, double-sided glass hearth fireplace, dynamic kitchen layout, and a majestic wrap-around balcony that guarantees unforgettable entertaining with the dramatic city skyline as your backdrop.",
    status: "sale",
    price: 3200000,
    address: "702 Riverside Dr, Penthouse A",
    city: "Austin",
    neighborhood: "South Lake",
    latitude: 30.2581,
    longitude: -97.7410,
    bedrooms: 3,
    bathrooms: 3.5,
    area: 280,
    propertyType: "loft",
    amenities: ["Swimming Pool", "Garage", "Parking", "Furnished", "Rooftop Terrace", "Balcony", "Fireplace"],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
    ],
    featured: true,
    available: true,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_USERS: User[] = [
  {
    id: "user-admin",
    email: "admin@bnbg.it",
    username: "Admin Agent",
    role: "admin",
    password: "BnbgSecureAdmin2026!",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "user-customer",
    email: "user@estate.com",
    username: "John Doe",
    role: "user",
    password: "user123",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_INQUIRIES: Inquiry[] = [
  {
    id: "inq-1",
    propertyId: "prop-1",
    propertyTitle: "The Grand Horizon Villa",
    name: "Eleanor Vance",
    email: "eleanor.v@example.com",
    phone: "305-555-0192",
    message: "Hi, I am extremely interested in scheduling a private tour of The Grand Horizon Villa next Tuesday afternoon. I have pre-approval for $5M. Looking forward to hearing back soon!",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "new"
  },
  {
    id: "inq-2",
    propertyId: "prop-2",
    propertyTitle: "Modernist Concrete Loft",
    name: "Arthur Pendelton",
    email: "arthur.p@example.com",
    phone: "212-555-0144",
    message: "Is the loft available for a 12-month lease starting August 1st? I would also like to confirm if pets (one well-behaved corgi) are permitted in this listing. Thanks!",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: "contacted"
  },
  {
    id: "inq-3",
    propertyId: "prop-4",
    propertyTitle: "Pacific Heights Glass Condo",
    name: "Sophia Martinez",
    email: "sophia.m@example.com",
    phone: "415-555-0187",
    message: "Beautiful listing! Does the building provide dedicated electric vehicle charging ports in the assigned parking stalls? Please let me know so we can discuss.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "resolved"
  }
];

const SEED_FAVORITES: Record<string, string[]> = {
  "user@estate.com": ["prop-1", "prop-4"]
};

export class Db {
  private static loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const data = JSON.parse(fileContent);
        if (!data.cities) data.cities = DEFAULT_CITIES;
        if (!data.propertyTypes) data.propertyTypes = DEFAULT_PROPERTY_TYPES;
        return data;
      }
    } catch (e) {
      console.error("Error reading db.json, recreating", e);
    }

    const initialData: DatabaseSchema = {
      properties: SEED_PROPERTIES,
      users: SEED_USERS,
      inquiries: SEED_INQUIRIES,
      favorites: SEED_FAVORITES,
      cities: DEFAULT_CITIES,
      propertyTypes: DEFAULT_PROPERTY_TYPES
    };
    Db.saveData(initialData);
    return initialData;
  }

  private static saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing to db.json", e);
    }
  }

  // Properties CRUD
  static getProperties(): Property[] {
    return Db.loadData().properties;
  }

  static getPropertyById(id: string): Property | undefined {
    return Db.getProperties().find((p) => p.id === id);
  }

  static addProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt">): Property {
    const data = Db.loadData();
    const newProperty: Property = {
      ...property,
      id: "prop-" + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.properties.unshift(newProperty);
    Db.saveData(data);
    return newProperty;
  }

  static updateProperty(id: string, propertyUpdates: Partial<Omit<Property, "id" | "createdAt" | "updatedAt">>): Property | undefined {
    const data = Db.loadData();
    const index = data.properties.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const updatedProperty: Property = {
      ...data.properties[index],
      ...propertyUpdates,
      updatedAt: new Date().toISOString()
    };
    data.properties[index] = updatedProperty;
    Db.saveData(data);
    return updatedProperty;
  }

  static deleteProperty(id: string): boolean {
    const data = Db.loadData();
    const initialLen = data.properties.length;
    data.properties = data.properties.filter((p) => p.id !== id);
    if (data.properties.length === initialLen) return false;
    Db.saveData(data);
    return true;
  }

  // Users CRUD
  static getUsers(): User[] {
    return Db.loadData().users;
  }

  static findUserByEmail(email: string): User | undefined {
    return Db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  static addUser(user: Omit<User, "id" | "createdAt"> & { password?: string }): User {
    const data = Db.loadData();
    const newUser: User = {
      id: "user-" + Date.now(),
      email: user.email.toLowerCase(),
      username: user.username,
      role: user.role || "user",
      password: user.password || "",
      avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    Db.saveData(data);
    return newUser;
  }

  static updateUserProfile(email: string, updates: { username?: string; avatar?: string; password?: string }): User | undefined {
    const data = Db.loadData();
    const index = data.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) return undefined;

    const user = data.users[index];
    if (updates.username) user.username = updates.username;
    if (updates.avatar) user.avatar = updates.avatar;
    if (updates.password) user.password = updates.password;

    data.users[index] = user;
    Db.saveData(data);

    // Return without password
    const { password, ...safeUser } = user;
    return safeUser as User;
  }

  // Inquiries CRUD
  static getInquiries(): Inquiry[] {
    return Db.loadData().inquiries;
  }

  static addInquiry(inquiry: Omit<Inquiry, "id" | "createdAt" | "status">): Inquiry {
    const data = Db.loadData();
    const newInquiry: Inquiry = {
      ...inquiry,
      id: "inq-" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "new"
    };
    data.inquiries.unshift(newInquiry);
    Db.saveData(data);
    return newInquiry;
  }

  static updateInquiryStatus(id: string, status: "new" | "contacted" | "resolved"): Inquiry | undefined {
    const data = Db.loadData();
    const index = data.inquiries.findIndex((i) => i.id === id);
    if (index === -1) return undefined;

    data.inquiries[index].status = status;
    Db.saveData(data);
    return data.inquiries[index];
  }

  static deleteInquiry(id: string): boolean {
    const data = Db.loadData();
    const initialLen = data.inquiries.length;
    data.inquiries = data.inquiries.filter((i) => i.id !== id);
    if (data.inquiries.length === initialLen) return false;
    Db.saveData(data);
    return true;
  }

  // Favorites CRUD
  static getFavorites(email: string): string[] {
    const data = Db.loadData();
    return data.favorites[email.toLowerCase()] || [];
  }

  static toggleFavorite(email: string, propertyId: string): string[] {
    const data = Db.loadData();
    const userEmail = email.toLowerCase();
    let favs = data.favorites[userEmail] || [];

    if (favs.includes(propertyId)) {
      favs = favs.filter((id) => id !== propertyId);
    } else {
      favs.push(propertyId);
    }

    data.favorites[userEmail] = favs;
    Db.saveData(data);
    return favs;
  }

  // Stats for Admin Dashboard
  static getStats(): DashboardStats {
    const properties = Db.getProperties();
    const inquiries = Db.getInquiries();

    const activeRentals = properties.filter((p) => p.status === "rent" && p.available).length;
    const activeSales = properties.filter((p) => p.status === "sale" && p.available).length;

    const newInquiries = inquiries.filter((i) => i.status === "new").length;

    const saleProperties = properties.filter((p) => p.status === "sale");
    const rentProperties = properties.filter((p) => p.status === "rent");

    const averagePriceSale = saleProperties.length > 0 
      ? Math.round(saleProperties.reduce((sum, p) => sum + p.price, 0) / saleProperties.length)
      : 0;

    const averagePriceRent = rentProperties.length > 0
      ? Math.round(rentProperties.reduce((sum, p) => sum + p.price, 0) / rentProperties.length)
      : 0;

    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};

    properties.forEach((p) => {
      byType[p.propertyType] = (byType[p.propertyType] || 0) + 1;
      byCity[p.city] = (byCity[p.city] || 0) + 1;
    });

    // Generate monthly stats for the last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        month: months[d.getMonth()] + " " + String(d.getFullYear()).slice(-2),
        count: 0,
        mIndex: d.getMonth(),
        yVal: d.getFullYear()
      };
    }).reverse();

    inquiries.forEach((inq) => {
      const inqDate = new Date(inq.createdAt);
      const matched = last6Months.find(m => m.mIndex === inqDate.getMonth() && m.yVal === inqDate.getFullYear());
      if (matched) {
        matched.count += 1;
      }
    });

    const monthlyInquiries = last6Months.map(m => ({ month: m.month, count: m.count }));

    return {
      totalProperties: properties.length,
      activeRentals,
      activeSales,
      totalInquiries: inquiries.length,
      newInquiries,
      averagePriceSale,
      averagePriceRent,
      byType,
      byCity,
      monthlyInquiries
    };
  }

  // Meta CRUD (Cities)
  static getCities(): string[] {
    const data = Db.loadData();
    return data.cities || DEFAULT_CITIES;
  }

  static updateCities(cities: string[]): string[] {
    const data = Db.loadData();
    data.cities = cities.map(c => c.trim()).filter(Boolean);
    Db.saveData(data);
    return data.cities;
  }

  // Meta CRUD (Property Types)
  static getPropertyTypes(): string[] {
    const data = Db.loadData();
    return data.propertyTypes || DEFAULT_PROPERTY_TYPES;
  }

  static updatePropertyTypes(types: string[]): string[] {
    const data = Db.loadData();
    data.propertyTypes = types.map(t => t.trim()).filter(Boolean);
    Db.saveData(data);
    return data.propertyTypes;
  }
}
