import { promises as fs } from "fs";
import path from "path";
import type { Role } from "@prisma/client";

/**
 * File-backed user store used as a graceful fallback when Postgres / Prisma
 * is unavailable in local development. Persists to `.data/users.json` so that
 * accounts survive dev-server restarts.
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

const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<StoredUser[]> {
  await ensureFile();
  try {
    const raw = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

async function writeAll(users: StoredUser[]): Promise<void> {
  await ensureFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export const userStore = {
  async findByEmail(email: string): Promise<StoredUser | null> {
    const users = await readAll();
    return users.find((u) => u.email === email.toLowerCase().trim()) || null;
  },

  async count(): Promise<number> {
    const users = await readAll();
    return users.length;
  },

  async create(input: {
    email: string;
    passwordHash: string;
    name: string;
    title?: string | null;
    role: Role;
  }): Promise<StoredUser> {
    const users = await readAll();
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
    users.push(user);
    await writeAll(users);
    return user;
  },

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    const users = await readAll();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx].refreshToken = token;
      await writeAll(users);
    }
  },
};
