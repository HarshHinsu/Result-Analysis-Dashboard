"use client";

import { AuthUser } from "@/types";
import { logoutAction } from "@/server/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  Calendar,
  Shield,
  User,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useState, useTransition } from "react";

interface HeaderProps {
  user: AuthUser;
}

export function Header({ user }: HeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-card/80 px-6 backdrop-blur-md">
      {/* College / Institution branding */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span>GTU / L.E. College Academic Portal</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-semibold">AY 2023-2024 (Active)</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 h-9 rounded-full border hover:bg-muted"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-foreground max-w-[120px] truncate leading-tight">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono">
                  {user.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email || `@${user.username}`}
                </p>
                <div className="pt-1">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-[10px] h-4">
                    {user.role} ACCESS
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-600 dark:text-rose-400 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-950"
              onClick={handleLogout}
              disabled={isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isPending ? "Signing out..." : "Sign Out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
