import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import fs from "fs/promises";
import path from "path";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "closetmix_super_secret_dev_key_at_least_32_chars_long"
);
const SESSION_COOKIE_NAME = "closetmix_session";
const TOKEN_EXPIRY = "30d";

export interface SessionPayload {
  userId: string;
  email?: string | null;
  isGuest: boolean;
  name?: string | null;
}

/**
 * Signs a JWT session token.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT session token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string | null | undefined,
      isGuest: Boolean(payload.isGuest),
      name: payload.name as string | null | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie on the response.
 */
export async function setSessionCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  } catch {
    // Non-HTTP context (e.g. test scripts, seeders)
  }
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Non-HTTP context
  }
}

/**
 * Retrieves the current authenticated or guest user from cookies.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      isGuest: true,
      preferences: true,
      createdAt: true,
      _count: {
        select: {
          clothingItems: true,
          outfits: true,
        },
      },
    },
  });

  return user;
}

/**
 * Creates an anonymous guest user and returns the user object and session token.
 */
export async function createGuestSession() {
  const guestUser = await prisma.user.create({
    data: {
      isGuest: true,
      name: "Guest Explorer",
      preferences: JSON.stringify({
        preferredColors: [],
        excludedColors: [],
        styles: ["Casual", "Smart Casual"],
        defaultFormality: "Casual",
      }),
    },
  });

  const token = await signSessionToken({
    userId: guestUser.id,
    isGuest: true,
    name: guestUser.name,
  });

  await setSessionCookie(token);
  return guestUser;
}

/**
 * Registers a new user with email and password.
 */
export async function registerUser(email: string, password: string, name?: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name?.trim() || "Style Enthusiast",
      passwordHash,
      isGuest: false,
      preferences: JSON.stringify({
        preferredColors: [],
        excludedColors: [],
        styles: ["Casual", "Smart Casual"],
        defaultFormality: "Smart Casual",
      }),
    },
  });

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    isGuest: false,
  });

  await setSessionCookie(token);
  return { id: user.id, email: user.email, name: user.name, isGuest: false };
}

/**
 * Authenticates an existing user with email and password.
 */
export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  const token = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    isGuest: false,
  });

  await setSessionCookie(token);
  return { id: user.id, email: user.email, name: user.name, isGuest: false };
}

/**
 * Upgrades a guest user to a permanent account, preserving all closet items and outfits.
 */
export async function upgradeGuestUser(guestUserId: string, email: string, password: string, name?: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const updatedUser = await prisma.user.update({
    where: { id: guestUserId },
    data: {
      email: normalizedEmail,
      passwordHash,
      name: name?.trim() || "Wardrobe Curator",
      isGuest: false,
    },
  });

  const token = await signSessionToken({
    userId: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    isGuest: false,
  });

  await setSessionCookie(token);
  return { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, isGuest: false };
}

/**
 * GDPR & Privacy Compliance: Completely deletes a user's account, database records,
 * and all stored images from disk.
 */
export async function purgeUserData(userId: string) {
  // 1. Purge physical storage folder with retry for Windows lock release
  const userDir = path.join(process.cwd(), "public", "uploads", userId);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fs.rm(userDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      break;
    } catch (err: any) {
      if (attempt === 2) {
        console.error(`Failed to clean user directory for ${userId}:`, err);
      } else {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  // 2. Cascade delete database records
  await prisma.user.delete({
    where: { id: userId },
  });

  // 3. Clear session cookie
  await clearSessionCookie();
}
