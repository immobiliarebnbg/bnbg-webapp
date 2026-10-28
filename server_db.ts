import "dotenv/config";
import mysql from "mysql2/promise";
import { Property, PropertyDealStatus, User, Inquiry, DashboardStats } from "./src/types";

// ─── Database Engine Configuration ──────────────────────────────────────────

const host = process.env.MYSQL_HOST || "localhost";
const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

if (!database || !user) {
  console.error("❌ FATAL: MySQL configuration missing in .env (MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD).");
  process.exit(1);
}

export const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

console.log(`🐬 Database Engine: Connected via Hostinger MySQL Pool [${database} @ ${host}]`);

const DEFAULT_CITIES = ["Bergamo", "Milano", "Roma", "Torino", "Venezia"];
const DEFAULT_PROPERTY_TYPES = [
  "villa",
  "house",
  "apartment",
  "loft",
  "condo",
  "townhouse",
  "negozio/ufficio",
  "monolocale",
  "bilocale",
  "trilocale",
  "magazzino",
];

// Helper to format a raw MySQL property record into a typed Property object
function formatPropertyRow(row: any): Property {
  let amenities: string[] = [];
  try {
    amenities =
      typeof row.amenities === "string" ? JSON.parse(row.amenities) : row.amenities || [];
  } catch {
    amenities = [];
  }

  let images: string[] = [];
  try {
    images = typeof row.images === "string" ? JSON.parse(row.images) : row.images || [];
  } catch {
    images = [];
  }

  return {
    ...row,
    price: Number(row.price),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    area: Number(row.area),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    featured: row.featured === 1 || row.featured === true || row.featured === "1",
    available: row.available === 1 || row.available === true || row.available === "1",
    dealStatus: (row.dealStatus as PropertyDealStatus) || "available",
    amenities,
    images,
  };
}

export class Db {
  // ─── Properties ────────────────────────────────────────────────────────────

  private static cachedProperties: Property[] | null = null;
  private static propertiesLastFetched: number = 0;
  private static propertiesFetchPromise: Promise<Property[]> | null = null;
  private static CACHE_TTL_MS = 60000; // 1 minute

  static async getProperties(forceRefresh = false): Promise<Property[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedProperties && now - this.propertiesLastFetched < this.CACHE_TTL_MS) {
      return this.cachedProperties;
    }

    if (!forceRefresh && this.propertiesFetchPromise) {
      return this.propertiesFetchPromise;
    }

    this.propertiesFetchPromise = (async () => {
      try {
        const [rows] = await pool.query("SELECT * FROM properties LIMIT 100");
        const rawProperties = (rows as any[]).map(formatPropertyRow);

        // Optimize payload size for list endpoint by only sending the first image
        const optimized = rawProperties.map((p: any) => ({
          ...p,
          images: p.images && p.images.length > 0 ? [p.images[0]] : [],
        }));

        this.cachedProperties = optimized as Property[];
        this.propertiesLastFetched = Date.now();
        this.propertiesFetchPromise = null;
        return this.cachedProperties;
      } catch (err: any) {
        console.error("MySQL getProperties error:", err.message);
        this.propertiesFetchPromise = null;
        if (this.cachedProperties && this.cachedProperties.length > 0) {
          return this.cachedProperties;
        }
        throw err;
      }
    })();

    return this.propertiesFetchPromise;
  }

  static async getPropertyById(id: string): Promise<Property | undefined> {
    try {
      const [rows] = await pool.execute("SELECT * FROM properties WHERE id = ? LIMIT 1", [id]);
      const list = rows as any[];
      if (list.length === 0) return undefined;
      return formatPropertyRow(list[0]);
    } catch (err: any) {
      console.error("MySQL getPropertyById error:", err.message);
      return undefined;
    }
  }

  static invalidatePropertiesCache(): void {
    this.cachedProperties = null;
    this.propertiesLastFetched = 0;
    this.propertiesFetchPromise = null;
  }

  static async addProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt">): Promise<Property> {
    const now = new Date().toISOString();
    const newProperty: Property = {
      ...property,
      id: "prop-" + Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    await pool.execute(
      `INSERT INTO properties (
        id, title, description, status, price, address, city, neighborhood,
        latitude, longitude, bedrooms, bathrooms, area, propertyType,
        amenities, images, featured, available, googleMapsUrl, blueprintUrl, dealStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProperty.id,
        newProperty.title,
        newProperty.description || "",
        newProperty.status,
        newProperty.price || 0,
        newProperty.address || "",
        newProperty.city,
        newProperty.neighborhood || "",
        newProperty.latitude || 0,
        newProperty.longitude || 0,
        newProperty.bedrooms || 0,
        newProperty.bathrooms || 0,
        newProperty.area || 0,
        newProperty.propertyType,
        JSON.stringify(newProperty.amenities || []),
        JSON.stringify(newProperty.images || []),
        newProperty.featured ? 1 : 0,
        newProperty.available ? 1 : 0,
        newProperty.googleMapsUrl || "",
        newProperty.blueprintUrl || "",
        newProperty.dealStatus || "available",
        newProperty.createdAt,
        newProperty.updatedAt,
      ]
    );

    const optimized = {
      ...newProperty,
      images: newProperty.images && newProperty.images.length > 0 ? [newProperty.images[0]] : [],
    };
    if (this.cachedProperties) {
      this.cachedProperties = [optimized as Property, ...this.cachedProperties.filter((p) => p.id !== newProperty.id)];
    } else {
      this.cachedProperties = [optimized as Property];
    }
    this.propertiesLastFetched = Date.now();
    this.propertiesFetchPromise = null;
    return newProperty;
  }

  static async updateProperty(
    id: string,
    updates: Partial<Omit<Property, "id" | "createdAt" | "updatedAt">>
  ): Promise<Property | undefined> {
    const existing = await this.getPropertyById(id);
    if (!existing) return undefined;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await pool.execute(
      `UPDATE properties SET
        title = ?, description = ?, status = ?, price = ?, address = ?,
        city = ?, neighborhood = ?, latitude = ?, longitude = ?, bedrooms = ?,
        bathrooms = ?, area = ?, propertyType = ?, amenities = ?, images = ?,
        featured = ?, available = ?, googleMapsUrl = ?, blueprintUrl = ?, dealStatus = ?, updatedAt = ?
      WHERE id = ?`,
      [
        merged.title,
        merged.description || "",
        merged.status,
        merged.price || 0,
        merged.address || "",
        merged.city,
        merged.neighborhood || "",
        merged.latitude || 0,
        merged.longitude || 0,
        merged.bedrooms || 0,
        merged.bathrooms || 0,
        merged.area || 0,
        merged.propertyType,
        JSON.stringify(merged.amenities || []),
        JSON.stringify(merged.images || []),
        merged.featured ? 1 : 0,
        merged.available ? 1 : 0,
        merged.googleMapsUrl || "",
        merged.blueprintUrl || "",
        merged.dealStatus || "available",
        merged.updatedAt,
        id,
      ]
    );

    const optimized = {
      ...merged,
      images: merged.images && merged.images.length > 0 ? [merged.images[0]] : [],
    };
    if (this.cachedProperties) {
      this.cachedProperties = this.cachedProperties.map((p) => (p.id === id ? (optimized as Property) : p));
    }
    this.propertiesLastFetched = Date.now();
    this.propertiesFetchPromise = null;
    return merged;
  }

  static async deleteProperty(id: string): Promise<boolean> {
    const [res] = await pool.execute("DELETE FROM properties WHERE id = ?", [id]);
    const deleted = (res as any).affectedRows > 0;
    if (deleted) {
      if (this.cachedProperties) {
        this.cachedProperties = this.cachedProperties.filter((p) => p.id !== id);
      }
      this.propertiesLastFetched = Date.now();
      this.propertiesFetchPromise = null;
    }
    return deleted;
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  static async findUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1", [email]);
      const list = rows as any[];
      if (list.length === 0) return undefined;
      return list[0] as User;
    } catch (err: any) {
      console.error("MySQL findUserByEmail error:", err.message);
      return undefined;
    }
  }

  static async addUser(user: Omit<User, "id" | "createdAt"> & { password?: string }): Promise<User> {
    const newUser: User = {
      id: "user-" + Date.now(),
      email: user.email.toLowerCase(),
      username: user.username,
      role: user.role || "user",
      password: user.password || "",
      avatar:
        user.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.username)}`,
      createdAt: new Date().toISOString(),
    };

    await pool.execute(
      "INSERT INTO users (id, email, username, role, password, avatar, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        newUser.id,
        newUser.email,
        newUser.username,
        newUser.role,
        newUser.password,
        newUser.avatar,
        newUser.createdAt,
      ]
    );
    return newUser;
  }

  static async updateUserProfile(
    email: string,
    updates: { username?: string; avatar?: string; password?: string }
  ): Promise<User | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    if (updates.username !== undefined) {
      fields.push("username = ?");
      values.push(updates.username);
    }
    if (updates.avatar !== undefined) {
      fields.push("avatar = ?");
      values.push(updates.avatar);
    }
    if (updates.password !== undefined) {
      fields.push("password = ?");
      values.push(updates.password);
    }

    if (fields.length > 0) {
      values.push(email.toLowerCase());
      await pool.execute(`UPDATE users SET ${fields.join(", ")} WHERE LOWER(email) = ?`, values);
    }

    const updated = await this.findUserByEmail(email);
    if (!updated) return undefined;
    const { password: _, ...safeUser } = updated;
    return safeUser as User;
  }

  // ─── Inquiries ──────────────────────────────────────────────────────────────

  private static cachedInquiries: Inquiry[] | null = null;
  private static inquiriesLastFetched: number = 0;
  private static inquiriesFetchPromise: Promise<Inquiry[]> | null = null;

  static async getInquiries(forceRefresh = false): Promise<Inquiry[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedInquiries && now - this.inquiriesLastFetched < this.CACHE_TTL_MS) {
      return this.cachedInquiries;
    }

    if (!forceRefresh && this.inquiriesFetchPromise) {
      return this.inquiriesFetchPromise;
    }

    this.inquiriesFetchPromise = (async () => {
      try {
        const [rows] = await pool.query("SELECT * FROM inquiries ORDER BY createdAt DESC LIMIT 500");
        this.cachedInquiries = rows as Inquiry[];
      } catch (err: any) {
        console.error("MySQL getInquiries error:", err.message);
        this.cachedInquiries = [];
      }
      this.inquiriesLastFetched = Date.now();
      this.inquiriesFetchPromise = null;
      return this.cachedInquiries;
    })();

    return this.inquiriesFetchPromise;
  }

  static async addInquiry(inquiry: Omit<Inquiry, "id" | "createdAt" | "status">): Promise<Inquiry> {
    const newInquiry: Inquiry = {
      ...inquiry,
      id: "inq-" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "new",
    };

    await pool.execute(
      `INSERT INTO inquiries (id, propertyId, propertyTitle, name, email, phone, message, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newInquiry.id,
        newInquiry.propertyId,
        newInquiry.propertyTitle,
        newInquiry.name,
        newInquiry.email,
        newInquiry.phone,
        newInquiry.message,
        newInquiry.status,
        newInquiry.createdAt,
      ]
    );
    this.cachedInquiries = null;
    return newInquiry;
  }

  static async updateInquiryStatus(
    id: string,
    status: "new" | "contacted" | "resolved"
  ): Promise<Inquiry | undefined> {
    await pool.execute("UPDATE inquiries SET status = ? WHERE id = ?", [status, id]);
    const [rows] = await pool.execute("SELECT * FROM inquiries WHERE id = ? LIMIT 1", [id]);
    const list = rows as any[];
    if (list.length === 0) return undefined;
    this.cachedInquiries = null;
    return list[0] as Inquiry;
  }

  static async deleteInquiry(id: string): Promise<boolean> {
    const [res] = await pool.execute("DELETE FROM inquiries WHERE id = ?", [id]);
    this.cachedInquiries = null;
    return (res as any).affectedRows > 0;
  }

  // ─── Favorites ──────────────────────────────────────────────────────────────

  static async getFavorites(email: string): Promise<string[]> {
    try {
      const [rows] = await pool.execute("SELECT propertyId FROM favorites WHERE LOWER(userEmail) = LOWER(?)", [
        email,
      ]);
      return (rows as any[]).map((f: any) => f.propertyId);
    } catch (err: any) {
      console.error("MySQL getFavorites error:", err.message);
      return [];
    }
  }

  static async toggleFavorite(email: string, propertyId: string): Promise<string[]> {
    const userEmail = email.toLowerCase();
    const [rows] = await pool.execute(
      "SELECT id FROM favorites WHERE LOWER(userEmail) = LOWER(?) AND propertyId = ? LIMIT 1",
      [userEmail, propertyId]
    );
    if ((rows as any[]).length > 0) {
      await pool.execute("DELETE FROM favorites WHERE LOWER(userEmail) = LOWER(?) AND propertyId = ?", [
        userEmail,
        propertyId,
      ]);
    } else {
      await pool.execute("INSERT INTO favorites (id, userEmail, propertyId) VALUES (?, ?, ?)", [
        "fav-" + Date.now(),
        userEmail,
        propertyId,
      ]);
    }
    return Db.getFavorites(userEmail);
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  static async getStats(): Promise<DashboardStats> {
    const [properties, inquiries] = await Promise.all([Db.getProperties(), Db.getInquiries()]);

    const activeRentals = properties.filter((p) => p.status === "rent" && p.available).length;
    const activeSales = properties.filter((p) => p.status === "sale" && p.available).length;
    const newInquiries = inquiries.filter((i) => i.status === "new").length;

    const saleProps = properties.filter((p) => p.status === "sale");
    const rentProps = properties.filter((p) => p.status === "rent");

    const averagePriceSale =
      saleProps.length > 0 ? Math.round(saleProps.reduce((s, p) => s + p.price, 0) / saleProps.length) : 0;
    const averagePriceRent =
      rentProps.length > 0 ? Math.round(rentProps.reduce((s, p) => s + p.price, 0) / rentProps.length) : 0;

    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    properties.forEach((p) => {
      byType[p.propertyType] = (byType[p.propertyType] || 0) + 1;
      byCity[p.city] = (byCity[p.city] || 0) + 1;
    });

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6 = Array.from({ length: 6 })
      .map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
          month: months[d.getMonth()] + " " + String(d.getFullYear()).slice(-2),
          count: 0,
          mIndex: d.getMonth(),
          yVal: d.getFullYear(),
        };
      })
      .reverse();

    inquiries.forEach((inq) => {
      const d = new Date(inq.createdAt);
      const m = last6.find((x) => x.mIndex === d.getMonth() && x.yVal === d.getFullYear());
      if (m) m.count++;
    });

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
      monthlyInquiries: last6.map((m) => ({ month: m.month, count: m.count })),
    };
  }

  // ─── Metadata (Cities & Property Types) ────────────────────────────────────

  static async getCities(): Promise<string[]> {
    try {
      const [rows] = await pool.execute("SELECT `value` FROM metadata WHERE `key` = 'cities' LIMIT 1");
      const list = rows as any[];
      if (list.length === 0 || !list[0].value) return DEFAULT_CITIES;
      return JSON.parse(list[0].value);
    } catch {
      return DEFAULT_CITIES;
    }
  }

  static async updateCities(cities: string[]): Promise<string[]> {
    const clean = cities.map((c) => c.trim()).filter(Boolean);
    await pool.execute(
      "INSERT INTO metadata (`key`, `value`) VALUES ('cities', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
      [JSON.stringify(clean)]
    );
    return clean;
  }

  static async getPropertyTypes(): Promise<string[]> {
    try {
      const [rows] = await pool.execute("SELECT `value` FROM metadata WHERE `key` = 'propertyTypes' LIMIT 1");
      const list = rows as any[];
      if (list.length === 0 || !list[0].value) return DEFAULT_PROPERTY_TYPES;
      return JSON.parse(list[0].value);
    } catch {
      return DEFAULT_PROPERTY_TYPES;
    }
  }

  static async updatePropertyTypes(types: string[]): Promise<string[]> {
    const clean = types.map((t) => t.trim()).filter(Boolean);
    await pool.execute(
      "INSERT INTO metadata (`key`, `value`) VALUES ('propertyTypes', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
      [JSON.stringify(clean)]
    );
    return clean;
  }

  static async getBrokerInfo() {
    const defaultBroker = {
      name: "bnbg",
      role: "Senior Relocation Specialist",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80",
    };
    try {
      const [rows] = await pool.execute("SELECT `value` FROM metadata WHERE `key` = 'brokerInfo' LIMIT 1");
      const list = rows as any[];
      if (list.length === 0 || !list[0].value) return defaultBroker;
      return JSON.parse(list[0].value);
    } catch {
      return defaultBroker;
    }
  }

  static async updateBrokerInfo(brokerInfo: any) {
    await pool.execute(
      "INSERT INTO metadata (`key`, `value`) VALUES ('brokerInfo', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
      [JSON.stringify(brokerInfo)]
    );
    return brokerInfo;
  }
}
