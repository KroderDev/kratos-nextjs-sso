import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";

describe("FieldSet", () => {
  it("renders with data-slot field-set", () => {
    const markup = renderToStaticMarkup(<FieldSet />);
    expect(markup).toContain('data-slot="field-set"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldSet className="custom-fieldset" />);
    expect(markup).toContain("custom-fieldset");
  });
});

describe("FieldLegend", () => {
  it("renders with data-slot field-legend", () => {
    const markup = renderToStaticMarkup(<FieldLegend />);
    expect(markup).toContain('data-slot="field-legend"');
  });

  it("renders default variant as legend", () => {
    const markup = renderToStaticMarkup(<FieldLegend variant="legend" />);
    expect(markup).toContain('data-variant="legend"');
  });

  it("renders label variant", () => {
    const markup = renderToStaticMarkup(<FieldLegend variant="label" />);
    expect(markup).toContain('data-variant="label"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldLegend className="custom-legend" />);
    expect(markup).toContain("custom-legend");
  });
});

describe("FieldGroup", () => {
  it("renders with data-slot field-group", () => {
    const markup = renderToStaticMarkup(<FieldGroup />);
    expect(markup).toContain('data-slot="field-group"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldGroup className="custom-group" />);
    expect(markup).toContain("custom-group");
  });
});

describe("Field", () => {
  it("renders with data-slot field", () => {
    const markup = renderToStaticMarkup(<Field />);
    expect(markup).toContain('data-slot="field"');
  });

  it("renders default vertical orientation", () => {
    const markup = renderToStaticMarkup(<Field orientation="vertical" />);
    expect(markup).toContain('data-orientation="vertical"');
  });

  it("renders horizontal orientation", () => {
    const markup = renderToStaticMarkup(<Field orientation="horizontal" />);
    expect(markup).toContain('data-orientation="horizontal"');
  });

  it("renders responsive orientation", () => {
    const markup = renderToStaticMarkup(<Field orientation="responsive" />);
    expect(markup).toContain('data-orientation="responsive"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<Field className="custom-field" />);
    expect(markup).toContain("custom-field");
  });
});

describe("FieldContent", () => {
  it("renders with data-slot field-content", () => {
    const markup = renderToStaticMarkup(<FieldContent />);
    expect(markup).toContain('data-slot="field-content"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldContent className="custom-content" />);
    expect(markup).toContain("custom-content");
  });
});

describe("FieldLabel", () => {
  it("renders with data-slot field-label", () => {
    const markup = renderToStaticMarkup(<FieldLabel />);
    expect(markup).toContain('data-slot="field-label"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldLabel className="custom-label" />);
    expect(markup).toContain("custom-label");
  });
});

describe("FieldTitle", () => {
  it("renders with data-slot field-label", () => {
    const markup = renderToStaticMarkup(<FieldTitle />);
    expect(markup).toContain('data-slot="field-label"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldTitle className="custom-title" />);
    expect(markup).toContain("custom-title");
  });
});

describe("FieldDescription", () => {
  it("renders with data-slot field-description", () => {
    const markup = renderToStaticMarkup(<FieldDescription />);
    expect(markup).toContain('data-slot="field-description"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldDescription className="custom-desc" />);
    expect(markup).toContain("custom-desc");
  });
});

describe("FieldSeparator", () => {
  it("renders with data-slot field-separator", () => {
    const markup = renderToStaticMarkup(<FieldSeparator />);
    expect(markup).toContain('data-slot="field-separator"');
  });

  it("renders data-content false when no children", () => {
    const markup = renderToStaticMarkup(<FieldSeparator />);
    expect(markup).toContain('data-content="false"');
  });

  it("renders data-content true when children present", () => {
    const markup = renderToStaticMarkup(<FieldSeparator>or</FieldSeparator>);
    expect(markup).toContain('data-content="true"');
  });

  it("renders children content", () => {
    const markup = renderToStaticMarkup(<FieldSeparator>or</FieldSeparator>);
    expect(markup).toContain("or");
    expect(markup).toContain('data-slot="field-separator-content"');
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(<FieldSeparator className="custom-sep" />);
    expect(markup).toContain("custom-sep");
  });
});

describe("FieldError", () => {
  it("renders nothing when no children and no errors", () => {
    const markup = renderToStaticMarkup(<FieldError />);
    expect(markup).toBe("");
  });

  it("renders nothing with empty errors array", () => {
    const markup = renderToStaticMarkup(<FieldError errors={[]} />);
    expect(markup).toBe("");
  });

  it("renders single error message", () => {
    const markup = renderToStaticMarkup(<FieldError errors={[{ message: "Required" }]} />);
    expect(markup).toContain("Required");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('data-slot="field-error"');
  });

  it("deduplicates error messages", () => {
    const markup = renderToStaticMarkup(
      <FieldError
        errors={[{ message: "Invalid" }, { message: "Invalid" }, { message: "Too short" }]}
      />,
    );
    expect(markup).toContain("Invalid");
    expect(markup).toContain("Too short");
    const invalidCount = (markup.match(/Invalid/g) ?? []).length;
    expect(invalidCount).toBe(1);
  });

  it("renders multiple unique errors as a list", () => {
    const markup = renderToStaticMarkup(
      <FieldError errors={[{ message: "Invalid" }, { message: "Too short" }]} />,
    );
    expect(markup).toContain("<ul");
    expect(markup).toContain("<li");
  });

  it("renders children instead of errors when both provided", () => {
    const markup = renderToStaticMarkup(
      <FieldError errors={[{ message: "Required" }]}>Custom content</FieldError>,
    );
    expect(markup).toContain("Custom content");
    expect(markup).not.toContain("Required");
  });

  it("skips errors with undefined message", () => {
    const markup = renderToStaticMarkup(
      <FieldError errors={[undefined, { message: "Valid" }]} />,
    );
    expect(markup).toContain("Valid");
  });

  it("merges className", () => {
    const markup = renderToStaticMarkup(
      <FieldError className="custom-error" errors={[{ message: "Error" }]} />,
    );
    expect(markup).toContain("custom-error");
  });
});
