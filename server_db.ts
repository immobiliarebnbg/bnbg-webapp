import { createClient } from "@supabase/supabase-js";
import { Property, User, Inquiry, DashboardStats } from "./src/types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment variables.");
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CITIES = ["Bergamo", "Milano", "Roma", "Torino", "Venezia"];
const DEFAULT_PROPERTY_TYPES = ["villa", "house", "apartment", "loft", "condo", "townhouse"];

export class Db {
  // ─── Properties ────────────────────────────────────────────────────────────

  private static cachedProperties: Property[] | null = null;
  private static propertiesLastFetched: number = 0;
  private static propertiesFetchPromise: Promise<Property[]> | null = null;
  private static CACHE_TTL_MS = 60000; // 1 minute

  static async getProperties(forceRefresh = false): Promise<Property[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedProperties && (now - this.propertiesLastFetched < this.CACHE_TTL_MS)) {
      return this.cachedProperties;
    }

    if (!forceRefresh && this.propertiesFetchPromise) {
      return this.propertiesFetchPromise;
    }

    this.propertiesFetchPromise = (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .limit(100);
      if (error) { console.error("getProperties:", error.message); return this.cachedProperties || []; }
      
      // Optimize payload size for list endpoint by only sending the first image
      const optimized = (data || []).map((p: any) => ({
        ...p,
        images: p.images && p.images.length > 0 ? [p.images[0]] : []
      }));
      
      this.cachedProperties = optimized as Property[];
      this.propertiesLastFetched = Date.now();
      this.propertiesFetchPromise = null;
      return this.cachedProperties;
    })();

    return this.propertiesFetchPromise;
  }

  static async getPropertyById(id: string): Promise<Property | undefined> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return undefined;
    return data as Property;
  }

  static async addProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt">): Promise<Property> {
    const now = new Date().toISOString();
    const newProperty = {
      ...property,
      id: "prop-" + Date.now(),
      createdAt: now,
      updatedAt: now,
    };
    const { data, error } = await supabase
      .from("properties")
      .insert(newProperty)
      .select()
      .single();
    if (error) throw new Error(error.message);
    this.propertiesLastFetched = 0; // Invalidate cache
    return data as Property;
  }

  static async updateProperty(
    id: string,
    updates: Partial<Omit<Property, "id" | "createdAt" | "updatedAt">>
  ): Promise<Property | undefined> {
    const { data, error } = await supabase
      .from("properties")
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return undefined;
    return data as Property;
  }

  static async deleteProperty(id: string): Promise<boolean> {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    return !error;
  }

  // ─── Users ─────────────────────────────────────────────────────────────────

  static async findUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .single();
    if (error) return undefined;
    return data as User;
  }

  static async addUser(
    user: Omit<User, "id" | "createdAt"> & { password?: string }
  ): Promise<User> {
    const newUser = {
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
    const { data, error } = await supabase
      .from("users")
      .insert(newUser)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as User;
  }

  static async updateUserProfile(
    email: string,
    updates: { username?: string; avatar?: string; password?: string }
  ): Promise<User | undefined> {
    const updateData: Record<string, string> = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.avatar) updateData.avatar = updates.avatar;
    if (updates.password) updateData.password = updates.password;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .ilike("email", email)
      .select()
      .single();
    if (error) return undefined;
    const { password: _, ...safeUser } = data;
    return safeUser as User;
  }

  // ─── Inquiries ──────────────────────────────────────────────────────────────

  private static cachedInquiries: Inquiry[] | null = null;
  private static inquiriesLastFetched: number = 0;
  private static inquiriesFetchPromise: Promise<Inquiry[]> | null = null;

  static async getInquiries(forceRefresh = false): Promise<Inquiry[]> {
    const now = Date.now();
    if (!forceRefresh && this.cachedInquiries && (now - this.inquiriesLastFetched < this.CACHE_TTL_MS)) {
      return this.cachedInquiries;
    }

    if (!forceRefresh && this.inquiriesFetchPromise) {
      return this.inquiriesFetchPromise;
    }

    this.inquiriesFetchPromise = (async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .limit(500);
      if (error) { console.error("getInquiries:", error.message); return this.cachedInquiries || []; }
      
      this.cachedInquiries = (data || []) as Inquiry[];
      this.inquiriesLastFetched = Date.now();
      this.inquiriesFetchPromise = null;
      return this.cachedInquiries;
    })();

    return this.inquiriesFetchPromise;
  }

  static async addInquiry(
    inquiry: Omit<Inquiry, "id" | "createdAt" | "status">
  ): Promise<Inquiry> {
    const newInquiry = {
      ...inquiry,
      id: "inq-" + Date.now(),
      createdAt: new Date().toISOString(),
      status: "new",
    };
    const { data, error } = await supabase
      .from("inquiries")
      .insert(newInquiry)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Inquiry;
  }

  static async updateInquiryStatus(
    id: string,
    status: "new" | "contacted" | "resolved"
  ): Promise<Inquiry | undefined> {
    const { data, error } = await supabase
      .from("inquiries")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) return undefined;
    return data as Inquiry;
  }

  static async deleteInquiry(id: string): Promise<boolean> {
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    return !error;
  }

  // ─── Favorites ──────────────────────────────────────────────────────────────

  static async getFavorites(email: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("favorites")
      .select("propertyId")
      .eq("userEmail", email.toLowerCase());
    if (error) return [];
    return (data || []).map((f: any) => f.propertyId);
  }

  static async toggleFavorite(email: string, propertyId: string): Promise<string[]> {
    const userEmail = email.toLowerCase();
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("userEmail", userEmail)
      .eq("propertyId", propertyId)
      .single();

    if (existing) {
      await supabase
        .from("favorites")
        .delete()
        .eq("userEmail", userEmail)
        .eq("propertyId", propertyId);
    } else {
      await supabase
        .from("favorites")
        .insert({ id: "fav-" + Date.now(), userEmail, propertyId });
    }

    return Db.getFavorites(userEmail);
  }

  // ─── Stats ──────────────────────────────────────────────────────────────────

  static async getStats(): Promise<DashboardStats> {
    const [properties, inquiries] = await Promise.all([
      Db.getProperties(),
      Db.getInquiries(),
    ]);

    const activeRentals = properties.filter((p) => p.status === "rent" && p.available).length;
    const activeSales = properties.filter((p) => p.status === "sale" && p.available).length;
    const newInquiries = inquiries.filter((i) => i.status === "new").length;

    const saleProps = properties.filter((p) => p.status === "sale");
    const rentProps = properties.filter((p) => p.status === "rent");

    const averagePriceSale =
      saleProps.length > 0
        ? Math.round(saleProps.reduce((s, p) => s + p.price, 0) / saleProps.length)
        : 0;
    const averagePriceRent =
      rentProps.length > 0
        ? Math.round(rentProps.reduce((s, p) => s + p.price, 0) / rentProps.length)
        : 0;

    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    properties.forEach((p) => {
      byType[p.propertyType] = (byType[p.propertyType] || 0) + 1;
      byCity[p.city] = (byCity[p.city] || 0) + 1;
    });

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const last6 = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { month: months[d.getMonth()] + " " + String(d.getFullYear()).slice(-2), count: 0, mIndex: d.getMonth(), yVal: d.getFullYear() };
    }).reverse();

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
      const { data, error } = await supabase
        .from("metadata")
        .select("value")
        .eq("key", "cities")
        .single();
      if (error || !data) return DEFAULT_CITIES;
      return JSON.parse(data.value);
    } catch {
      return DEFAULT_CITIES;
    }
  }

  static async updateCities(cities: string[]): Promise<string[]> {
    const clean = cities.map((c) => c.trim()).filter(Boolean);
    await supabase
      .from("metadata")
      .upsert({ key: "cities", value: JSON.stringify(clean) }, { onConflict: "key" });
    return clean;
  }

  static async getPropertyTypes(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("metadata")
        .select("value")
        .eq("key", "propertyTypes")
        .single();
      if (error || !data) return DEFAULT_PROPERTY_TYPES;
      return JSON.parse(data.value);
    } catch {
      return DEFAULT_PROPERTY_TYPES;
    }
  }

  static async updatePropertyTypes(types: string[]): Promise<string[]> {
    const clean = types.map((t) => t.trim()).filter(Boolean);
    await supabase
      .from("metadata")
      .upsert({ key: "propertyTypes", value: JSON.stringify(clean) }, { onConflict: "key" });
    return clean;
  }

  static async getBrokerInfo() {
    const defaultBroker = {
      name: "Vanessa Sterling",
      role: "Senior Relocation Specialist",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
    };
    try {
      const { data, error } = await supabase
        .from("metadata")
        .select("value")
        .eq("key", "brokerInfo")
        .single();
      if (error || !data) return defaultBroker;
      return JSON.parse(data.value);
    } catch {
      return defaultBroker;
    }
  }

  static async updateBrokerInfo(brokerInfo: any) {
    await supabase
      .from("metadata")
      .upsert({ key: "brokerInfo", value: JSON.stringify(brokerInfo) }, { onConflict: "key" });
    return brokerInfo;
  }
}
