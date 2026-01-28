import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type ImageItem,
} from "@/lib/images";
import { cn } from "@/lib/utils";
import { X, Upload, Link as LinkIcon } from "lucide-react";

const MAX_IMAGES = 10;

interface ImageUploadProps {
  value: ImageItem[];
  onChange: (value: ImageItem[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
}: ImageUploadProps) {
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addUrl = useCallback(() => {
    setError(null);
    const raw = urlInput.trim();
    if (!raw) return;
    try {
      new URL(raw);
    } catch {
      setError("Please enter a valid URL");
      return;
    }
    if (value.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images per meal`);
      return;
    }
    const id = -(value.length + 1);
    onChange([...value, { type: "url", id, url: raw }]);
    setUrlInput("");
  }, [urlInput, value, onChange]);

  const addFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (!files.length) return;
      const space = MAX_IMAGES - value.length;
      if (space <= 0) {
        setError(`Maximum ${MAX_IMAGES} images per meal`);
        return;
      }
      const toProcess: { f: File; i: number }[] = [];
      for (let i = 0; i < Math.min(files.length, space); i++) {
        const f = files[i]!;
        if (!ALLOWED_IMAGE_TYPES.includes(f.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
          setError("Only JPEG, PNG, WebP, GIF allowed");
          return;
        }
        if (f.size > MAX_IMAGE_BYTES) {
          setError("Max 5MB per image");
          return;
        }
        toProcess.push({ f, i });
      }
      const add: ImageItem[] = [];
      await Promise.all(
        toProcess.map(
          ({ f, i }) =>
            new Promise<void>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => {
                const data = (r.result as string).split(",")[1];
                add.push({
                  type: "base64",
                  id: -(value.length + 100 + i),
                  data: data ?? "",
                  mimeType: f.type,
                });
                resolve();
              };
              r.onerror = () => reject(r.error);
              r.readAsDataURL(f);
            })
        )
      );
      add.sort((a, b) => a.id - b.id);
      onChange([...value, ...add]);
    },
    [value, onChange]
  );

  const remove = useCallback(
    (id: number) => {
      onChange(value.filter((img) => img.id !== id));
      setError(null);
    },
    [value, onChange]
  );

  return (
    <div className={cn("space-y-3", className)}>
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="size-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <LinkIcon className="size-4" />
            URL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-2">
          <Label>Choose images (JPEG, PNG, WebP, GIF, max 5MB each)</Label>
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            multiple
            onChange={addFile}
            disabled={disabled || value.length >= MAX_IMAGES}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          />
        </TabsContent>
        <TabsContent value="url" className="space-y-2">
          <Label>Paste image URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              disabled={disabled || value.length >= MAX_IMAGES}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addUrl}
              disabled={disabled || !urlInput.trim() || value.length >= MAX_IMAGES}
            >
              Add
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {value.map((img) => {
            const src =
              img.type === "url"
                ? img.url
                : `data:${img.mimeType ?? "image/png"};base64,${img.data}`;
            return (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                  {img.type === "url" ? "URL" : "Upload"}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => remove(img.id)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
