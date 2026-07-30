"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
          <Button className="gap-2 rounded-lg px-2 hover:bg-muted" size="sm" variant="ghost" />
        }
      >
        <span className="max-w-28 truncate">{label}</span>
        <ChevronDown aria-hidden="true" className="text-muted-foreground" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
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
