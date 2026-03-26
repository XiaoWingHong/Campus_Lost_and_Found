"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Info, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CascadingCategorySelect } from "@/components/search/CascadingCategorySelect";
import { createPostSchema } from "@/lib/validators";
import type { PostWithAuthor, Category } from "@/types";
import Image from "next/image";
import { X, Upload } from "lucide-react";

type PostFormValues = z.infer<typeof createPostSchema>;

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactMode, setContactMode] = useState<"default" | "other">("default");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(createPostSchema),
  });

  const categoryPath = watch("categoryPath");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.data ?? json.categories ?? []))
      .catch(() => {});
  }, []);

  function findCategoryPathById(
    categoryTree: Category[],
    targetCategoryId: string,
    path: string[] = []
  ): string[] | null {
    for (const category of categoryTree) {
      const nextPath = [...path, category.id];
      if (category.id === targetCategoryId) return nextPath;
      const childPath = findCategoryPathById(
        category.children,
        targetCategoryId,
        nextPath
      );
      if (childPath) return childPath;
    }
    return null;
  }

  const loadPost = useCallback(async () => {
    try {
      const [postRes, meRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch("/api/auth/me"),
      ]);
      if (!postRes.ok) throw new Error("Post not found");
      const postJson = await postRes.json();
      const meJson = await meRes.json();
      const p: PostWithAuthor = postJson.data;
      const me = meJson.data;

      setPost(p);
      setCurrentUser(me);
      setExistingPhotos(p.photos ?? []);

      const isOther = !p.contactInfo.useDefault;
      setContactMode(isOther ? "other" : "default");

      reset({
        itemName: p.itemName,
        categoryPath: p.categoryPath,
        description: p.description,
        dateLost: p.dateLost,
        timeLost: p.timeLost,
        locationLost: p.locationLost,
        contactInfo: p.contactInfo,
      });
      setSelectedCategoryId(p.categoryPath[p.categoryPath.length - 1] ?? "");
    } catch {
      toast.error("Failed to load post");
      router.push("/posts/my-posts");
    } finally {
      setIsLoading(false);
    }
  }, [postId, reset, router]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported format`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });
    const totalPhotos = existingPhotos.length + photoFiles.length;
    const remaining = MAX_PHOTOS - totalPhotos;
    const toAdd = validFiles.slice(0, remaining);
    if (validFiles.length > remaining) toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
    setPhotoFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const onSubmit = async (data: PostFormValues) => {
    if (!post || !currentUser) return;
    setIsSubmitting(true);
    try {
      // Upload new photos first
      let newPhotoPaths: string[] = [];
      if (photoFiles.length > 0) {
        const formData = new FormData();
        formData.append("postId", post.id);
        photoFiles.forEach((file) => formData.append("files", file));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          newPhotoPaths = uploadJson.data ?? [];
        }
      }

      const allPhotos = [...existingPhotos, ...newPhotoPaths];

      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, photos: allPhotos }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to update post");
      }

      toast.success(
        post.status === "published"
          ? "Post updated and re-submitted for approval"
          : "Post updated successfully"
      );
      router.push("/posts/my-posts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!post) return null;

  const canEdit = post.status === "pending" || post.status === "published";
  if (!canEdit) {
    return (
      <div className="max-w-2xl">
        <p className="text-muted-foreground">
          This post cannot be edited in its current state ({post.status}).
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/posts/my-posts")}
        >
          Back to My Posts
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl space-y-6"
    >
      {post.status === "published" && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            <span className="font-medium">Re-approval required:</span> Editing a
            published post will submit it for admin review again before it
            becomes visible.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="itemName">
            Item Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="itemName"
            maxLength={100}
            {...register("itemName")}
          />
          {errors.itemName && (
            <p className="text-xs text-destructive">{errors.itemName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <CascadingCategorySelect
            value={selectedCategoryId}
            onChange={(categoryId) => {
              setSelectedCategoryId(categoryId);
              const fullCategoryPath = categoryId
                ? findCategoryPathById(categories, categoryId) ?? [categoryId]
                : [];
              setValue("categoryPath", fullCategoryPath, { shouldValidate: true });
            }}
            placeholder="Choose category"
          />
          {categoryPath?.length ? (
            <p className="text-xs text-muted-foreground">
              Selected path: {categoryPath.join(" > ")}
            </p>
          ) : null}
          {errors.categoryPath && (
            <p className="text-xs text-destructive">{errors.categoryPath.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            maxLength={1000}
            rows={4}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateLost">
              Date Lost <span className="text-destructive">*</span>
            </Label>
            <Input id="dateLost" type="date" max={todayStr} {...register("dateLost")} />
            {errors.dateLost && (
              <p className="text-xs text-destructive">{errors.dateLost.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeLost">Time Lost (optional)</Label>
            <Input id="timeLost" type="time" {...register("timeLost")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="locationLost">
            Location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="locationLost"
            placeholder="e.g. AC1 Lecture Theatre"
            {...register("locationLost")}
          />
          {errors.locationLost && (
            <p className="text-xs text-destructive">{errors.locationLost.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Photos (max {MAX_PHOTOS})</Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {existingPhotos.map((src, i) => (
              <div
                key={`existing-${i}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-border group"
              >
                <Image src={`${src}`} alt={`Photo ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photoPreviews.map((src, i) => (
              <div
                key={`new-${i}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-border group ring-2 ring-primary/30"
              >
                <img src={src} alt={`New ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFiles((prev) => prev.filter((_, j) => j !== i));
                    setPhotoPreviews((prev) => prev.filter((_, j) => j !== i));
                  }}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {existingPhotos.length + photoFiles.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Upload className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">Add Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoAdd}
                />
              </label>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Contact Information</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contactMode"
                checked={contactMode === "default"}
                onChange={() => {
                  setContactMode("default");
                  setValue("contactInfo", { useDefault: true, email: null, phone: null });
                }}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Use default contact info</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contactMode"
                checked={contactMode === "other"}
                onChange={() => {
                  setContactMode("other");
                  setValue("contactInfo", { useDefault: false, email: "", phone: "" });
                }}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Use other contact info</span>
            </label>
          </div>
          {contactMode === "other" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pl-6">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  defaultValue={post.contactInfo.email ?? ""}
                  onChange={(e) => setValue("contactInfo.email", e.target.value || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  defaultValue={post.contactInfo.phone ?? ""}
                  onChange={(e) => setValue("contactInfo.phone", e.target.value || null)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/posts/my-posts")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
