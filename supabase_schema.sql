-- ============================================================
-- Supabase Database Schema for Real Estate Platform (BNBG)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('sale', 'rent')),
  price NUMERIC NOT NULL,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  bedrooms NUMERIC,
  bathrooms NUMERIC,
  area NUMERIC,
  "propertyType" TEXT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  "googleMapsUrl" TEXT,
  "blueprintUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  password TEXT,
  avatar TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  "propertyId" TEXT,
  "propertyTitle" TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  "userEmail" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  UNIQUE("userEmail", "propertyId")
);

-- Metadata table (for cities and property types)
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Seed default cities and property types
INSERT INTO metadata (key, value)
VALUES
  ('cities', '["Bergamo","Milano","Roma","Torino","Venezia"]'),
  ('propertyTypes', '["villa","house","apartment","loft","condo","townhouse"]')
ON CONFLICT (key) DO NOTHING;

-- Seed the admin user (change password as needed)
INSERT INTO users (id, email, username, role, password, "createdAt")
VALUES (
  'user-admin',
  'admin@bnbg.it',
  'Admin BNBG',
  'admin',
  'BnbgSecureAdmin2026!',
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS) - Disabled for server-side access
-- The service role key bypasses RLS automatically.
-- Enable RLS only if you need client-side access restrictions.
-- ============================================================
