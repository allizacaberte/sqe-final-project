import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("crypto", () => ({
  randomBytes: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

import {
  createSession,
  getCurrentUser,
  deleteSession,
} from "../lib/session";

const WEEK = 7 * 24 * 60 * 60 * 1000;

const currentDate = new Date("2026-11-27T08:00:00Z");

const sessionId = "ab".repeat(32);

const testUser = {
  id: "user-101",
  name: "Test User",
  email: "test@example.com",
};

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();

  vi.useFakeTimers();
  vi.setSystemTime(currentDate);

  vi.stubEnv("NODE_ENV", "test");

  vi.mocked(cookies).mockResolvedValue(
    cookieStore as never,
  );

  vi.mocked(randomBytes).mockReturnValue(
    Buffer.from(sessionId, "hex") as never,
  );

  vi.mocked(prisma.session.create).mockResolvedValue(
    {} as never,
  );

  vi.mocked(prisma.session.findUnique).mockResolvedValue(
    null,
  );

  vi.mocked(prisma.session.deleteMany).mockResolvedValue({
    count: 1,
  });

  cookieStore.get.mockReturnValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("Session Creation", () => {
  it("generates a session token using 32 random bytes", async () => {
    await createSession(testUser.id);

    expect(randomBytes).toHaveBeenCalledWith(32);

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        id: sessionId,
        userId: testUser.id,
        expiresAt: new Date(
          currentDate.getTime() + WEEK,
        ),
      },
    });
  });

  it("creates a session that expires after seven days", async () => {
    await createSession(testUser.id);

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expiresAt: new Date(
          currentDate.getTime() + WEEK,
        ),
      }),
    });
  });

  it("sets the session cookie with security options", async () => {
    await createSession(testUser.id);

    expect(cookieStore.set).toHaveBeenCalledWith(
      "session",
      sessionId,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        expires: new Date(
          currentDate.getTime() + WEEK,
        ),
        path: "/",
      },
    );
  });

  it("enables secure cookies in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await createSession(testUser.id);

    expect(cookieStore.set).toHaveBeenCalledWith(
      "session",
      sessionId,
      expect.objectContaining({
        secure: true,
        httpOnly: true,
      }),
    );
  });

  it("disables the secure flag in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await createSession(testUser.id);

    expect(cookieStore.set).toHaveBeenCalledWith(
      "session",
      sessionId,
      expect.objectContaining({
        secure: false,
      }),
    );
  });

  it("does not set a cookie when session storage fails", async () => {
    vi.mocked(
      prisma.session.create,
    ).mockRejectedValueOnce(
      new Error("Database error"),
    );

    await expect(
      createSession(testUser.id),
    ).rejects.toThrow("Database error");

    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});

describe("Current User Retrieval", () => {
  it("returns null when no session cookie exists", async () => {
    expect(await getCurrentUser()).toBeNull();

    expect(cookieStore.get).toHaveBeenCalledWith(
      "session",
    );

    expect(
      prisma.session.findUnique,
    ).not.toHaveBeenCalled();
  });

  it("returns null when the session cookie is empty", async () => {
    cookieStore.get.mockReturnValue({
      value: "",
    });

    expect(await getCurrentUser()).toBeNull();

    expect(
      prisma.session.findUnique,
    ).not.toHaveBeenCalled();
  });

  it("returns null when the session does not exist", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    expect(await getCurrentUser()).toBeNull();

    expect(
      prisma.session.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        id: sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  it("returns the user associated with a valid session", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    vi.mocked(
      prisma.session.findUnique,
    ).mockResolvedValueOnce({
      id: sessionId,
      userId: testUser.id,
      expiresAt: new Date(
        currentDate.getTime() + WEEK,
      ),
      user: testUser,
    } as never);

    expect(await getCurrentUser()).toEqual(testUser);
  });

  it("rejects expired sessions", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    vi.mocked(
      prisma.session.findUnique,
    ).mockResolvedValueOnce({
      id: sessionId,
      userId: testUser.id,
      expiresAt: new Date(
        currentDate.getTime() - 1,
      ),
      user: testUser,
    } as never);

    expect(await getCurrentUser()).toBeNull();
  });

  it("accepts a session expiring at the current time", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    vi.mocked(
      prisma.session.findUnique,
    ).mockResolvedValueOnce({
      id: sessionId,
      userId: testUser.id,
      expiresAt: currentDate,
      user: testUser,
    } as never);

    expect(await getCurrentUser()).toEqual(testUser);
  });

  it("propagates database errors during session retrieval", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    vi.mocked(
      prisma.session.findUnique,
    ).mockRejectedValueOnce(
      new Error("Session lookup failed"),
    );

    await expect(
      getCurrentUser(),
    ).rejects.toThrow("Session lookup failed");
  });
});

describe("Session Deletion", () => {
  it("deletes the current session from the database", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    await deleteSession();

    expect(
      prisma.session.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        id: sessionId,
      },
    });

    expect(cookieStore.delete).toHaveBeenCalledWith(
      "session",
    );
  });

  it("removes the cookie even when no session exists", async () => {
    await deleteSession();

    expect(
      prisma.session.deleteMany,
    ).not.toHaveBeenCalled();

    expect(cookieStore.delete).toHaveBeenCalledWith(
      "session",
    );
  });

  it("handles an empty session cookie", async () => {
    cookieStore.get.mockReturnValue({
      value: "",
    });

    await deleteSession();

    expect(
      prisma.session.deleteMany,
    ).not.toHaveBeenCalled();

    expect(cookieStore.delete).toHaveBeenCalledWith(
      "session",
    );
  });

  it("handles sessions already removed from the database", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    vi.mocked(
      prisma.session.deleteMany,
    ).mockResolvedValueOnce({
      count: 0,
    });

    await deleteSession();

    expect(cookieStore.delete).toHaveBeenCalledWith(
      "session",
    );
  });

  it("propagates database errors during session deletion", async () => {
    cookieStore.get.mockReturnValue({
      value: sessionId,
    });

    vi.mocked(
      prisma.session.deleteMany,
    ).mockRejectedValueOnce(
      new Error("Session deletion failed"),
    );

    await expect(
      deleteSession(),
    ).rejects.toThrow("Session deletion failed");

    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});