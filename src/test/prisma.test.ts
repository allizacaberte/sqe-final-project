import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(function () {}),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn(function () {}),
}));

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl =
  "postgresql://test:test@localhost:5432/testdb";

const originalPrisma = globalForPrisma.prisma;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  delete globalForPrisma.prisma;

  vi.stubEnv("DATABASE_URL", databaseUrl);
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  delete globalForPrisma.prisma;

  if (originalPrisma !== undefined) {
    globalForPrisma.prisma = originalPrisma;
  }

  vi.unstubAllEnvs();
});

describe("Prisma Client Initialization", () => {
  it("initializes the PostgreSQL adapter with the database URL", async () => {
    await import("../lib/prisma");

    expect(PrismaPg).toHaveBeenCalledWith({
      connectionString: databaseUrl,
    });
  });

  it("creates a Prisma client using the PostgreSQL adapter", async () => {
    const { prisma } = await import("../lib/prisma");

    expect(PrismaClient).toHaveBeenCalledTimes(1);

    expect(PrismaClient).toHaveBeenCalledWith({
      adapter: expect.any(PrismaPg),
    });

    expect(prisma).toBeDefined();
  });

  it("caches the client in the test environment", async () => {
    const { prisma } = await import("../lib/prisma");

    expect(globalForPrisma.prisma).toBe(prisma);
  });

  it("caches the client in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const { prisma } = await import("../lib/prisma");

    expect(globalForPrisma.prisma).toBe(prisma);
  });

  it("reuses an existing cached Prisma client", async () => {
    const existingClient = {
      cached: true,
    } as unknown as PrismaClient;

    globalForPrisma.prisma = existingClient;

    const { prisma } = await import("../lib/prisma");

    expect(prisma).toBe(existingClient);
    expect(PrismaClient).not.toHaveBeenCalled();
    expect(PrismaPg).not.toHaveBeenCalled();
  });

  it("reuses the client after a module reload in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const first = await import("../lib/prisma");

    vi.resetModules();

    const second = await import("../lib/prisma");

    expect(second.prisma).toBe(first.prisma);
    expect(PrismaClient).toHaveBeenCalledTimes(1);
  });

  it("does not cache a newly created client in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { prisma } = await import("../lib/prisma");

    expect(prisma).toBeDefined();
    expect(PrismaClient).toHaveBeenCalledTimes(1);
    expect(globalForPrisma.prisma).toBeUndefined();
  });
});