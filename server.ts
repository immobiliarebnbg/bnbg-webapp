import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { Db } from "./server_db";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Create Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

const getUserFromReq = async (req: express.Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  if (!token.startsWith("user_token__")) return null;
  const email = token.replace("user_token__", "");
  return Db.findUserByEmail(email);
};

const requireAuth = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Unauthorized access" });
  (req as any).user = user;
  next();
};

const requireAdmin = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = await getUserFromReq(req);
  if (!user || user.role !== "admin")
    return res.status(403).json({ error: "Access denied. Admins only." });
  (req as any).user = user;
  next();
};

// ─── Authentication API ───────────────────────────────────────────────────────

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const existingUser = await Db.findUserByEmail(email);
    if (existingUser)
      return res.status(400).json({ error: "User with this email already exists" });

    const newUser = await Db.addUser({ email, username, role: "user", password });
    const { password: _, ...safeUser } = newUser;
    const token = "user_token__" + newUser.email;

    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    const user = await Db.findUserByEmail(email);
    if (!user || user.password !== password)
      return res.status(401).json({ error: "Invalid email or password" });

    const { password: _, ...safeUser } = user;
    const token = "user_token__" + user.email;

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", requireAuth as any, async (req, res) => {
  const user = (req as any).user;
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.put("/api/auth/profile", requireAuth as any, async (req, res) => {
  try {
    const user = (req as any).user;
    const { username, avatar } = req.body;
    const updatedUser = await Db.updateUserProfile(user.email, { username, avatar });
    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json({ user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/password", requireAuth as any, async (req, res) => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;
    if (user.password !== currentPassword)
      return res.status(400).json({ error: "Incorrect current password" });
    await Db.updateUserProfile(user.email, { password: newPassword });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Metadata (Cities & Property Types) API ──────────────────────────────────

app.get("/api/meta", async (req, res) => {
  try {
    const [cities, propertyTypes] = await Promise.all([
      Db.getCities(),
      Db.getPropertyTypes(),
    ]);
    res.json({ cities, propertyTypes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/meta/cities", requireAdmin as any, async (req, res) => {
  try {
    const { cities } = req.body;
    if (!Array.isArray(cities))
      return res.status(400).json({ error: "cities must be an array of strings" });
    const updated = await Db.updateCities(cities);
    res.json({ success: true, cities: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/meta/property-types", requireAdmin as any, async (req, res) => {
  try {
    const { propertyTypes } = req.body;
    if (!Array.isArray(propertyTypes))
      return res.status(400).json({ error: "propertyTypes must be an array of strings" });
    const updated = await Db.updatePropertyTypes(propertyTypes);
    res.json({ success: true, propertyTypes: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Properties API ───────────────────────────────────────────────────────────

app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Db.getProperties();
    res.json({ properties });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/properties/:id", async (req, res) => {
  try {
    const property = await Db.getPropertyById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json({ property });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/properties", requireAdmin as any, async (req, res) => {
  try {
    const newProperty = await Db.addProperty(req.body);
    res.status(201).json({ property: newProperty });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/properties/:id", requireAdmin as any, async (req, res) => {
  try {
    const updatedProperty = await Db.updateProperty(req.params.id, req.body);
    if (!updatedProperty) return res.status(404).json({ error: "Property not found" });
    res.json({ property: updatedProperty });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/properties/:id", requireAdmin as any, async (req, res) => {
  try {
    const deleted = await Db.deleteProperty(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Property not found" });
    res.json({ success: true, message: "Property deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Favorites API ────────────────────────────────────────────────────────────

app.get("/api/favorites", requireAuth as any, async (req, res) => {
  try {
    const user = (req as any).user;
    const favoriteIds = await Db.getFavorites(user.email);
    const allProperties = await Db.getProperties();
    const properties = allProperties.filter((p) => favoriteIds.includes(p.id));
    res.json({ favorites: properties, favoriteIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/favorites/toggle", requireAuth as any, async (req, res) => {
  try {
    const user = (req as any).user;
    const { propertyId } = req.body;
    if (!propertyId) return res.status(400).json({ error: "Property ID required" });
    const favoriteIds = await Db.toggleFavorite(user.email, propertyId);
    res.json({ favoriteIds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Inquiries API ────────────────────────────────────────────────────────────

app.get("/api/inquiries", requireAdmin as any, async (req, res) => {
  try {
    const inquiries = await Db.getInquiries();
    res.json({ inquiries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/inquiries", async (req, res) => {
  try {
    const { propertyId, propertyTitle, name, email, phone, message } = req.body;
    if (!propertyId || !propertyTitle || !name || !email || !message)
      return res.status(400).json({ error: "Missing required contact details" });
    const newInquiry = await Db.addInquiry({
      propertyId,
      propertyTitle,
      name,
      email,
      phone: phone || "",
      message,
    });
    res.status(201).json({ inquiry: newInquiry, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/inquiries/:id/status", requireAdmin as any, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["new", "contacted", "resolved"].includes(status))
      return res.status(400).json({ error: "Invalid status value" });
    const updated = await Db.updateInquiryStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "Inquiry not found" });
    res.json({ inquiry: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/inquiries/:id", requireAdmin as any, async (req, res) => {
  try {
    const deleted = await Db.deleteInquiry(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Inquiry not found" });
    res.json({ success: true, message: "Inquiry deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Stats API ──────────────────────────────────────────────────────────

app.get("/api/stats", requireAdmin as any, async (req, res) => {
  try {
    const stats = await Db.getStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Gemini AI Description Generator ─────────────────────────────────────────

app.post("/api/generate-description", requireAdmin as any, async (req, res) => {
  try {
    if (!ai)
      return res.status(400).json({
        error: "Gemini API Key is not configured. Please add GEMINI_API_KEY to your applet secrets.",
      });

    const { title, propertyType, city, neighborhood, bedrooms, bathrooms, price, status, amenities } =
      req.body;

    if (!title || !propertyType || !city)
      return res.status(400).json({ error: "Missing basic fields for description generation." });

    const amenitiesStr =
      amenities && amenities.length > 0 ? amenities.join(", ") : "standard high-end features";

    const prompt = `You are an elite luxury real estate copywriter. Write a stunning, extremely elegant, compelling, and professional listing description for a real estate website.
Make it sound sophisticated, evocative, and luxurious (Zillow and Airbnb editorial vibe), using beautiful vocabulary without overdoing it.
Here are the property details:
- Title: "${title}"
- Property Type: ${propertyType}
- For: ${status === "sale" ? "Sale" : "Rent"}
- Price: $${price.toLocaleString()} ${status === "rent" ? "per month" : ""}
- Location: ${neighborhood ? neighborhood + ", " : ""}${city}
- Specs: ${bedrooms} Bedrooms, ${bathrooms} Bathrooms
- Key Amenities: ${amenitiesStr}

Write a single, polished paragraph (roughly 120-180 words) focusing on the lifestyle, structural grandeur, architectural warmth, and outstanding attributes. Provide only the text paragraph without other comments or titles.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.85 },
    });

    const text = response.text?.trim() || "Failed to generate description.";
    res.json({ description: text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vite / Static Assets ─────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
