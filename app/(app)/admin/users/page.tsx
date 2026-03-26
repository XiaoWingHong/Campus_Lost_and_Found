"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "@/components/search/SearchBar";
import { UserTable } from "@/components/admin/UserTable";
import type { User } from "@/types";

type SafeUser = Omit<User, "passwordHash">;

export default function UsersPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data ?? []);
      }
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to update role");
      }
      toast.success("User role updated");
      fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <SearchBar
        value={search}
        onChange={handleSearch}
        placeholder="Search by name or EID..."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <UserTable users={users} onRoleChange={handleRoleChange} />
      )}
    </motion.div>
  );
}
