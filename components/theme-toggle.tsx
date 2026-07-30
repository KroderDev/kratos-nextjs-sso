"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "@/lib/i18n/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();
  const mounted = React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const themeOptions = [
    { value: "light", label: t("common.theme.light"), icon: Sun },
    { value: "dark", label: t("common.theme.dark"), icon: Moon },
    { value: "system", label: t("common.theme.system"), icon: Monitor },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.theme.ariaLabel")}
        render={
          <Button
            className="size-7 p-0 sm:h-7 sm:w-auto sm:gap-1 sm:px-2.5"
            size="sm"
            variant="outline"
          />
        }
      >
        <Sun aria-hidden="true" />
        <span className="hidden sm:inline">{t("common.theme.label")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("common.theme.appearance")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={mounted ? theme ?? "system" : "system"}
            onValueChange={setTheme}
          >
            {themeOptions.map(({ icon: Icon, label, value }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon aria-hidden="true" data-icon="inline-start" />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

