"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  FileText,
  CheckCircle,
  Settings,
  ShieldCheck,
  Users,
  LayoutList,
  ScrollText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPath: string;
  isAdmin: boolean;
  mobile?: boolean;
}

const navLinks = [
  { href: "/lost-items", label: "Search", icon: Search },
  { href: "/posts/new", label: "New Post", icon: PlusCircle },
  { href: "/posts/my-posts", label: "My Posts", icon: FileText },
  { href: "/claimed", label: "Claimed Items", icon: CheckCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ currentPath, isAdmin, mobile = false }: SidebarProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchCount = () => {
      fetch("/api/posts?status=pending&limit=1")
        .then((r) => r.json())
        .then((j) => setPendingCount(j.data?.total ?? 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const adminLinks = [
    { href: "/admin/approvals", label: "Approvals", icon: ShieldCheck, badge: pendingCount },
    { href: "/admin/posts", label: "Manage Posts", icon: LayoutList, badge: 0 },
    { href: "/admin/logs", label: "System Logs", icon: ScrollText, badge: 0 },
    { href: "/admin/users", label: "Users", icon: Users, badge: 0 },
  ];

  return (
    <aside
      className={cn(
        "w-64 h-screen bg-white border-r border-border shadow-[1px_0_8px_rgba(26,39,68,0.06)]",
        mobile ? "flex flex-col" : "hidden lg:flex lg:flex-col fixed left-0 top-0 z-40"
      )}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-serif font-bold text-lg">
          L
        </div>
        <div>
          <h1 className="font-serif font-semibold text-base text-foreground leading-tight">
            Campus
          </h1>
          <p className="text-xs text-muted-foreground leading-tight">
            Lost &amp; Found
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const isActive =
              currentPath === link.href ||
              (link.href !== "/" && currentPath.startsWith(link.href));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin
            </p>
            <ul className="space-y-1">
              {adminLinks.map((link) => {
                const isActive =
                  currentPath === link.href ||
                  currentPath.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      {link.badge > 0 && (
                        <span
                          className={cn(
                            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-destructive text-destructive-foreground"
                          )}
                        >
                          {link.badge > 99 ? "99+" : link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          v1.0
        </p>
      </div>
    </aside>
  );
}
