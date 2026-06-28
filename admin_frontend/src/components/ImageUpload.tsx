"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface ImageUploadProps {
  value?: string; // Expects base64 or URL
  onChange: (base64: string) => void;
  onRemove: () => void;
  label?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label = "Upload Image",
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <div
        onClick={!value ? triggerFileInput : undefined}
        className={cn(
          "relative border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 group flex flex-col items-center justify-center min-h-[200px]",
          !value 
            ? "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer" 
            : "border-slate-200 bg-white"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {value ? (
          <div className="relative w-full h-full aspect-video md:aspect-auto md:h-[240px]">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain bg-slate-50"
            />
            {!isUploading && (
               <div 
                onClick={triggerFileInput}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
               >
                 <div className="bg-white/90 rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Upload className="h-6 w-6 text-slate-900" />
                 </div>
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <p className="text-sm font-semibold text-slate-900">
              {isUploading ? "Processing..." : "Click to upload banner"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports: PNG, JPG, JPEG (Max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
