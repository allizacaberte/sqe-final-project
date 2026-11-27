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
  act,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/reviews", () => ({
  saveReview: vi.fn(),
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
    ...props
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { saveReview } from "@/lib/reviews";

import ReviewFeed from "@/app/components/reviews/ReviewFeed";
import ReviewForm from "@/app/components/reviews/ReviewForm";

const testReview = {
  id: "review-101",
  rating: 9,
  body: "An amazing movie!",
  createdAt: new Date(2026, 10, 27, 12),
  user: {
    name: "Test Reviewer",
  },
  movie: {
    tmdbId: 101,
    title: "Test Movie",
    posterPath: "/poster.jpg",
    releaseYear: 2026,
  },
};

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

async function fillReviewForm() {
  const user = userEvent.setup();

  await user.type(
    screen.getByRole("textbox", {
      name: "Review for Test Movie",
    }),
    "An amazing movie!",
  );

  await user.selectOptions(
    screen.getByRole("combobox"),
    "9",
  );

  return user;
}

describe("ReviewFeed Component", () => {
  it("displays a fallback when there are no reviews", () => {
    render(<ReviewFeed reviews={[]} />);

    expect(
      screen.getByText(
        "No reviews yet. Find a movie and be the first to share your thoughts!",
      ),
    ).toBeInTheDocument();
  });

  it("renders a review article", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByRole("article"),
    ).toBeInTheDocument();
  });

  it("renders multiple reviews", () => {
    render(
      <ReviewFeed
        reviews={[
          testReview,
          {
            ...testReview,
            id: "review-102",
            body: "Another great review.",
          },
        ]}
      />,
    );

    expect(
      screen.getAllByRole("article"),
    ).toHaveLength(2);

    expect(
      screen.getByText("Another great review."),
    ).toBeInTheDocument();
  });

  it("displays the review body", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByText("An amazing movie!"),
    ).toBeInTheDocument();
  });

  it("displays the review rating", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByText("9/10"),
    ).toBeInTheDocument();
  });

  it("displays the reviewer name", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByText(/Test Reviewer/),
    ).toBeInTheDocument();
  });

  it("displays the formatted review date", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByText(/Nov 27, 2026/),
    ).toBeInTheDocument();
  });

  it("displays the movie title and release year", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByRole("link", {
        name: /^Test Movie\s*\(2026\)$/,
      }),
    ).toBeInTheDocument();
  });

  it("handles a movie without a release year", () => {
    render(
      <ReviewFeed
        reviews={[
          {
            ...testReview,
            movie: {
              ...testReview.movie,
              releaseYear: null,
            },
          },
        ]}
      />,
    );

    expect(
      screen.getAllByRole("link", {
        name: "Test Movie",
      }),
    ).toHaveLength(2);

    expect(
      screen.queryByText("(2026)"),
    ).not.toBeInTheDocument();
  });

  it("links the movie poster to its details page", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByRole("link", {
        name: "Test Movie",
      }),
    ).toHaveAttribute("href", "/movies/101");
  });

  it("links the movie title to its details page", () => {
    render(<ReviewFeed reviews={[testReview]} />);

    expect(
      screen.getByRole("link", {
        name: /^Test Movie\s*\(2026\)$/,
      }),
    ).toHaveAttribute("href", "/movies/101");
  });

  it("uses the small TMDB poster image", () => {
    const { container } = render(
      <ReviewFeed reviews={[testReview]} />,
    );

    expect(
      container.querySelector("img"),
    ).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/w185/poster.jpg",
    );
  });

  it("uses a fallback image when the poster is missing", () => {
    const { container } = render(
      <ReviewFeed
        reviews={[
          {
            ...testReview,
            movie: {
              ...testReview.movie,
              posterPath: null,
            },
          },
        ]}
      />,
    );

    expect(
      container.querySelector("img"),
    ).toHaveAttribute(
      "src",
      "/images/cf_assets_sqe/background/CF Home bg.png",
    );
  });
});

describe("ReviewForm Component", () => {
  it("renders the review textarea", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "Review for Test Movie",
      }),
    ).toBeInTheDocument();
  });

  it("renders an empty review for a new submission", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toHaveValue("");
  });

  it("includes the movie ID in a hidden field", () => {
    const { container } = render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const input = container.querySelector(
      'input[name="tmdbId"]',
    );

    expect(input).toHaveAttribute("type", "hidden");
    expect(input).toHaveValue("101");
  });

  it("requires the review body", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toBeRequired();
  });

  it("sets the minimum review length to three characters", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toHaveAttribute("minlength", "3");
  });

  it("sets the maximum review length to 2000 characters", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toHaveAttribute("maxlength", "2000");
  });

  it("renders the rating selector", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("combobox"),
    ).toBeRequired();
  });

  it("provides ratings from one to ten", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const select = screen.getByRole("combobox");

    expect(
      within(select).getAllByRole("option"),
    ).toHaveLength(11);

    for (let rating = 1; rating <= 10; rating++) {
      expect(
        within(select).getByRole("option", {
          name: `${rating}/10`,
        }),
      ).toHaveValue(String(rating));
    }
  });

  it("starts with no rating selected", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("combobox"),
    ).toHaveValue("");
  });

  it("disables the empty rating option", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("option", {
        name: "–",
      }),
    ).toBeDisabled();
  });

  it("prefills the existing review body when editing", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
        initialBody="My previous review."
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toHaveValue("My previous review.");
  });

  it("prefills the existing rating when editing", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
        initialRating={7}
      />,
    );

    expect(
      screen.getByRole("combobox"),
    ).toHaveValue("7");
  });

  it("renders an enabled save button", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Save",
      }),
    ).toBeEnabled();
  });

  it("does not display an error initially", () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
  });

  it("allows the user to select a rating", async () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox"),
      "10",
    );

    expect(
      screen.getByRole("combobox"),
    ).toHaveValue("10");
  });

  it("submits a new review with the correct information", async () => {
    vi.mocked(saveReview).mockResolvedValue(
      undefined as never,
    );

    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const user = await fillReviewForm();

    await user.click(
      screen.getByRole("button", {
        name: "Save",
      }),
    );

    await waitFor(() => {
      expect(saveReview).toHaveBeenCalledTimes(1);
    });

    const formData =
      vi.mocked(saveReview).mock.calls[0][1];

    expect(formData.get("tmdbId")).toBe("101");
    expect(formData.get("rating")).toBe("9");

    expect(formData.get("body")).toBe(
      "An amazing movie!",
    );
  });

  it("submits updated information when editing a review", async () => {
    vi.mocked(saveReview).mockResolvedValue(
      undefined as never,
    );

    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
        initialBody="My previous review."
        initialRating={7}
      />,
    );

    const user = userEvent.setup();
    const textarea = screen.getByRole("textbox");

    await user.clear(textarea);
    await user.type(textarea, "Updated review.");

    await user.selectOptions(
      screen.getByRole("combobox"),
      "10",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save",
      }),
    );

    await waitFor(() => {
      expect(saveReview).toHaveBeenCalledTimes(1);
    });

    const formData =
      vi.mocked(saveReview).mock.calls[0][1];

    expect(formData.get("tmdbId")).toBe("101");
    expect(formData.get("rating")).toBe("10");
    expect(formData.get("body")).toBe("Updated review.");
  });

  it("prevents submission when required fields are empty", async () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: "Save",
      }),
    );

    expect(saveReview).not.toHaveBeenCalled();
  });

  it("prevents submission when no rating is selected", async () => {
    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox"),
      "A good movie.",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Save",
      }),
    );

    expect(saveReview).not.toHaveBeenCalled();
  });

  it("displays an error returned by the server action", async () => {
    vi.mocked(saveReview).mockResolvedValue({
      error: "That movie couldn't be found.",
    });

    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const user = await fillReviewForm();

    await user.click(
      screen.getByRole("button", {
        name: "Save",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "That movie couldn't be found.",
    );
  });

  it("disables the save button while submission is pending", async () => {
    let finish!: (value: { error: string }) => void;

    vi.mocked(saveReview).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    render(
      <ReviewForm
        tmdbId={101}
        movieTitle="Test Movie"
      />,
    );

    const user = await fillReviewForm();

    await user.click(
      screen.getByRole("button", {
        name: "Save",
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Saving...",
      }),
    ).toBeDisabled();

    await act(async () => {
      finish({
        error: "That movie couldn't be found.",
      });
    });

    expect(
      screen.getByRole("button", {
        name: "Save",
      }),
    ).toBeEnabled();
  });
});