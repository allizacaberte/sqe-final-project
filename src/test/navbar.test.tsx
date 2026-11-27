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
  within,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

vi.mock("@/lib/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock(
  "@/app/components/layout/SearchBox",
  () => ({
    default: ({
      initialQuery,
      className,
      onNavigate,
    }: {
      initialQuery?: string;
      className?: string;
      onNavigate?: () => void;
    }) => (
      <div
        data-testid="search-box"
        className={className}
      >
        <input
          aria-label="Mock movie search"
          defaultValue={initialQuery}
        />

        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
          >
            Navigate from search
          </button>
        )}
      </div>
    ),
  }),
);

import { logout } from "@/lib/auth";
import Navbar from "@/app/components/layout/Navbar";

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

async function openMobileMenu() {
  const user = userEvent.setup();

  await user.click(
    screen.getByRole("button", {
      name: "Open menu",
    }),
  );

  return user;
}

function getMobileNavigation() {
  return screen.getAllByRole("navigation")[1];
}

describe("Navbar Branding", () => {
  it("renders the navigation header", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("banner"),
    ).toBeInTheDocument();
  });

  it("renders the Critics Frame logo", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("img", {
        name: "Critic's Frame",
      }),
    ).toBeInTheDocument();
  });

  it("uses the correct logo image", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("img", {
        name: "Critic's Frame",
      }),
    ).toHaveAttribute(
      "src",
      "/images/cf_assets_sqe/logo/CF Logo Ver 2 Beige.png",
    );
  });

  it("links the brand to the homepage", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("link", {
        name: "Critic's Frame home",
      }),
    ).toHaveAttribute("href", "/");
  });
});

describe("Navbar Guest Navigation", () => {
  it("displays the home link", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("link", {
        name: "Home",
      }),
    ).toHaveAttribute("href", "/");
  });

  it("displays the login link", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("link", {
        name: "Login",
      }),
    ).toHaveAttribute("href", "/login");
  });

  it("displays the registration link", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("link", {
        name: "Sign Up",
      }),
    ).toHaveAttribute("href", "/register");
  });

  it("does not display the dashboard for guests", () => {
    render(<Navbar isLoggedIn={false} />);

    expect(
      screen.queryByRole("link", {
        name: "Dashboard",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not display logout for guests", () => {
    render(<Navbar />);

    expect(
      screen.queryByRole("button", {
        name: "Logout",
      }),
    ).not.toBeInTheDocument();
  });
});

describe("Navbar Authenticated Navigation", () => {
  it("displays the dashboard link", () => {
    render(<Navbar isLoggedIn />);

    expect(
      screen.getByRole("link", {
        name: "Dashboard",
      }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("displays the logout button", () => {
    render(<Navbar isLoggedIn />);

    expect(
      screen.getByRole("button", {
        name: "Logout",
      }),
    ).toBeInTheDocument();
  });

  it("hides the login link", () => {
    render(<Navbar isLoggedIn />);

    expect(
      screen.queryByRole("link", {
        name: "Login",
      }),
    ).not.toBeInTheDocument();
  });

  it("hides the registration link", () => {
    render(<Navbar isLoggedIn />);

    expect(
      screen.queryByRole("link", {
        name: "Sign Up",
      }),
    ).not.toBeInTheDocument();
  });

  it("calls the logout action when submitted", async () => {
    render(<Navbar isLoggedIn />);

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: "Logout",
      }),
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});

describe("Navbar Search Integration", () => {
  it("renders the desktop search box", () => {
    render(<Navbar />);

    expect(
      screen.getByTestId("search-box"),
    ).toHaveClass("navbar-search-desktop");
  });

  it("starts with an empty search query by default", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("textbox", {
        name: "Mock movie search",
      }),
    ).toHaveValue("");
  });

  it("prefills the search box with the supplied query", () => {
    render(<Navbar searchQuery="Batman" />);

    expect(
      screen.getByRole("textbox", {
        name: "Mock movie search",
      }),
    ).toHaveValue("Batman");
  });

  it("resets the search box when the query changes", () => {
    const { rerender } = render(
      <Navbar searchQuery="Batman" />,
    );

    rerender(<Navbar searchQuery="Superman" />);

    expect(
      screen.getByRole("textbox", {
        name: "Mock movie search",
      }),
    ).toHaveValue("Superman");
  });
});

describe("Navbar Mobile Menu", () => {
  it("starts with the mobile menu closed", () => {
    render(<Navbar />);

    expect(
      screen.getAllByRole("navigation"),
    ).toHaveLength(1);
  });

  it("indicates that the menu is collapsed", () => {
    render(<Navbar />);

    expect(
      screen.getByRole("button", {
        name: "Open menu",
      }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the mobile menu when clicked", async () => {
    render(<Navbar />);

    await openMobileMenu();

    expect(
      screen.getAllByRole("navigation"),
    ).toHaveLength(2);
  });

  it("indicates that the menu is expanded", async () => {
    render(<Navbar />);

    await openMobileMenu();

    expect(
      screen.getByRole("button", {
        name: "Close menu",
      }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the mobile menu when clicked again", async () => {
    render(<Navbar />);

    const user = await openMobileMenu();

    await user.click(
      screen.getByRole("button", {
        name: "Close menu",
      }),
    );

    expect(
      screen.getAllByRole("navigation"),
    ).toHaveLength(1);

    expect(
      screen.getByRole("button", {
        name: "Open menu",
      }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the mobile search box", async () => {
    render(<Navbar />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByTestId(
        "search-box",
      ),
    ).toHaveClass("navbar-mobile-search");
  });

  it("prefills the mobile search box", async () => {
    render(<Navbar searchQuery="Batman" />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByRole(
        "textbox",
        {
          name: "Mock movie search",
        },
      ),
    ).toHaveValue("Batman");
  });

  it("closes the mobile menu after search navigation", async () => {
    render(<Navbar />);

    const user = await openMobileMenu();

    await user.click(
      within(getMobileNavigation()).getByRole(
        "button",
        {
          name: "Navigate from search",
        },
      ),
    );

    expect(
      screen.getAllByRole("navigation"),
    ).toHaveLength(1);
  });
});

describe("Navbar Mobile Guest Navigation", () => {
  it("displays the mobile home link", async () => {
    render(<Navbar />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByRole(
        "link",
        {
          name: "Home",
        },
      ),
    ).toHaveAttribute("href", "/");
  });

  it("displays the mobile login link", async () => {
    render(<Navbar />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByRole(
        "link",
        {
          name: "Login",
        },
      ),
    ).toHaveAttribute("href", "/login");
  });

  it("displays the mobile registration link", async () => {
    render(<Navbar />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByRole(
        "link",
        {
          name: "Sign Up",
        },
      ),
    ).toHaveAttribute("href", "/register");
  });

  it("hides My Reviews and Logout for mobile guests", async () => {
    render(<Navbar />);

    await openMobileMenu();

    const mobile = within(getMobileNavigation());

    expect(
      mobile.queryByRole("link", {
        name: "My Reviews",
      }),
    ).not.toBeInTheDocument();

    expect(
      mobile.queryByRole("button", {
        name: "Logout",
      }),
    ).not.toBeInTheDocument();
  });

  it.each(["Home", "Login", "Sign Up"])(
    "closes the mobile menu after clicking %s",
    async (linkName) => {
      render(<Navbar />);

      const user = await openMobileMenu();

      await user.click(
        within(getMobileNavigation()).getByRole(
          "link",
          {
            name: linkName,
          },
        ),
      );

      expect(
        screen.getAllByRole("navigation"),
      ).toHaveLength(1);
    },
  );
});

describe("Navbar Mobile Authenticated Navigation", () => {
  it("displays the My Reviews link", async () => {
    render(<Navbar isLoggedIn />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByRole(
        "link",
        {
          name: "My Reviews",
        },
      ),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("displays the mobile logout button", async () => {
    render(<Navbar isLoggedIn />);

    await openMobileMenu();

    expect(
      within(getMobileNavigation()).getByRole(
        "button",
        {
          name: "Logout",
        },
      ),
    ).toBeInTheDocument();
  });

  it("hides guest authentication links", async () => {
    render(<Navbar isLoggedIn />);

    await openMobileMenu();

    const mobile = within(getMobileNavigation());

    expect(
      mobile.queryByRole("link", {
        name: "Login",
      }),
    ).not.toBeInTheDocument();

    expect(
      mobile.queryByRole("link", {
        name: "Sign Up",
      }),
    ).not.toBeInTheDocument();
  });

  it("closes the mobile menu after clicking My Reviews", async () => {
    render(<Navbar isLoggedIn />);

    const user = await openMobileMenu();

    await user.click(
      within(getMobileNavigation()).getByRole(
        "link",
        {
          name: "My Reviews",
        },
      ),
    );

    expect(
      screen.getAllByRole("navigation"),
    ).toHaveLength(1);
  });

  it("calls the logout action from the mobile menu", async () => {
    render(<Navbar isLoggedIn />);

    const user = await openMobileMenu();

    await user.click(
      within(getMobileNavigation()).getByRole(
        "button",
        {
          name: "Logout",
        },
      ),
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
    });
  });
});