import fs from "fs";
import path from "path";
import type { VerificationRecord } from "@/lib/types";

// Dev-mode persistence.
//
// The product spec calls for PostgreSQL + Prisma (see /prisma/schema.prisma
// for the reference schema). Provisioning a live Postgres instance is out of
// scope for the hackathon sandbox this was built in, so this module provides
// a drop-in, file-backed store with the SAME record shape. Swapping this
// module for a Prisma-backed implementation is a mechanical change: every
// call site only depends on the functions exported below.

const DB_DIR = path.join(process.cwd(), "data", "db");
const DB_FILE = path.join(DB_DIR, "verifications.json");

function ensureDb(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]", "utf-8");
}

function readAll(): VerificationRecord[] {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as VerificationRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: VerificationRecord[]): void {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export function createVerification(record: VerificationRecord): VerificationRecord {
  const all = readAll();
  all.unshift(record);
  writeAll(all);
  return record;
}

export function updateVerification(
  id: string,
  patch: Partial<VerificationRecord>
): VerificationRecord | null {
  const all = readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  writeAll(all);
  return all[idx];
}

export function getVerification(id: string): VerificationRecord | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function listVerifications(): VerificationRecord[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function deleteVerification(id: string): boolean {
  const all = readAll();
  const next = all.filter((r) => r.id !== id);
  writeAll(next);
  return next.length !== all.length;
}
