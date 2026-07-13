import { createClient } from "@supabase/supabase-js";
import { Property, User, Inquiry, DashboardStats } from "./src/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_CITIES = ["Bergamo", "Milano", "Roma", "Torino", "Venezia"];
const DEFAULT_PROPERTY_TYPES = ["villa", "house", "apartment", "loft", "condo", "townhouse"];

export class Db {
  // ─── Properties ────────────────────────────────────────────────────────────

  static async getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) { console.error("getProperties:", error.message); return []; }
    return (data || []) as Property[];
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

  static async getInquiries(): Promise<Inquiry[]> {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) { console.error("getInquiries:", error.message); return []; }
    return (data || []) as Inquiry[];
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
}
