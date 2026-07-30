"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings2 } from "lucide-react";

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

type AccountMenuProps = {
  email: string;
  initials: string;
  label: string;
  logoutUrl: string;
};

export function AccountMenu({
  email,
  initials,
  label,
  logoutUrl,
}: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Open account menu for ${label}`}
        render={
          <Button className="h-9 gap-2 rounded-lg px-2 hover:bg-muted" size="sm" variant="ghost" />
        }
      >
        <span
          aria-hidden="true"
          className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-[10px] font-semibold tracking-tight text-primary-foreground"
        >
          {initials}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{label}</span>
        <ChevronDown aria-hidden="true" className="text-muted-foreground" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="truncate text-foreground">{label}</span>
            <span className="truncate font-normal text-muted-foreground">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
            <Settings2 aria-hidden="true" data-icon="inline-start" />
            Account settings
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={logoutUrl} />}>
            <LogOut aria-hidden="true" data-icon="inline-start" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
