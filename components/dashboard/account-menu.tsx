"use client";

import Link from "next/link";
import { LogOut, Settings2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/client";

type AccountMenuProps = {
  avatarUrl?: string;
  email: string;
  initials: string;
  label: string;
  logoutUrl: string;
};

function AccountAvatar({
  avatarUrl,
  className,
  initials,
}: {
  avatarUrl?: string;
  className?: string;
  initials: string;
}) {
  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage alt="" src={avatarUrl} /> : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export function AccountMenu({
  avatarUrl,
  email,
  initials,
  label,
  logoutUrl,
}: AccountMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("common.navigation.accountMenuAria", { label })}
        render={
          <Button className="size-9 rounded-full p-1 hover:bg-muted" size="icon-lg" variant="ghost" />
        }
      >
        <AccountAvatar avatarUrl={avatarUrl} className="size-full" initials={initials} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3">
            <AccountAvatar avatarUrl={avatarUrl} initials={initials} />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-foreground">{label}</span>
              <span className="truncate font-normal text-muted-foreground">{email}</span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
            <Settings2 aria-hidden="true" data-icon="inline-start" />
            {t("common.navigation.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={logoutUrl} rel="noopener noreferrer" />}>
            <LogOut aria-hidden="true" data-icon="inline-start" />
            {t("common.navigation.signOut")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
