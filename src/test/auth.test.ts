import {
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
}));

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  deleteSession,
} from "@/lib/session";

import { register, login, logout } from "../lib/auth";

const testUser = {
  id: "user-101",
  name: "Test User",
  email: "test@example.com",
  passwordHash: "hashed-password",
};

function makeForm(values: Record<string, string>) {
  const form = new FormData();

  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }

  return form;
}

function registrationForm(
  overrides: Record<string, string> = {},
) {
  return makeForm({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    ...overrides,
  });
}

function loginForm(
  overrides: Record<string, string> = {},
) {
  return makeForm({
    email: "test@example.com",
    password: "password123",
    ...overrides,
  });
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

  vi.mocked(prisma.user.create).mockResolvedValue(
    testUser as never,
  );

  vi.mocked(bcrypt.hash).mockResolvedValue(
    "hashed-password" as never,
  );

  vi.mocked(bcrypt.compare).mockResolvedValue(
    true as never,
  );

  vi.mocked(redirect).mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

describe("User Registration", () => {
  it("registers a valid user and creates a session", async () => {
    await expect(
      register(null, registrationForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
      },
    });

    expect(createSession).toHaveBeenCalledWith(testUser.id);
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects a missing name", async () => {
    const result = await register(
      null,
      registrationForm({ name: "" }),
    );

    expect(result).toEqual({
      error: "Fill in all fields; password must be 8+ characters.",
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only name", async () => {
    const result = await register(
      null,
      registrationForm({ name: "   " }),
    );

    expect(result).toHaveProperty("error");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a missing email", async () => {
    const result = await register(
      null,
      registrationForm({ email: "" }),
    );

    expect(result).toHaveProperty("error");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than eight characters", async () => {
    const result = await register(
      null,
      registrationForm({ password: "1234567" }),
    );

    expect(result).toHaveProperty("error");
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("accepts the minimum password length of eight characters", async () => {
    await expect(
      register(
        null,
        registrationForm({ password: "12345678" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("rejects an empty registration form", async () => {
    const result = await register(null, new FormData());

    expect(result).toHaveProperty("error");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects a registration with an omitted email field", async () => {
    const form = makeForm({
      name: "Test User",
      password: "password123",
    });

    expect(await register(null, form)).toHaveProperty(
      "error",
    );
  });

  it("rejects a registration with an omitted password field", async () => {
    const form = makeForm({
      name: "Test User",
      email: "test@example.com",
    });

    expect(await register(null, form)).toHaveProperty(
      "error",
    );
  });

  it("rejects an already registered email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      testUser as never,
    );

    const result = await register(
      null,
      registrationForm(),
    );

    expect(result).toEqual({
      error: "That email is already registered.",
    });

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("trims the name and normalizes the email", async () => {
    await expect(
      register(
        null,
        registrationForm({
          name: "  Test User  ",
          email: "  TEST@EXAMPLE.COM  ",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: "test@example.com",
      },
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed-password",
      },
    });
  });

  it("hashes the password before storing it", async () => {
    await expect(
      register(null, registrationForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(bcrypt.hash).toHaveBeenCalledWith(
      "password123",
      10,
    );

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        passwordHash: "hashed-password",
      }),
    });
  });

  it("does not create a session if registration fails", async () => {
    vi.mocked(prisma.user.create).mockRejectedValueOnce(
      new Error("Database error"),
    );

    await expect(
      register(null, registrationForm()),
    ).rejects.toThrow("Database error");

    expect(createSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("User Login", () => {
  it("logs in a user with valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      testUser as never,
    );

    await expect(
      login(null, loginForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );

    expect(createSession).toHaveBeenCalledWith(testUser.id);
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects an unregistered email", async () => {
    const result = await login(null, loginForm());

    expect(result).toEqual({
      error: "Wrong email or password.",
    });

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      testUser as never,
    );

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(
      false as never,
    );

    const result = await login(
      null,
      loginForm({ password: "wrong-password" }),
    );

    expect(result).toEqual({
      error: "Wrong email or password.",
    });

    expect(createSession).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("normalizes the email before looking up the user", async () => {
    await login(
      null,
      loginForm({ email: "  TEST@EXAMPLE.COM  " }),
    );

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: "test@example.com",
      },
    });
  });

  it("handles an empty login form", async () => {
    expect(await login(null, new FormData())).toEqual({
      error: "Wrong email or password.",
    });

    expect(createSession).not.toHaveBeenCalled();
  });

  it("does not redirect when session creation fails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      testUser as never,
    );

    vi.mocked(createSession).mockRejectedValueOnce(
      new Error("Session error"),
    );

    await expect(
      login(null, loginForm()),
    ).rejects.toThrow("Session error");

    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("Safe Authentication Redirects", () => {
  it("allows an internal redirect after registration", async () => {
    await expect(
      register(
        null,
        registrationForm({ next: "/movies/101" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/movies/101");
  });

  it("allows an internal redirect after login", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      testUser as never,
    );

    await expect(
      login(
        null,
        loginForm({ next: "/reviews/add" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/reviews/add");
  });

  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "dashboard",
    "",
  ])(
    "rejects unsafe or invalid redirect '%s'",
    async (next) => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
        testUser as never,
      );

      await expect(
        login(null, loginForm({ next })),
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(redirect).toHaveBeenCalledWith("/dashboard");
    },
  );

  it("uses the dashboard when the redirect is not a string", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      testUser as never,
    );

    const form = loginForm();

    form.set(
      "next",
      new File(["test"], "redirect.txt"),
    );

    await expect(
      login(null, form),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("User Logout", () => {
  it("deletes the session and redirects to the home page", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");

    expect(deleteSession).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("does not redirect if session deletion fails", async () => {
    vi.mocked(deleteSession).mockRejectedValueOnce(
      new Error("Session deletion failed"),
    );

    await expect(logout()).rejects.toThrow(
      "Session deletion failed",
    );

    expect(redirect).not.toHaveBeenCalled();
  });
});