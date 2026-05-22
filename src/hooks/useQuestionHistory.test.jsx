import React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, ...parts) => ({ path: parts.join("/") })),
  onSnapshot: firestoreMocks.onSnapshot,
}));

const authMock = vi.hoisted(() => ({ currentUser: { uid: "u1" } }));

vi.mock("../firebase", () => ({
  db: {},
  auth: authMock,
}));

const storage = {};

beforeEach(() => {
  authMock.currentUser = { uid: "u1" };
  firestoreMocks.onSnapshot.mockReset();
  Object.keys(storage).forEach((k) => delete storage[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = value;
    },
    removeItem: (key) => {
      delete storage[key];
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderHook(useHookFn) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const probeRef = { current: undefined };
  function Probe() {
    // eslint-disable-next-line react-hooks/immutability -- test harness; useHookFn'i dışarı yakalamamız gerekiyor
    probeRef.current = useHookFn();
    return null;
  }
  return {
    render: async () => {
      await act(async () => {
        root.render(<Probe />);
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
    },
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
    probeRef,
  };
}

describe("useQuestionHistory", () => {
  it("kullanıcı yokken localStorage fallback döner", async () => {
    storage["tusoskop-question-history"] = JSON.stringify([
      { questionId: 5, ders: "A", konu: "B", isCorrect: true, correct: 1, selected: 1 },
    ]);
    const { useQuestionHistory } = await import("./useQuestionHistory.js");
    const { render, cleanup, probeRef } = renderHook(() => useQuestionHistory(null));
    await render();
    expect(probeRef.current).toBeTruthy();
    expect(probeRef.current[5]).toBeTruthy();
    expect(firestoreMocks.onSnapshot).not.toHaveBeenCalled();
    cleanup();
  });

  it("user.uid varsa onSnapshot ile aboneliği başlatır", async () => {
    const unsub = vi.fn();
    let nextCb;
    firestoreMocks.onSnapshot.mockImplementation((_ref, _opts, next) => {
      nextCb = next;
      return unsub;
    });
    const { useQuestionHistory } = await import("./useQuestionHistory.js");
    const { render, cleanup, probeRef } = renderHook(() => useQuestionHistory({ uid: "u1" }));
    await render();
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledTimes(1);

    await act(async () => {
      nextCb({
        forEach: (fn) => {
          fn({
            id: "42",
            data: () => ({
              questionId: 42,
              ders: "Fizyoloji",
              konu: "Sinir-Kas",
              firstSolvedAt: "2026-05-01T00:00:00.000Z",
              lastSolvedAt: "2026-05-02T00:00:00.000Z",
              solvedCount: 1,
              correctCount: 1,
              wrongCount: 0,
              lastCorrect: true,
              source: "topic",
              schemaVersion: 1,
            }),
          });
        },
      });
    });

    expect(probeRef.current[42]).toBeTruthy();
    expect(probeRef.current[42].lastCorrect).toBe(true);
    cleanup();
    expect(unsub).toHaveBeenCalled();
  });

  it("permission-denied hatasında local fallback'e düşer", async () => {
    storage["tusoskop-question-history"] = JSON.stringify([
      { questionId: 9, ders: "A", konu: "B", isCorrect: false, correct: 1, selected: 0 },
    ]);
    let errorCb;
    firestoreMocks.onSnapshot.mockImplementation((_ref, _opts, _next, error) => {
      errorCb = error;
      return vi.fn();
    });
    const { useQuestionHistory } = await import("./useQuestionHistory.js");
    const { render, cleanup, probeRef } = renderHook(() => useQuestionHistory({ uid: "u1" }));
    await render();
    await act(async () => {
      errorCb({ code: "permission-denied" });
    });
    expect(probeRef.current[9]).toBeTruthy();
    cleanup();
  });

  it("auth.currentUser uid eşleşmezse onSnapshot çağrılmaz", async () => {
    authMock.currentUser = { uid: "different" };
    const { useQuestionHistory } = await import("./useQuestionHistory.js");
    const { render, cleanup } = renderHook(() => useQuestionHistory({ uid: "u1" }));
    await render();
    expect(firestoreMocks.onSnapshot).not.toHaveBeenCalled();
    cleanup();
  });
});
