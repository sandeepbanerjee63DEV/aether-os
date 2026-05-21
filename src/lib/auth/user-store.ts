import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { Role } from "@prisma/client";

/**
 * Memory-first user store with best-effort disk persistence.
 *
 * - Local dev: persists to `<project>/.data/users.json`
 * - Serverless (Vercel): falls back to `os.tmpdir()`, then in-memory only
 *
 * Swap with Prisma in production by setting DATABASE_URL.
 */

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  title: string | null;
  role: Role;
  avatar: string | null;
  refreshToken: string | null;
  createdAt: string;
}

function pickDataDir(): string {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) return path.join(os.tmpdir(), "aether-os");
  return path.join(process.cwd(), ".data");
}

const DATA_DIR = pickDataDir();
const USERS_FILE = path.join(DATA_DIR, "users.json");

const cache: { users: StoredUser[]; loaded: boolean } = { users: [], loaded: false };

async function safeRead(): Promise<StoredUser[] | null> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return null;
  }
}

async function safeWrite(data: StoredUser[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    /* read-only filesystem — memory cache remains authoritative */
  }
}

async function ensureLoaded(): Promise<void> {
  if (cache.loaded) return;
  cache.loaded = true;
  const fromDisk = await safeRead();
  cache.users = fromDisk ?? [];
}

export const userStore = {
  async findByEmail(email: string): Promise<StoredUser | null> {
    await ensureLoaded();
    return cache.users.find((u) => u.email === email.toLowerCase().trim()) || null;
  },

  async count(): Promise<number> {
    await ensureLoaded();
    return cache.users.length;
  },

  async create(input: {
    email: string;
    passwordHash: string;
    name: string;
    title?: string | null;
    role: Role;
  }): Promise<StoredUser> {
    await ensureLoaded();
    const user: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: input.email.toLowerCase().trim(),
      passwordHash: input.passwordHash,
      name: input.name,
      title: input.title ?? null,
      role: input.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.email)}`,
      refreshToken: null,
      createdAt: new Date().toISOString(),
    };
    cache.users.push(user);
    await safeWrite(cache.users);
    return user;
  },

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    await ensureLoaded();
    const idx = cache.users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      cache.users[idx].refreshToken = token;
      await safeWrite(cache.users);
    }
  },
};
