"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Upload, Search, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageSearchUploadProps {
  onResults: (postIds: string[]) => void;
  onClear: () => void;
}

export function ImageSearchUpload({
  onResults,
  onClear,
}: ImageSearchUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: () => toast.error("Invalid file. Use JPEG/PNG under 5MB."),
  });

  const handleSearch = async () => {
    if (!file) return;
    setIsSearching(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/posts/search/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image search failed");

      const json = await res.json();
      const ids: string[] = json.data?.map(
        (r: { postId: string }) => r.postId
      ) ?? [];
      onResults(ids);

      if (ids.length === 0) {
        toast.info("No visually similar items found");
      }
    } catch {
      toast.error("Image search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFile(null);
    onClear();
  };

  if (preview) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          <Image src={preview} alt="Query image" fill className="object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="text-sm font-medium text-foreground">
            {file?.name}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="mr-2 h-3.5 w-3.5" />
              )}
              {isSearching ? "Searching..." : "Search by Image"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isSearching}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {isDragActive ? "Drop image here" : "Search by image"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drag and drop or click to upload (JPEG, PNG)
        </p>
      </div>
    </div>
  );
}
