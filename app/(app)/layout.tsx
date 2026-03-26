"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types";

const PATH_TITLES: Record<string, string> = {
  "/lost-items": "Lost Items",
  "/posts/new": "Report Lost Item",
  "/posts/my-posts": "My Posts",
  "/claimed": "Claimed Items",
  "/settings": "Settings",
  "/admin/approvals": "Post Approvals",
  "/admin/posts": "Manage Posts",
  "/admin/logs": "System Logs",
  "/admin/users": "User Management",
};

function getTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  if (pathname.startsWith("/lost-items/")) return "Item Details";
  return "CityUHK Lost & Found";
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => setUser(json.data ?? null))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block w-64 shrink-0">
          <Skeleton className="h-screen w-64 rounded-none" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-16 w-full rounded-none" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const title = getTitle(pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPath={pathname} isAdmin={isAdmin} />

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <Sidebar currentPath={pathname} isAdmin={isAdmin} mobile />
        </SheetContent>
      </Sheet>

      <div className="ml-0 lg:ml-64">
        <TopBar
          title={title}
          userName={user?.name ?? "User"}
          userRole={user?.role ?? "regular"}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="px-4 lg:px-6 py-6 pb-24 lg:pb-6">{children}</main>
      </div>

      <MobileNav currentPath={pathname} isAdmin={isAdmin} />
    </div>
  );
}
