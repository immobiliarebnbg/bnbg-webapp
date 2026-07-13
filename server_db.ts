import fs from "fs";
import path from "path";
import { Property, User, Inquiry, SearchFilters, DashboardStats } from "./src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

const DEFAULT_CITIES = ["Bergamo", "Milano", "Roma", "Torino", "Venezia"];
const DEFAULT_PROPERTY_TYPES = ["villa", "house", "apartment", "loft", "condo", "townhouse"];

interface DatabaseSchema {
  properties: Property[];
  users: User[];
  inquiries: Inquiry[];
  favorites: Record<string, string[]>; // userEmail -> propertyId[]
  cities?: string[];
  propertyTypes?: string[];
}

const SEED_USERS: User[] = [
  {
    id: "user-admin",
    email: "admin@bnbg.it",
    username: "Admin BNBG",
    role: "admin",
    password: "BnbgSecureAdmin2026!",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

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
      properties: [],
      users: SEED_USERS,
      inquiries: [],
      favorites: {},
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
