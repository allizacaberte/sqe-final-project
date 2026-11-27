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
  fireEvent,
  act,
  within,
} from "@testing-library/react";

import type { ReactNode } from "react";

const { mockPush, mockFetch } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
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
    onClick,
    tabIndex,
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
    tabIndex?: number;
  }) => (
    <a
      href={href}
      tabIndex={tabIndex}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/form", () => ({
  default: ({
    action,
    children,
    onSubmit,
    className,
    role,
  }: {
    action: string;
    children: ReactNode;
    onSubmit?: () => void;
    className?: string;
    role?: string;
  }) => (
    <form
      action={action}
      className={className}
      role={role}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      {children}
    </form>
  ),
}));

import SearchBox from "@/app/components/layout/SearchBox";

const movies = [
  {
    id: 101,
    title: "Batman",
    year: 2022,
    poster: "/batman.jpg",
  },
  {
    id: 102,
    title: "Batman Begins",
    year: 2005,
    poster: "/batman-begins.jpg",
  },
  {
    id: 103,
    title: "Batman Returns",
    year: null,
    poster: "/batman-returns.jpg",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal("fetch", mockFetch);

  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => movies,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function getInput() {
  return screen.getByRole("combobox", {
    name: "Search movies",
  });
}

async function advanceTime(ms = 250) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

async function typeQuery(query = "Batman") {
  fireEvent.change(getInput(), {
    target: { value: query },
  });

  await advanceTime();
}

async function showSuggestions() {
  await typeQuery();

  expect(
    screen.getByRole("listbox"),
  ).toBeInTheDocument();
}

describe("SearchBox Rendering", () => {
  it("renders the search input", () => {
    render(<SearchBox />);

    expect(getInput()).toBeInTheDocument();
  });

  it("renders the search form", () => {
    render(<SearchBox />);

    expect(
      screen.getByRole("search"),
    ).toHaveAttribute("action", "/search");
  });

  it("renders an empty input by default", () => {
    render(<SearchBox />);

    expect(getInput()).toHaveValue("");
  });

  it("prefills the initial search query", () => {
    render(<SearchBox initialQuery="Batman" />);

    expect(getInput()).toHaveValue("Batman");
  });

  it("applies the supplied custom class", () => {
    const { container } = render(
      <SearchBox className="navbar-mobile-search" />,
    );

    expect(
      container.querySelector(".search-box"),
    ).toHaveClass("navbar-mobile-search");
  });

  it("uses the correct input attributes", () => {
    render(<SearchBox />);

    expect(getInput()).toHaveAttribute(
      "type",
      "search",
    );

    expect(getInput()).toHaveAttribute("name", "q");

    expect(getInput()).toHaveAttribute(
      "autocomplete",
      "off",
    );

    expect(getInput()).toBeRequired();
  });

  it("renders the search submit button", () => {
    render(<SearchBox />);

    expect(
      screen.getByRole("button", {
        name: "Search",
      }),
    ).toHaveAttribute("type", "submit");
  });

  it("starts with the suggestions collapsed", () => {
    render(<SearchBox />);

    expect(getInput()).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });
});

describe("SearchBox Debounce and API Requests", () => {
  it("does not fetch suggestions for an empty query", async () => {
    render(<SearchBox />);

    await advanceTime(500);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not fetch suggestions for one character", async () => {
    render(<SearchBox />);

    await typeQuery("B");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("ignores whitespace-only queries", async () => {
    render(<SearchBox />);

    await typeQuery("   ");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches suggestions for two characters", async () => {
    render(<SearchBox />);

    await typeQuery("Ba");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/suggest?q=Ba",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("waits 250 milliseconds before fetching", async () => {
    render(<SearchBox />);

    fireEvent.change(getInput(), {
      target: { value: "Batman" },
    });

    await advanceTime(249);

    expect(mockFetch).not.toHaveBeenCalled();

    await advanceTime(1);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("debounces rapid changes to the query", async () => {
    render(<SearchBox />);

    fireEvent.change(getInput(), {
      target: { value: "Ba" },
    });

    await advanceTime(100);

    fireEvent.change(getInput(), {
      target: { value: "Batman" },
    });

    await advanceTime(250);

    expect(mockFetch).toHaveBeenCalledTimes(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/suggest?q=Batman",
      expect.any(Object),
    );
  });

  it("trims surrounding whitespace before fetching", async () => {
    render(<SearchBox />);

    await typeQuery("  Batman  ");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/suggest?q=Batman",
      expect.any(Object),
    );
  });

  it("encodes special characters in the query", async () => {
    render(<SearchBox />);

    await typeQuery("Batman & Robin");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/suggest?q=Batman%20%26%20Robin",
      expect.any(Object),
    );
  });

  it("fetches suggestions for an initial query", async () => {
    render(<SearchBox initialQuery="Batman" />);

    await advanceTime();

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/search/suggest?q=Batman",
      expect.any(Object),
    );
  });

  it("aborts the previous request when the query changes", async () => {
    render(<SearchBox />);

    await typeQuery("Batman");

    const signal = mockFetch.mock.calls[0][1]
      .signal as AbortSignal;

    expect(signal.aborted).toBe(false);

    fireEvent.change(getInput(), {
      target: { value: "Superman" },
    });

    expect(signal.aborted).toBe(true);
  });

  it("aborts the request when the component unmounts", async () => {
    const { unmount } = render(<SearchBox />);

    await typeQuery();

    const signal = mockFetch.mock.calls[0][1]
      .signal as AbortSignal;

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it("cancels a scheduled request when unmounted", async () => {
    const { unmount } = render(<SearchBox />);

    fireEvent.change(getInput(), {
      target: { value: "Batman" },
    });

    unmount();

    await advanceTime(500);

    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("SearchBox Suggestions", () => {
  it("displays suggestions after a successful request", async () => {
    render(<SearchBox />);

    await showSuggestions();

    expect(
      screen.getAllByRole("option"),
    ).toHaveLength(3);
  });

  it("displays the suggested movie titles", async () => {
    render(<SearchBox />);

    await showSuggestions();

    expect(
      screen.getByText("Batman"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Batman Begins"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Batman Returns"),
    ).toBeInTheDocument();
  });

  it("displays available release years", async () => {
    render(<SearchBox />);

    await showSuggestions();

    expect(
      screen.getByText("2022"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("2005"),
    ).toBeInTheDocument();
  });

  it("handles a suggestion without a release year", async () => {
    render(<SearchBox />);

    await showSuggestions();

    const option = screen.getAllByRole("option")[2];

    expect(option).toHaveTextContent(
      "Batman Returns",
    );

    expect(
      option.querySelector(".search-suggestion-year"),
    ).toBeNull();
  });

  it("renders the correct poster image", async () => {
    render(<SearchBox />);

    await showSuggestions();

    const option = screen.getAllByRole("option")[0];

    expect(
      option.querySelector("img"),
    ).toHaveAttribute("src", "/batman.jpg");
  });

  it("links suggestions to their movie details pages", async () => {
    render(<SearchBox />);

    await showSuggestions();

    const option = screen.getAllByRole("option")[0];

    expect(
      within(option).getByRole("link"),
    ).toHaveAttribute("href", "/movies/101");
  });

  it("provides a link to all search results", async () => {
    render(<SearchBox />);

    await showSuggestions();

    expect(
      screen.getByRole("link", {
        name: /See all results for/,
      }),
    ).toHaveAttribute(
      "href",
      "/search?q=Batman",
    );
  });

  it("updates the expanded accessibility state", async () => {
    render(<SearchBox />);

    await showSuggestions();

    expect(getInput()).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    expect(getInput()).toHaveAttribute(
      "aria-controls",
      screen.getByRole("listbox").id,
    );
  });

  it("hides suggestions when the query becomes too short", async () => {
    render(<SearchBox />);

    await showSuggestions();

    await typeQuery("B");

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("does not display a dropdown for empty API results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<SearchBox />);

    await typeQuery();

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("handles unsuccessful HTTP responses", async () => {
    const json = vi.fn();

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json,
    });

    render(<SearchBox />);

    await typeQuery();

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();

    expect(json).not.toHaveBeenCalled();
  });

  it("handles network errors without crashing", async () => {
    mockFetch.mockRejectedValue(
      new Error("Network error"),
    );

    render(<SearchBox />);

    await typeQuery();

    expect(getInput()).toHaveValue("Batman");

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });
});

describe("SearchBox Keyboard Navigation", () => {
  it("does not highlight a suggestion initially", async () => {
    render(<SearchBox />);

    await showSuggestions();

    expect(getInput()).not.toHaveAttribute(
      "aria-activedescendant",
    );

    for (const option of screen.getAllByRole("option")) {
      expect(option).toHaveAttribute(
        "aria-selected",
        "false",
      );
    }
  });

  it("highlights the first suggestion with ArrowDown", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    const option = screen.getAllByRole("option")[0];

    expect(option).toHaveAttribute(
      "aria-selected",
      "true",
    );

    expect(option).toHaveClass("is-active");

    expect(getInput()).toHaveAttribute(
      "aria-activedescendant",
      option.id,
    );
  });

  it("moves to the next suggestion with ArrowDown", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    expect(
      screen.getAllByRole("option")[1],
    ).toHaveAttribute("aria-selected", "true");
  });

  it("wraps from the last suggestion to the first", async () => {
    render(<SearchBox />);

    await showSuggestions();

    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(getInput(), {
        key: "ArrowDown",
      });
    }

    expect(
      screen.getAllByRole("option")[0],
    ).toHaveAttribute("aria-selected", "true");
  });

  it("highlights the last suggestion with ArrowUp initially", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowUp",
    });

    expect(
      screen.getAllByRole("option")[2],
    ).toHaveAttribute("aria-selected", "true");
  });

  it("moves to the previous suggestion with ArrowUp", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowUp",
    });

    fireEvent.keyDown(getInput(), {
      key: "ArrowUp",
    });

    expect(
      screen.getAllByRole("option")[1],
    ).toHaveAttribute("aria-selected", "true");
  });

  it("wraps from the first suggestion to the last", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    fireEvent.keyDown(getInput(), {
      key: "ArrowUp",
    });

    expect(
      screen.getAllByRole("option")[2],
    ).toHaveAttribute("aria-selected", "true");
  });

  it("opens the highlighted movie when Enter is pressed", async () => {
    const onNavigate = vi.fn();

    render(<SearchBox onNavigate={onNavigate} />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    fireEvent.keyDown(getInput(), {
      key: "Enter",
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/movies/101",
    );

    expect(onNavigate).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("supports keyboard selection without an onNavigate callback", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowUp",
    });

    fireEvent.keyDown(getInput(), {
      key: "Enter",
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/movies/103",
    );
  });

  it("does not intercept Enter without a highlighted suggestion", async () => {
    render(<SearchBox />);

    await showSuggestions();

    const notPrevented = fireEvent.keyDown(
      getInput(),
      {
        key: "Enter",
      },
    );

    expect(notPrevented).toBe(true);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("closes suggestions when Escape is pressed", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    fireEvent.keyDown(getInput(), {
      key: "Escape",
    });

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();

    expect(getInput()).toHaveValue("Batman");

    expect(getInput()).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });

  it("reopens closed suggestions with ArrowDown", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "Escape",
    });

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    expect(
      screen.getByRole("listbox"),
    ).toBeInTheDocument();
  });

  it("does not open suggestions with ArrowDown when none exist", () => {
    render(<SearchBox />);

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("ignores unrelated keys while suggestions are closed", () => {
    render(<SearchBox />);

    fireEvent.keyDown(getInput(), {
      key: "Escape",
    });

    expect(mockPush).not.toHaveBeenCalled();

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("resets the highlighted suggestion after new results arrive", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "ArrowDown",
    });

    await typeQuery("Batman Begins");

    expect(getInput()).not.toHaveAttribute(
      "aria-activedescendant",
    );
  });
});

describe("SearchBox Mouse and Focus Interactions", () => {
  it("highlights a suggestion when hovered", async () => {
    render(<SearchBox />);

    await showSuggestions();

    const option = screen.getAllByRole("option")[1];

    fireEvent.mouseEnter(option);

    expect(option).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("closes suggestions after clicking a movie link", async () => {
    const onNavigate = vi.fn();

    render(<SearchBox onNavigate={onNavigate} />);

    await showSuggestions();

    fireEvent.click(
      within(
        screen.getAllByRole("option")[0],
      ).getByRole("link"),
    );

    expect(onNavigate).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("supports clicking a movie without a navigation callback", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.click(
      within(
        screen.getAllByRole("option")[0],
      ).getByRole("link"),
    );

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("closes suggestions after clicking all results", async () => {
    const onNavigate = vi.fn();

    render(<SearchBox onNavigate={onNavigate} />);

    await showSuggestions();

    fireEvent.click(
      screen.getByRole("link", {
        name: /See all results for/,
      }),
    );

    expect(onNavigate).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("supports all results without a navigation callback", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.click(
      screen.getByRole("link", {
        name: /See all results for/,
      }),
    );

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("closes suggestions when focus leaves the search box", async () => {
    render(
      <>
        <SearchBox />
        <button>Outside</button>
      </>,
    );

    await showSuggestions();

    fireEvent.blur(getInput(), {
      relatedTarget: screen.getByRole("button", {
        name: "Outside",
      }),
    });

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("keeps suggestions open when focus moves within the search box", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.blur(getInput(), {
      relatedTarget: screen.getByRole("button", {
        name: "Search",
      }),
    });

    expect(
      screen.getByRole("listbox"),
    ).toBeInTheDocument();
  });

  it("closes suggestions when focus moves to no element", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.blur(getInput(), {
      relatedTarget: null,
    });

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("reopens suggestions when the input receives focus", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.keyDown(getInput(), {
      key: "Escape",
    });

    fireEvent.focus(getInput());

    expect(
      screen.getByRole("listbox"),
    ).toBeInTheDocument();
  });

  it("closes suggestions when the search form is submitted", async () => {
    const onNavigate = vi.fn();

    render(<SearchBox onNavigate={onNavigate} />);

    await showSuggestions();

    fireEvent.submit(screen.getByRole("search"));

    expect(onNavigate).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("supports form submission without a navigation callback", async () => {
    render(<SearchBox />);

    await showSuggestions();

    fireEvent.submit(screen.getByRole("search"));

    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });
});