import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FaviconProvider } from "./favicon-provider";

const mockUseTheme = vi.hoisted(() => vi.fn());
const mockPrevTheme = vi.hoisted(() => ({ current: undefined as string | undefined }));

vi.mock("next-themes", () => ({
  useTheme: mockUseTheme,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: vi.fn((fn: () => void) => { fn(); }),
    useRef: vi.fn(() => mockPrevTheme),
  };
});

describe("FaviconProvider", () => {
  let mockQS: ReturnType<typeof vi.fn>;
  let mockCE: ReturnType<typeof vi.fn>;
  let mockAppend: ReturnType<typeof vi.fn>;
  let mockLink: { rel: string; href: string };
  let mockRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPrevTheme.current = undefined;
    mockRemove = vi.fn();
    mockLink = { rel: "", href: "" };
    mockCE = vi.fn().mockReturnValue(mockLink);
    mockAppend = vi.fn();
    mockQS = vi.fn().mockReturnValue({ forEach: vi.fn((fn: (el: { remove: () => void }) => void) => fn({ remove: mockRemove as unknown as () => void })) });

    globalThis.document = {
      querySelectorAll: mockQS,
      createElement: mockCE,
      head: { appendChild: mockAppend },
    } as unknown as Document;
  });

  describe("with default branding (no favicons)", () => {
    it("renders no visible markup", () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: "dark" });
      expect(renderToStaticMarkup(<FaviconProvider />)).toBe("");
    });

    it("skips DOM operations when no favicons are configured", () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: "dark" });
      renderToStaticMarkup(<FaviconProvider />);
      expect(mockCE).not.toHaveBeenCalled();
    });

    it("skips DOM operations when resolvedTheme is undefined", () => {
      mockUseTheme.mockReturnValue({ resolvedTheme: undefined });
      renderToStaticMarkup(<FaviconProvider />);
      expect(mockCE).not.toHaveBeenCalled();
    });
  });

  describe("with favicons configured", () => {
    async function renderFresh(theme: string | undefined) {
      mockUseTheme.mockReturnValue({ resolvedTheme: theme });

      vi.resetModules();
      const { FaviconProvider: Fresh } = await import("./favicon-provider");
      renderToStaticMarkup(<Fresh />);
    }

    it("selects dark favicon on dark theme", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon-light.ico",
        brandFaviconDark: "/favicon-dark.ico",
      }));
      await renderFresh("dark");

      expect(mockCE).toHaveBeenCalledWith("link");
      expect(mockLink.href).toBe("/favicon-dark.ico");
      expect(mockLink.rel).toBe("icon");
    });

    it("falls back to light favicon on dark theme when no dark favicon is set", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon-light.ico",
        brandFaviconDark: "",
      }));
      await renderFresh("dark");

      expect(mockLink.href).toBe("/favicon-light.ico");
    });

    it("selects light favicon on light theme", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon-light.ico",
        brandFaviconDark: "/favicon-dark.ico",
      }));
      await renderFresh("light");

      expect(mockLink.href).toBe("/favicon-light.ico");
    });

    it("falls back to dark favicon on light theme when no light favicon is set", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "",
        brandFaviconDark: "/favicon-dark.ico",
      }));
      await renderFresh("light");

      expect(mockLink.href).toBe("/favicon-dark.ico");
    });

    it("uses light favicon on light theme when only light is configured", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon.ico",
        brandFaviconDark: "",
      }));
      await renderFresh("light");

      expect(mockLink.href).toBe("/favicon.ico");
    });

    it("removes existing favicon links before adding a new one", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon.ico",
        brandFaviconDark: "/favicon-dark.ico",
      }));
      await renderFresh("light");

      expect(mockQS).toHaveBeenCalledWith('link[rel="icon"]');
    });

    it("skips DOM work when the resolved theme has not changed", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon.ico",
        brandFaviconDark: "/favicon-dark.ico",
      }));
      mockUseTheme.mockReturnValue({ resolvedTheme: "light" });

      vi.resetModules();
      const { FaviconProvider: Fresh } = await import("./favicon-provider");
      renderToStaticMarkup(<Fresh />);
      mockCE.mockClear();
      renderToStaticMarkup(<Fresh />);

      expect(mockCE).not.toHaveBeenCalled();
    });

    it("appends the new favicon link to document head", async () => {
      vi.doMock("@/lib/branding", () => ({
        brandFaviconLight: "/favicon.ico",
        brandFaviconDark: "/favicon-dark.ico",
      }));
      await renderFresh("light");

      expect(mockAppend).toHaveBeenCalledWith(mockLink);
    });
  });
});
