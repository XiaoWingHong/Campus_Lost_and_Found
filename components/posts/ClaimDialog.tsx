"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const claimFormSchema = z.object({
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().min(1, "Phone number is required"),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ClaimDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  defaultPhone?: string;
  onSuccess: () => void;
}

export function ClaimDialog({
  postId,
  open,
  onOpenChange,
  defaultEmail = "",
  defaultPhone = "",
  onSuccess,
}: ClaimDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      contactEmail: defaultEmail,
      contactPhone: defaultPhone,
    },
  });

  const onSubmit = async (data: ClaimFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Failed to claim item");
      }

      toast.success("Item claimed successfully! The poster will be notified.");
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Claim This Item</DialogTitle>
          <DialogDescription>
            Provide your contact information so the poster can reach you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            By claiming this item, the poster will be notified with your contact
            information.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your@email.com"
              {...register("contactEmail")}
            />
            {errors.contactEmail && (
              <p className="text-xs text-destructive">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+852 1234 5678"
              {...register("contactPhone")}
            />
            {errors.contactPhone && (
              <p className="text-xs text-destructive">
                {errors.contactPhone.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Claim
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
