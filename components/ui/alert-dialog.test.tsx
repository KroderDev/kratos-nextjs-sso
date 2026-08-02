// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

let mountedRoot: Root | undefined;
let mountedContainer: HTMLDivElement | undefined;

afterEach(() => {
  if (mountedRoot) {
    act(() => mountedRoot?.unmount());
  }
  mountedContainer?.remove();
  mountedRoot = undefined;
  mountedContainer = undefined;
});

describe("alert dialog components", () => {
  it("renders a dismissing action as a styled alert-dialog close control", () => {
    const markup = renderToStaticMarkup(
      <AlertDialog open>
        <AlertDialogAction size="sm" variant="destructive">
          Confirm removal
        </AlertDialogAction>
      </AlertDialog>,
    );

    expect(markup).toContain('data-slot="alert-dialog-action"');
    expect(markup).toContain("Confirm removal");
    expect(markup).toContain("bg-destructive/10");
  });

  it("renders the complete dialog composition", () => {
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(
        <AlertDialog open>
          <AlertDialogTrigger>Open dialog</AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>!</AlertDialogMedia>
              <AlertDialogTitle>Delete account</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
              <AlertDialogClose>Close</AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>,
      );
    });

    const markup = document.body.innerHTML;

    expect(markup).toContain('data-slot="alert-dialog-trigger"');
    expect(markup).toContain('data-slot="alert-dialog-overlay"');
    expect(markup).toContain('data-slot="alert-dialog-content"');
    expect(markup).toContain('data-slot="alert-dialog-header"');
    expect(markup).toContain('data-slot="alert-dialog-media"');
    expect(markup).toContain('data-slot="alert-dialog-title"');
    expect(markup).toContain('data-slot="alert-dialog-description"');
    expect(markup).toContain('data-slot="alert-dialog-footer"');
    expect(markup).toContain('data-slot="alert-dialog-cancel"');
    expect(markup).toContain('data-slot="alert-dialog-close"');
    expect(markup).toContain("Delete account");
  });

  it("closes when the action is activated", () => {
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(
        <AlertDialog>
          <AlertDialogTrigger>Open dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Confirm</AlertDialogTitle>
            <AlertDialogAction>Confirm action</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>,
      );
    });

    act(() => {
      mountedContainer?.querySelector<HTMLButtonElement>(
        '[data-slot="alert-dialog-trigger"]',
      )?.click();
    });
    expect(document.querySelector('[data-slot="alert-dialog-content"]')).not.toBeNull();

    act(() => {
      document.querySelector<HTMLButtonElement>('[data-slot="alert-dialog-action"]')?.click();
    });
    expect(document.querySelector('[data-slot="alert-dialog-content"]')).toBeNull();
  });
});
