"use client";

import Link from "next/link";
import {
  Search,
  PlusCircle,
  FileText,
  CheckCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  currentPath: string;
  isAdmin: boolean;
}

const tabs = [
  { href: "/lost-items", label: "Lost Items", icon: Search },
  { href: "/posts/new", label: "New Post", icon: PlusCircle },
  { href: "/posts/my-posts", label: "My Posts", icon: FileText },
  { href: "/claimed", label: "Claimed", icon: CheckCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav({ currentPath, isAdmin }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-end justify-around border-t border-border bg-white shadow-[0_-2px_10px_rgba(26,39,68,0.08)] pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isActive =
          currentPath === tab.href ||
          (tab.href !== "/" && currentPath.startsWith(tab.href));
        const showAdminDot = isAdmin && tab.href === "/settings";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-[4rem] transition-colors",
              isActive ? "text-accent" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <tab.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              />
              {showAdminDot && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />
              )}
            </span>
            <span
              className={cn(
                "text-[10px] leading-tight",
                isActive ? "font-semibold text-accent" : "font-medium"
              )}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
