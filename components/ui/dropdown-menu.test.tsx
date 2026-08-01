import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@base-ui/react/menu", () => ({
  Menu: {
    Root: (p: Record<string, unknown>) => <div data-slot="dropdown-menu" {...p} />,
    Portal: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-portal" {...p} />,
    Trigger: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-trigger" {...p} />,
    Popup: (p: Record<string, unknown>) => <div {...p} />,
    Positioner: (p: Record<string, unknown>) => <div {...p} />,
    Group: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-group" {...p} />,
    GroupLabel: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-label" {...p} />,
    Item: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-item" {...p} />,
    SubmenuRoot: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-sub" {...p} />,
    SubmenuTrigger: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-sub-trigger" {...p} />,
    CheckboxItem: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-checkbox-item" {...p} />,
    CheckboxItemIndicator: (p: Record<string, unknown>) => <span data-slot="dropdown-menu-checkbox-item-indicator" {...p} />,
    RadioGroup: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-radio-group" {...p} />,
    RadioItem: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-radio-item" {...p} />,
    RadioItemIndicator: (p: Record<string, unknown>) => <span data-slot="dropdown-menu-radio-item-indicator" {...p} />,
    Separator: (p: Record<string, unknown>) => <div data-slot="dropdown-menu-separator" {...p} />,
  },
}));

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("renders with data-slot dropdown-menu", () => {
    const markup = renderToStaticMarkup(<DropdownMenu />);
    expect(markup).toContain('data-slot="dropdown-menu"');
  });
});

describe("DropdownMenuPortal", () => {
  it("renders with data-slot dropdown-menu-portal", () => {
    const markup = renderToStaticMarkup(<DropdownMenuPortal />);
    expect(markup).toContain('data-slot="dropdown-menu-portal"');
  });
});

describe("DropdownMenuTrigger", () => {
  it("renders with data-slot dropdown-menu-trigger", () => {
    const markup = renderToStaticMarkup(<DropdownMenuTrigger />);
    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
  });
});

describe("DropdownMenuContent", () => {
  it("renders with data-slot dropdown-menu-content", () => {
    const markup = renderToStaticMarkup(<DropdownMenuContent />);
    expect(markup).toContain('data-slot="dropdown-menu-content"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuContent className="custom-content" />);
    expect(markup).toContain("custom-content");
  });
});

describe("DropdownMenuGroup", () => {
  it("renders with data-slot dropdown-menu-group", () => {
    const markup = renderToStaticMarkup(<DropdownMenuGroup />);
    expect(markup).toContain('data-slot="dropdown-menu-group"');
  });
});

describe("DropdownMenuLabel", () => {
  it("renders with data-slot dropdown-menu-label", () => {
    const markup = renderToStaticMarkup(<DropdownMenuLabel />);
    expect(markup).toContain('data-slot="dropdown-menu-label"');
  });

  it("accepts inset prop", () => {
    const markup = renderToStaticMarkup(<DropdownMenuLabel inset />);
    expect(markup).toContain('data-inset="true"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuLabel className="custom-label" />);
    expect(markup).toContain("custom-label");
  });
});

describe("DropdownMenuItem", () => {
  it("renders with data-slot dropdown-menu-item", () => {
    const markup = renderToStaticMarkup(<DropdownMenuItem />);
    expect(markup).toContain('data-slot="dropdown-menu-item"');
  });

  it("renders default variant", () => {
    const markup = renderToStaticMarkup(<DropdownMenuItem variant="default" />);
    expect(markup).toContain('data-variant="default"');
  });

  it("renders destructive variant", () => {
    const markup = renderToStaticMarkup(<DropdownMenuItem variant="destructive" />);
    expect(markup).toContain('data-variant="destructive"');
  });

  it("accepts inset prop", () => {
    const markup = renderToStaticMarkup(<DropdownMenuItem inset />);
    expect(markup).toContain('data-inset="true"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuItem className="custom-item" />);
    expect(markup).toContain("custom-item");
  });
});

describe("DropdownMenuSub", () => {
  it("renders with data-slot dropdown-menu-sub", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSub />);
    expect(markup).toContain('data-slot="dropdown-menu-sub"');
  });
});

describe("DropdownMenuSubTrigger", () => {
  it("renders with data-slot dropdown-menu-sub-trigger", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSubTrigger />);
    expect(markup).toContain('data-slot="dropdown-menu-sub-trigger"');
  });

  it("accepts inset prop", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSubTrigger inset />);
    expect(markup).toContain('data-inset="true"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSubTrigger className="custom-sub-trigger" />);
    expect(markup).toContain("custom-sub-trigger");
  });
});

describe("DropdownMenuSubContent", () => {
  it("renders with data-slot dropdown-menu-sub-content", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSubContent />);
    expect(markup).toContain('data-slot="dropdown-menu-sub-content"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSubContent className="custom-sub-content" />);
    expect(markup).toContain("custom-sub-content");
  });
});

describe("DropdownMenuCheckboxItem", () => {
  it("renders with data-slot dropdown-menu-checkbox-item", () => {
    const markup = renderToStaticMarkup(<DropdownMenuCheckboxItem />);
    expect(markup).toContain('data-slot="dropdown-menu-checkbox-item"');
  });

  it("accepts inset prop", () => {
    const markup = renderToStaticMarkup(<DropdownMenuCheckboxItem inset />);
    expect(markup).toContain('data-inset="true"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuCheckboxItem className="custom-checkbox-item" />);
    expect(markup).toContain("custom-checkbox-item");
  });
});

describe("DropdownMenuRadioGroup", () => {
  it("renders with data-slot dropdown-menu-radio-group", () => {
    const markup = renderToStaticMarkup(<DropdownMenuRadioGroup />);
    expect(markup).toContain('data-slot="dropdown-menu-radio-group"');
  });
});

describe("DropdownMenuRadioItem", () => {
  it("renders with data-slot dropdown-menu-radio-item", () => {
    const markup = renderToStaticMarkup(<DropdownMenuRadioItem value="a" />);
    expect(markup).toContain('data-slot="dropdown-menu-radio-item"');
  });

  it("accepts inset prop", () => {
    const markup = renderToStaticMarkup(<DropdownMenuRadioItem value="a" inset />);
    expect(markup).toContain('data-inset="true"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuRadioItem value="a" className="custom-radio-item" />);
    expect(markup).toContain("custom-radio-item");
  });
});

describe("DropdownMenuSeparator", () => {
  it("renders with data-slot dropdown-menu-separator", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSeparator />);
    expect(markup).toContain('data-slot="dropdown-menu-separator"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuSeparator className="custom-separator" />);
    expect(markup).toContain("custom-separator");
  });
});

describe("DropdownMenuShortcut", () => {
  it("renders with data-slot dropdown-menu-shortcut", () => {
    const markup = renderToStaticMarkup(<DropdownMenuShortcut />);
    expect(markup).toContain('data-slot="dropdown-menu-shortcut"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<DropdownMenuShortcut className="custom-shortcut" />);
    expect(markup).toContain("custom-shortcut");
  });
});
