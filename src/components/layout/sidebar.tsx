"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  FileSpreadsheet,
  BarChart3,
  UploadCloud,
  FileText,
  GitBranch,
  BookOpen,
  Users,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AuthUser } from "@/types";

interface SidebarProps {
  user: AuthUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user.role === "ADMIN";

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Students",
      href: "/students",
      icon: GraduationCap,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Results Entry",
      href: "/results",
      icon: FileSpreadsheet,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Analytics Suite",
      href: "/analytics",
      icon: BarChart3,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Excel Import",
      href: "/imports",
      icon: UploadCloud,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "PDF Reports",
      href: "/reports",
      icon: FileText,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Branches",
      href: "/branches",
      icon: GitBranch,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Subjects",
      href: "/subjects",
      icon: BookOpen,
      roles: ["ADMIN", "FACULTY"],
    },
    {
      title: "Faculty",
      href: "/faculty",
      icon: Users,
      roles: ["ADMIN"],
    },
    {
      title: "Settings & Config",
      href: "/settings",
      icon: Settings,
      roles: ["ADMIN"],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card shadow-sm transition-all duration-300 z-30 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 font-semibold transition-opacity overflow-hidden",
            collapsed && "justify-center w-full"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
                RESULT ANALYTICS
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                Diploma Engineering
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{item.title}</span>}
              {!collapsed && item.href === "/faculty" && (
                <span className="ml-auto text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                  ADMIN
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer info */}
      <div className="border-t p-3 bg-muted/30">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "flex-col justify-center text-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border">
            {isAdmin ? <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold truncate text-foreground">
                {user.name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="text-[9px] px-1 py-0 h-4 uppercase tracking-wider font-semibold"
                >
                  {user.role}
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">
                  @{user.username}
                </span>
              </div>
            </div>
          )}
        </div>

        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-7 w-7 mt-2 mx-auto flex text-muted-foreground hover:text-foreground"
            title="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
