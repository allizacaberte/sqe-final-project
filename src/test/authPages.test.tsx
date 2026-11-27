import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";

import {
  render,
  screen,
  cleanup,
} from "@testing-library/react";

import type { ReactNode } from "react";

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
  }: {
    src: string;
    alt: string;
  }) => <img src={src} alt={alt} />,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/app/components/layout/Navbar", () => ({
  default: () => (
    <nav data-testid="navbar">Navigation</nav>
  ),
}));

vi.mock("@/app/components/auth/LoginForm", () => ({
  default: ({ next }: { next?: string }) => (
    <form data-testid="login-form">
      <input
        type="hidden"
        name="next"
        value={next ?? ""}
      />
    </form>
  ),
}));

vi.mock("@/app/components/auth/RegisterForm", () => ({
  default: ({ next }: { next?: string }) => (
    <form data-testid="register-form">
      <input
        type="hidden"
        name="next"
        value={next ?? ""}
      />
    </form>
  ),
}));

import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";

const mockGetCurrentUser = vi.mocked(getCurrentUser);

const currentUser = {
  id: "user-101",
  name: "Test User",
  email: "test@example.com",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
});

async function renderLogin(
  params: SearchParams = {},
) {
  const page = await LoginPage({
    searchParams: Promise.resolve(params),
  });

  return render(page);
}

async function renderRegister(
  params: SearchParams = {},
) {
  const page = await RegisterPage({
    searchParams: Promise.resolve(params),
  });

  return render(page);
}

describe("Login Page", () => {
  it("renders the login page heading", async () => {
    await renderLogin();

    expect(
      screen.getByRole("heading", {
        name: "Welcome back",
      }),
    ).toBeInTheDocument();
  });

  it("renders the login page description", async () => {
    await renderLogin();

    expect(
      screen.getByText(
        "Sign in to continue to your movie journal.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the navigation bar", async () => {
    await renderLogin();

    expect(
      screen.getByTestId("navbar"),
    ).toBeInTheDocument();
  });

  it("renders the login form", async () => {
    await renderLogin();

    expect(
      screen.getByTestId("login-form"),
    ).toBeInTheDocument();
  });

  it("renders the authentication background", async () => {
    const { container } = await renderLogin();

    expect(
      container.querySelector("img"),
    ).toHaveAttribute(
      "src",
      "/images/cf_assets_sqe/background/CF Home bg.png",
    );
  });

  it("checks the current user session", async () => {
    await renderLogin();

    expect(
      mockGetCurrentUser,
    ).toHaveBeenCalledTimes(1);
  });

  it("redirects authenticated users to the dashboard", async () => {
    mockGetCurrentUser.mockResolvedValue(currentUser);

    await expect(
      LoginPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(redirect).toHaveBeenCalledWith(
      "/dashboard",
    );
  });

  it("does not redirect unauthenticated users", async () => {
    await renderLogin();

    expect(redirect).not.toHaveBeenCalled();
  });

  it("links to registration by default", async () => {
    await renderLogin();

    expect(
      screen.getByRole("link", {
        name: "Sign up",
      }),
    ).toHaveAttribute("href", "/register");
  });

  it("passes the intended destination to the login form", async () => {
    await renderLogin({
      next: "/reviews/862",
    });

    expect(
      screen
        .getByTestId("login-form")
        .querySelector('input[name="next"]'),
    ).toHaveValue("/reviews/862");
  });

  it("preserves the destination in the registration link", async () => {
    await renderLogin({
      next: "/reviews/862",
    });

    expect(
      screen.getByRole("link", {
        name: "Sign up",
      }),
    ).toHaveAttribute(
      "href",
      "/register?next=%2Freviews%2F862",
    );
  });

  it("encodes special characters in the destination", async () => {
    const next = "/search?q=Batman & Robin";

    await renderLogin({ next });

    expect(
      screen.getByRole("link", {
        name: "Sign up",
      }),
    ).toHaveAttribute(
      "href",
      `/register?next=${encodeURIComponent(next)}`,
    );
  });

  it("ignores array-valued next parameters", async () => {
    await renderLogin({
      next: ["/reviews/862", "/dashboard"],
    });

    expect(
      screen.getByRole("link", {
        name: "Sign up",
      }),
    ).toHaveAttribute("href", "/register");

    expect(
      screen
        .getByTestId("login-form")
        .querySelector('input[name="next"]'),
    ).toHaveValue("");
  });

  it("handles an empty next parameter", async () => {
    await renderLogin({ next: "" });

    expect(
      screen.getByRole("link", {
        name: "Sign up",
      }),
    ).toHaveAttribute("href", "/register");
  });

  it("ignores unrelated search parameters", async () => {
    await renderLogin({
      other: "test",
    });

    expect(
      screen.getByRole("link", {
        name: "Sign up",
      }),
    ).toHaveAttribute("href", "/register");
  });
});

describe("Registration Page", () => {
  it("renders the registration page heading", async () => {
    await renderRegister();

    expect(
      screen.getByRole("heading", {
        name: "Create account",
      }),
    ).toBeInTheDocument();
  });

  it("renders the registration page description", async () => {
    await renderRegister();

    expect(
      screen.getByText(
        "Join a community of film enthusiasts.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the navigation bar", async () => {
    await renderRegister();

    expect(
      screen.getByTestId("navbar"),
    ).toBeInTheDocument();
  });

  it("renders the registration form", async () => {
    await renderRegister();

    expect(
      screen.getByTestId("register-form"),
    ).toBeInTheDocument();
  });

  it("renders the authentication background", async () => {
    const { container } = await renderRegister();

    expect(
      container.querySelector("img"),
    ).toHaveAttribute(
      "src",
      "/images/cf_assets_sqe/background/CF Home bg.png",
    );
  });

  it("checks the current user session", async () => {
    await renderRegister();

    expect(
      mockGetCurrentUser,
    ).toHaveBeenCalledTimes(1);
  });

  it("redirects authenticated users to the dashboard", async () => {
    mockGetCurrentUser.mockResolvedValue(currentUser);

    await expect(
      RegisterPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(redirect).toHaveBeenCalledWith(
      "/dashboard",
    );
  });

  it("does not redirect unauthenticated users", async () => {
    await renderRegister();

    expect(redirect).not.toHaveBeenCalled();
  });

  it("links to login by default", async () => {
    await renderRegister();

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute("href", "/login");
  });

  it("passes the intended destination to the registration form", async () => {
    await renderRegister({
      next: "/reviews/862",
    });

    expect(
      screen
        .getByTestId("register-form")
        .querySelector('input[name="next"]'),
    ).toHaveValue("/reviews/862");
  });

  it("preserves the destination in the login link", async () => {
    await renderRegister({
      next: "/reviews/862",
    });

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute(
      "href",
      "/login?next=%2Freviews%2F862",
    );
  });

  it("encodes special characters in the destination", async () => {
    const next = "/search?q=Batman & Robin";

    await renderRegister({ next });

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute(
      "href",
      `/login?next=${encodeURIComponent(next)}`,
    );
  });

  it("ignores array-valued next parameters", async () => {
    await renderRegister({
      next: ["/reviews/862", "/dashboard"],
    });

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute("href", "/login");

    expect(
      screen
        .getByTestId("register-form")
        .querySelector('input[name="next"]'),
    ).toHaveValue("");
  });

  it("handles an empty next parameter", async () => {
    await renderRegister({ next: "" });

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute("href", "/login");
  });

  it("ignores unrelated search parameters", async () => {
    await renderRegister({
      other: "test",
    });

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute("href", "/login");
  });
});