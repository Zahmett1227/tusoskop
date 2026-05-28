import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SignInOptions from "./SignInOptions";
import { shouldShowDemoLogin } from "../../services/demoModeService";

vi.mock("../../firebase", () => ({
  loginWithApple: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

describe("SignInOptions demo girişi", () => {
  let container;
  let root;

  beforeEach(() => {
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

  it("showDemoLogin true ise demo butonunu gösterir", () => {
    renderSignIn({ showDemoLogin: true, onDemoLogin: vi.fn() });
    expect(container.textContent).toContain("Demo olarak incele");
    expect(container.textContent).toContain("Gerçek hesap oluşturmadan uygulamayı test eder.");
  });

  it("showDemoLogin false ise demo butonunu gizler", () => {
    renderSignIn({ showDemoLogin: false, onDemoLogin: vi.fn() });
    expect(container.textContent).not.toContain("Demo olarak incele");
  });

  it("web ortamda demo login helper false döner", () => {
    expect(shouldShowDemoLogin()).toBe(false);
  });
});
