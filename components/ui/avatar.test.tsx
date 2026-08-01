import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@base-ui/react/avatar", () => ({
  Avatar: {
    Root: ({
      className,
      children,
      "data-slot": dataSlot,
      "data-size": dataSize,
      ...props
    }: Record<string, unknown>) => (
      <span
        data-slot={dataSlot as string}
        data-size={dataSize as string}
        className={className as string}
        {...props}
      >
        {children as React.ReactNode}
      </span>
    ),
    Image: ({ className, ...props }: Record<string, unknown>) => (
      <span data-slot="avatar-image" className={className as string} {...props} />
    ),
    Fallback: ({ className, ...props }: Record<string, unknown>) => (
      <span data-slot="avatar-fallback" className={className as string} {...props} />
    ),
  },
}));

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar";

describe("Avatar", () => {
  it("renders root with data-slot avatar", () => {
    const markup = renderToStaticMarkup(<Avatar />);
    expect(markup).toContain('data-slot="avatar"');
  });

  it("renders default size", () => {
    const markup = renderToStaticMarkup(<Avatar size="default" />);
    expect(markup).toContain('data-size="default"');
  });

  it("renders sm size", () => {
    const markup = renderToStaticMarkup(<Avatar size="sm" />);
    expect(markup).toContain('data-size="sm"');
  });

  it("renders lg size", () => {
    const markup = renderToStaticMarkup(<Avatar size="lg" />);
    expect(markup).toContain('data-size="lg"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<Avatar className="custom-avatar" />);
    expect(markup).toContain("custom-avatar");
  });

  it("renders children inside root", () => {
    const markup = renderToStaticMarkup(
      <Avatar>
        <AvatarImage />
      </Avatar>,
    );
    expect(markup).toContain('data-slot="avatar-image"');
  });
});

describe("AvatarImage", () => {
  it("renders with data-slot avatar-image", () => {
    const markup = renderToStaticMarkup(<AvatarImage />);
    expect(markup).toContain('data-slot="avatar-image"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<AvatarImage className="custom-image" />);
    expect(markup).toContain("custom-image");
  });
});

describe("AvatarFallback", () => {
  it("renders with data-slot avatar-fallback", () => {
    const markup = renderToStaticMarkup(<AvatarFallback />);
    expect(markup).toContain('data-slot="avatar-fallback"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<AvatarFallback className="custom-fallback" />);
    expect(markup).toContain("custom-fallback");
  });
});

describe("AvatarBadge", () => {
  it("renders with data-slot avatar-badge", () => {
    const markup = renderToStaticMarkup(<AvatarBadge />);
    expect(markup).toContain('data-slot="avatar-badge"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<AvatarBadge className="custom-badge" />);
    expect(markup).toContain("custom-badge");
  });
});

describe("AvatarGroup", () => {
  it("renders with data-slot avatar-group", () => {
    const markup = renderToStaticMarkup(<AvatarGroup />);
    expect(markup).toContain('data-slot="avatar-group"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<AvatarGroup className="custom-group" />);
    expect(markup).toContain("custom-group");
  });
});

describe("AvatarGroupCount", () => {
  it("renders with data-slot avatar-group-count", () => {
    const markup = renderToStaticMarkup(<AvatarGroupCount />);
    expect(markup).toContain('data-slot="avatar-group-count"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<AvatarGroupCount className="custom-count" />);
    expect(markup).toContain("custom-count");
  });
});
