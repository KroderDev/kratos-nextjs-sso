"use client";

import { ArrowUpRight } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button-link";
import type { RenderableOryFlow } from "@/lib/ory/types";
import { useTranslation } from "@/lib/i18n/client";

import { FlowForm } from "./flow-form";
import {
  rememberSettingsArea,
  SettingsNavigation,
} from "./settings-navigation";
import {
  getSettingsArea,
  getSettingsAreaDefinition,
  SETTINGS_AREA_DEFINITIONS,
  type SettingsArea,
} from "./settings-sections";

type SettingsWorkspaceProps = {
  flow: RenderableOryFlow;
  flowState?: string | null;
  initialArea: SettingsArea;
  locale?: string;
};

/**
 * Renders the title and description for the selected settings area.
 *
 * @param area - The settings area whose translated heading content is displayed
 */
function SettingsAreaHeading({ area }: { area: SettingsArea }) {
  const { t } = useTranslation();
  const definition = getSettingsAreaDefinition(area);

  return (
    <div className="mb-5 sm:mb-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
        {t("dashboard.settings.navigation.currentArea")}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] sm:text-2xl" id="settings-area-title">
        {t(definition.label)}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t(definition.description)}
      </p>
    </div>
  );
}

function SettingsReturn() {
  const { t } = useTranslation();

  return (
    <div className="mt-4 border-t border-border/70 pt-4 lg:mt-8 lg:pt-6">
      <p className="hidden text-sm leading-6 text-muted-foreground lg:block">
        {t("dashboard.settings.navigation.help")}
      </p>
      <ButtonLink className="lg:mt-4" href="/dashboard" size="sm" variant="link">
        {t("dashboard.settings.navigation.returnOverview")}
        <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
      </ButtonLink>
    </div>
  );
}

/**
 * Renders the settings workspace with area navigation, contextual headings, and the selected settings form.
 *
 * @param flow - The settings flow to render
 * @param flowState - The current state of the settings flow
 * @param initialArea - The settings area selected when no valid URL section is provided
 * @param locale - The locale used for translated navigation content
 */
export function SettingsWorkspace({ flow, flowState, initialArea, locale }: SettingsWorkspaceProps) {
  const [activeArea, setActiveArea] = useState(initialArea);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const requestedArea = getSettingsArea(currentUrl.searchParams.get("section"));
    const nextArea = requestedArea ?? initialArea;

    rememberSettingsArea(nextArea);

    function handlePopState() {
      const area = getSettingsArea(new URL(window.location.href).searchParams.get("section"));

      if (area) {
        setActiveArea(area);
        rememberSettingsArea(area);
      } else {
        setActiveArea(initialArea);
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [initialArea]);

  function changeArea(area: SettingsArea) {
    rememberSettingsArea(area);
    startTransition(() => setActiveArea(area));

    const url = new URL(window.location.href);
    url.searchParams.set("section", area);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <SettingsNavigation
          activeArea={activeArea}
          areas={SETTINGS_AREA_DEFINITIONS}
          flowId={flow.id}
          locale={locale}
          onAreaChange={changeArea}
        />
        <SettingsReturn />
      </aside>
      <section aria-labelledby="settings-area-title" className="min-w-0 max-w-3xl">
        <SettingsAreaHeading area={activeArea} />
        <FlowForm
          embedded
          flow={flow}
          kind="settings"
          separateProviders={false}
          settingsArea={activeArea}
          flowState={flowState}
        />
      </section>
    </div>
  );
}
