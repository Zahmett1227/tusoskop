import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SignInOptions from "./SignInOptions";

const loginWithEmail = vi.fn();
const registerWithEmail = vi.fn();

vi.mock("../../firebase", () => ({
  loginWithApple: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithEmail: (...args) => loginWithEmail(...args),
  registerWithEmail: (...args) => registerWithEmail(...args),
}));

describe("SignInOptions", () => {
  let container;
  let root;

  beforeEach(() => {
    loginWithEmail.mockReset();
    registerWithEmail.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderSignIn(props = {}) {
    act(() => {
      root.render(<SignInOptions accentTheme={{}} {...props} />);
    });
  }

  it("demo girişi sunmaz", () => {
    renderSignIn();
    expect(container.textContent).not.toContain("Demo olarak incele");
    expect(container.textContent).not.toContain("Demo");
  });

  it("Apple ve Google giriş butonlarını gösterir", () => {
    renderSignIn();
    expect(container.textContent).toContain("Apple ile Giriş Yap");
    expect(container.textContent).toContain("Google ile Giriş Yap");
  });

  it("e-posta formu açılıp giriş yapılabilir", () => {
    renderSignIn();
    const toggle = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "E-posta ile giriş"
    );
    expect(toggle).toBeTruthy();
    act(() => toggle.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    act(() => {
      nativeInputValueSetter.call(emailInput, "apple-review@tusoskop.com");
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeInputValueSetter.call(passwordInput, "secret123");
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const form = container.querySelector("form");
    act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

    expect(loginWithEmail).toHaveBeenCalledWith("apple-review@tusoskop.com", "secret123");
    expect(registerWithEmail).not.toHaveBeenCalled();
  });
});
