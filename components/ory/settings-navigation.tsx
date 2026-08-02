"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import {
  FLOW_SUCCESS_TOASTS_STORAGE_KEY,
  formatSettingsAreaCookie,
} from "@/lib/ory/settings-state";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

import {
  type SettingsArea,
  type SettingsAreaDefinition,
} from "./settings-sections";

/**
 * Persists the selected settings area in a path-scoped browser cookie.
 *
 * @param area - The settings area to remember
 */
export function rememberSettingsArea(area: SettingsArea) {
  if (typeof document !== "undefined") {
    document.cookie = formatSettingsAreaCookie(area);
  }
}

/**
 * Stores the selected settings area and clears any persisted flow-success toast data.
 *
 * Storage errors are ignored when session storage is unavailable.
 *
 * @param area - The settings area to remember
 */
export function rememberSettingsAction(area: SettingsArea) {
  rememberSettingsArea(area);

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(FLOW_SUCCESS_TOASTS_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }
}

type SettingsNavigationProps = {
  activeArea: SettingsArea;
  areas: readonly SettingsAreaDefinition[];
  flowId?: string;
  locale?: string;
  onAreaChange?: (area: SettingsArea) => void;
};

/**
 * Builds a settings dashboard URL for the specified area.
 *
 * @param area - The settings area to display
 * @param flowId - An optional flow identifier to preserve in the URL
 * @param locale - An optional language identifier to include in the URL
 * @returns A settings dashboard URL with the selected area and optional query parameters
 */
function getSettingsAreaHref(area: SettingsArea, flowId?: string, locale?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("section", area);

  if (flowId) {
    searchParams.set("flow", flowId);
  }

  if (locale) {
    searchParams.set("lang", locale);
  }

  return `/dashboard/settings?${searchParams.toString()}`;
}

/**
 * Renders responsive navigation for the settings areas.
 *
 * @param activeArea - The currently selected settings area
 * @param areas - The settings areas available for navigation
 * @param flowId - Optional flow identifier preserved in navigation URLs
 * @param locale - Optional locale preserved in navigation URLs
 * @param onAreaChange - Optional callback for handling ordinary left-click area changes without navigation
 */
export function SettingsNavigation({
  activeArea,
  areas,
  flowId,
  locale,
  onAreaChange,
}: SettingsNavigationProps) {
  const { t } = useTranslation();

  function selectArea(area: SettingsArea, event: MouseEvent<HTMLAnchorElement>) {
    rememberSettingsArea(area);

    if (
      !onAreaChange ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onAreaChange(area);
  }

  return (
    <nav aria-label={t("dashboard.settings.navigation.label")}>
      <div className="hidden flex-col gap-1 lg:flex">
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("dashboard.settings.navigation.title")}
        </p>
        {areas.map((area) => {
          const active = area.id === activeArea;
          const areaContent = (
            <>
              <span>{t(area.label)}</span>
              <span
                aria-hidden="true"
                className={cn("text-xs", active ? "opacity-70" : "opacity-0")}
              >
                /
              </span>
            </>
          );

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={getSettingsAreaHref(area.id, flowId, locale)}
              key={area.id}
              onClick={(event) => selectArea(area.id, event)}
              prefetch={onAreaChange ? false : undefined}
            >
              {areaContent}
            </Link>
          );
        })}
      </div>

      <div className="min-w-0 overflow-x-auto lg:hidden">
        <div
          aria-label={t("dashboard.settings.navigation.selectLabel")}
          className="flex h-6 w-max min-w-full justify-start gap-4 rounded-none bg-transparent p-0"
        >
          {areas.map((area) => {
            const active = area.id === activeArea;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-6 min-w-max flex-none items-center rounded-none border-0 bg-transparent px-1 text-sm text-foreground/60 transition-colors after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-foreground after:opacity-0 after:transition-opacity",
                  active ? "text-foreground after:opacity-100" : "hover:text-foreground",
                )}
                href={getSettingsAreaHref(area.id, flowId, locale)}
                key={area.id}
                onClick={(event) => selectArea(area.id, event)}
                prefetch={onAreaChange ? false : undefined}
              >
                {t(area.label)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
