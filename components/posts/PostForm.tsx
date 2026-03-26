"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CascadingCategorySelect } from "@/components/search/CascadingCategorySelect";
import { createPostSchema } from "@/lib/validators";
import type { Category } from "@/types";

type PostFormValues = z.infer<typeof createPostSchema>;

interface PostFormProps {
  defaultContact: { email: string; phone: string };
  onSuccess: () => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PostForm({ defaultContact, onSuccess }: PostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactMode, setContactMode] = useState<"default" | "other">("default");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      itemName: "",
      categoryPath: [],
      description: "",
      dateLost: "",
      timeLost: null,
      locationLost: "",
      contactInfo: {
        useDefault: true,
        email: null,
        phone: null,
      },
    },
  });

  const categoryPath = watch("categoryPath");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.data ?? json.categories ?? []))
      .catch(() => {});
  }, []);

  function findCategoryPathById(
    tree: Category[],
    targetId: string,
    path: string[] = []
  ): string[] | null {
    for (const category of tree) {
      const nextPath = [...path, category.id];
      if (category.id === targetId) return nextPath;
      const childPath = findCategoryPathById(category.children, targetId, nextPath);
      if (childPath) return childPath;
    }
    return null;
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported image format`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds the 5MB limit`);
        return false;
      }
      return true;
    });

    const remaining = MAX_PHOTOS - photoFiles.length;
    const toAdd = validFiles.slice(0, remaining);

    if (validFiles.length > remaining) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
    }

    setPhotoFiles((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handlePhotoRemove = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PostFormValues) => {
    setIsSubmitting(true);
    try {
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!postResponse.ok) {
        const result = await postResponse.json();
        throw new Error(result.error ?? "Failed to create post");
      }

      const { data: post } = await postResponse.json();

      if (photoFiles.length > 0) {
        const formData = new FormData();
        formData.append("postId", post.id);
        photoFiles.forEach((file) => formData.append("files", file));

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          const paths: string[] = uploadResult.data ?? [];
          if (paths.length > 0) {
            await fetch(`/api/posts/${post.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photos: paths }),
            });
          }
        } else {
          toast.error("Post created but photo upload failed");
        }
      }

      toast.success("Your post has been submitted for review");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="itemName">
          Item Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="itemName"
          placeholder="e.g. iPhone 15 Pro, Blue Backpack"
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
            const fullPath = categoryId
              ? findCategoryPathById(categories, categoryId) ?? [categoryId]
              : [];
            setValue("categoryPath", fullPath, { shouldValidate: true });
          }}
          placeholder="Choose category"
        />
        {categoryPath?.length ? (
          <p className="text-xs text-muted-foreground">
            Selected path: {categoryPath.join(" > ")}
          </p>
        ) : null}
        {errors.categoryPath && (
          <p className="text-xs text-destructive">
            {errors.categoryPath.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the item in detail — color, size, distinguishing features..."
          maxLength={1000}
          rows={4}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateLost">
            Date Lost <span className="text-destructive">*</span>
          </Label>
          <Input
            id="dateLost"
            type="date"
            max={todayStr}
            {...register("dateLost")}
          />
          {errors.dateLost && (
            <p className="text-xs text-destructive">
              {errors.dateLost.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeLost">Time Lost (optional)</Label>
          <Input
            id="timeLost"
            type="time"
            {...register("timeLost")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationLost">
          Location <span className="text-destructive">*</span>
        </Label>
        <Input
          id="locationLost"
          placeholder="e.g. AC1 Lecture Theatre, Library 3/F"
          {...register("locationLost")}
        />
        {errors.locationLost && (
          <p className="text-xs text-destructive">
            {errors.locationLost.message}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Photos (max {MAX_PHOTOS})</Label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photoPreviews.map((src, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <Image
                src={src}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handlePhotoRemove(index)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photoFiles.length < MAX_PHOTOS && (
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
              value="default"
              checked={contactMode === "default"}
              onChange={() => {
                setContactMode("default");
                setValue("contactInfo", {
                  useDefault: true,
                  email: null,
                  phone: null,
                });
              }}
              className="h-4 w-4 text-primary accent-primary"
            />
            <span className="text-sm">
              Use default contact ({defaultContact.email})
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="contactMode"
              value="other"
              checked={contactMode === "other"}
              onChange={() => {
                setContactMode("other");
                setValue("contactInfo", {
                  useDefault: false,
                  email: "",
                  phone: "",
                });
              }}
              className="h-4 w-4 text-primary accent-primary"
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
                placeholder="your@email.com"
                onChange={(e) =>
                  setValue("contactInfo.email", e.target.value || null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+852 1234 5678"
                onChange={(e) =>
                  setValue("contactInfo.phone", e.target.value || null)
                }
              />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Post
      </Button>
    </form>
  );
}
