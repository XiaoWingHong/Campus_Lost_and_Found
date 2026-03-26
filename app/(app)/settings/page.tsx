"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { updateProfileSchema } from "@/lib/validators";
import type { User } from "@/types";

type ProfileFormValues = z.infer<typeof updateProfileSchema>;

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        const userData: User | null = json.data ?? null;
        setUser(userData);
        if (userData) {
          reset({
            email: userData.defaultContact.email,
            phone: userData.defaultContact.phone,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultContact: { email: data.email, phone: data.phone },
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to update");
      }
      const updated = await res.json();
      setUser(updated.data ?? user);
      toast.success("Profile updated successfully");
      reset(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-xl space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Profile</CardTitle>
          <CardDescription>Your campus account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium">{user?.name ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">SID</Label>
              <p className="text-sm font-medium font-mono">{user?.sid || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Default Contact Info</CardTitle>
          <CardDescription>
            Update your default contact info used when creating posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Default Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Default Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+852 1234 5678"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
