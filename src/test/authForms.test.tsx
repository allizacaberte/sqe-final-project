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
  waitFor,
  act,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

import { login, register } from "@/lib/auth";

import LoginForm from "@/app/components/auth/LoginForm";
import RegisterForm from "@/app/components/auth/RegisterForm";

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
});

async function fillLoginForm() {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("Email"),
    "test@example.com",
  );

  await user.type(
    screen.getByLabelText("Password"),
    "password123",
  );

  return user;
}

async function fillRegisterForm() {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText("Username"),
    "Test User",
  );

  await user.type(
    screen.getByLabelText("Email"),
    "test@example.com",
  );

  await user.type(
    screen.getByLabelText("Password"),
    "password123",
  );

  return user;
}

describe("LoginForm Component", () => {
  it("renders the email and password fields", () => {
    render(<LoginForm />);

    expect(
      screen.getByLabelText("Email"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password"),
    ).toBeInTheDocument();
  });

  it("uses the correct input types", () => {
    render(<LoginForm />);

    expect(
      screen.getByLabelText("Email"),
    ).toHaveAttribute("type", "email");

    expect(
      screen.getByLabelText("Password"),
    ).toHaveAttribute("type", "password");
  });

  it("requires both email and password", () => {
    render(<LoginForm />);

    expect(
      screen.getByLabelText("Email"),
    ).toBeRequired();

    expect(
      screen.getByLabelText("Password"),
    ).toBeRequired();
  });

  it("renders an enabled login button", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("button", {
        name: "Login",
      }),
    ).toBeEnabled();
  });

  it("does not display an error initially", () => {
    render(<LoginForm />);

    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
  });

  it("includes the redirect destination when provided", () => {
    const { container } = render(
      <LoginForm next="/reviews/101" />,
    );

    const input = container.querySelector(
      'input[name="next"]',
    );

    expect(input).toHaveAttribute("type", "hidden");
    expect(input).toHaveValue("/reviews/101");
  });

  it("omits the redirect field when not provided", () => {
    const { container } = render(<LoginForm />);

    expect(
      container.querySelector('input[name="next"]'),
    ).toBeNull();
  });

  it("submits the entered credentials", async () => {
    vi.mocked(login).mockResolvedValue(
      undefined as never,
    );

    render(<LoginForm />);

    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      }),
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledTimes(1);
    });

    const formData = vi.mocked(login).mock.calls[0][1];

    expect(formData.get("email")).toBe(
      "test@example.com",
    );

    expect(formData.get("password")).toBe(
      "password123",
    );
  });

  it("submits the redirect destination", async () => {
    vi.mocked(login).mockResolvedValue(
      undefined as never,
    );

    render(<LoginForm next="/reviews/101" />);

    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      }),
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledTimes(1);
    });

    const formData = vi.mocked(login).mock.calls[0][1];

    expect(formData.get("next")).toBe(
      "/reviews/101",
    );
  });

  it("prevents submission when required fields are empty", async () => {
    render(<LoginForm />);

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      }),
    );

    expect(login).not.toHaveBeenCalled();
  });

  it("displays authentication errors", async () => {
    vi.mocked(login).mockResolvedValue({
      error: "Wrong email or password.",
    });

    render(<LoginForm />);

    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "Wrong email or password.",
    );
  });

  it("disables the button while login is pending", async () => {
    let finish!: (value: { error: string }) => void;

    vi.mocked(login).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    render(<LoginForm />);

    const user = await fillLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Logging in...",
      }),
    ).toBeDisabled();

    await act(async () => {
      finish({
        error: "Wrong email or password.",
      });
    });

    expect(
      screen.getByRole("button", {
        name: "Login",
      }),
    ).toBeEnabled();
  });
});

describe("RegisterForm Component", () => {
  it("renders all registration fields", () => {
    render(<RegisterForm />);

    expect(
      screen.getByLabelText("Username"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Email"),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password"),
    ).toBeInTheDocument();
  });

  it("uses the correct input types", () => {
    render(<RegisterForm />);

    expect(
      screen.getByLabelText("Username"),
    ).toHaveAttribute("type", "text");

    expect(
      screen.getByLabelText("Email"),
    ).toHaveAttribute("type", "email");

    expect(
      screen.getByLabelText("Password"),
    ).toHaveAttribute("type", "password");
  });

  it("requires all registration fields", () => {
    render(<RegisterForm />);

    expect(
      screen.getByLabelText("Username"),
    ).toBeRequired();

    expect(
      screen.getByLabelText("Email"),
    ).toBeRequired();

    expect(
      screen.getByLabelText("Password"),
    ).toBeRequired();
  });

  it("requires a minimum password length of eight characters", () => {
    render(<RegisterForm />);

    expect(
      screen.getByLabelText("Password"),
    ).toHaveAttribute("minlength", "8");
  });

  it("renders an enabled sign-up button", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    ).toBeEnabled();
  });

  it("does not display an error initially", () => {
    render(<RegisterForm />);

    expect(
      screen.queryByRole("alert"),
    ).not.toBeInTheDocument();
  });

  it("includes the redirect destination when provided", () => {
    const { container } = render(
      <RegisterForm next="/reviews/101" />,
    );

    const input = container.querySelector(
      'input[name="next"]',
    );

    expect(input).toHaveAttribute("type", "hidden");
    expect(input).toHaveValue("/reviews/101");
  });

  it("omits the redirect field when not provided", () => {
    const { container } = render(<RegisterForm />);

    expect(
      container.querySelector('input[name="next"]'),
    ).toBeNull();
  });

  it("submits the entered registration information", async () => {
    vi.mocked(register).mockResolvedValue(
      undefined as never,
    );

    render(<RegisterForm />);

    const user = await fillRegisterForm();

    await user.click(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    );

    await waitFor(() => {
      expect(register).toHaveBeenCalledTimes(1);
    });

    const formData =
      vi.mocked(register).mock.calls[0][1];

    expect(formData.get("name")).toBe("Test User");

    expect(formData.get("email")).toBe(
      "test@example.com",
    );

    expect(formData.get("password")).toBe(
      "password123",
    );
  });

  it("submits the redirect destination", async () => {
    vi.mocked(register).mockResolvedValue(
      undefined as never,
    );

    render(<RegisterForm next="/reviews/101" />);

    const user = await fillRegisterForm();

    await user.click(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    );

    await waitFor(() => {
      expect(register).toHaveBeenCalledTimes(1);
    });

    const formData =
      vi.mocked(register).mock.calls[0][1];

    expect(formData.get("next")).toBe(
      "/reviews/101",
    );
  });

  it("prevents submission when required fields are empty", async () => {
    render(<RegisterForm />);

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    );

    expect(register).not.toHaveBeenCalled();
  });

  it("displays registration errors", async () => {
    vi.mocked(register).mockResolvedValue({
      error: "That email is already registered.",
    });

    render(<RegisterForm />);

    const user = await fillRegisterForm();

    await user.click(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "That email is already registered.",
    );
  });

  it("disables the button while registration is pending", async () => {
    let finish!: (value: { error: string }) => void;

    vi.mocked(register).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    render(<RegisterForm />);

    const user = await fillRegisterForm();

    await user.click(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    );

    expect(
      await screen.findByRole("button", {
        name: "Creating account...",
      }),
    ).toBeDisabled();

    await act(async () => {
      finish({
        error: "That email is already registered.",
      });
    });

    expect(
      screen.getByRole("button", {
        name: "Sign Up",
      }),
    ).toBeEnabled();
  });
});