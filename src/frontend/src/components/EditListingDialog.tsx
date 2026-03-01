import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { type Listing, Status, useEditListing } from "../hooks/useQueries";

interface ExistingPhoto {
  kind: "existing";
  uid: string;
  blob: ExternalBlob;
  url: string;
}

interface NewPhoto {
  kind: "new";
  uid: string;
  file: File;
  previewUrl: string;
  bytes?: Uint8Array;
}

type Photo = ExistingPhoto | NewPhoto;

interface EditListingDialogProps {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditListingDialog({
  listing,
  open,
  onOpenChange,
}: EditListingDialogProps) {
  const [name, setName] = useState(listing.name);
  const [price, setPrice] = useState(listing.price);
  const [description, setDescription] = useState(listing.description);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editMutation = useEditListing();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setName(listing.name);
      setPrice(listing.price);
      setDescription(listing.description);
      setUploadProgress(0);
      // Map existing imageUrls to ExistingPhoto entries
      const existing: ExistingPhoto[] = listing.imageUrls.map((blob, idx) => ({
        kind: "existing",
        uid: `existing-${idx}-${blob.getDirectURL().slice(-8)}`,
        blob,
        url: blob.getDirectURL(),
      }));
      setPhotos(existing);
    }
  }, [open, listing]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const p of photos) {
        if (p.kind === "new") URL.revokeObjectURL(p.previewUrl);
      }
    };
  }, [photos]);

  const handleAddImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newPhotos: NewPhoto[] = files.map((file) => ({
      kind: "new",
      uid: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so same file can be re-added
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const removed = prev[index];
      if (removed.kind === "new") URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setPhotos((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (photos.length === 0) {
      toast.error("At least one photo is required.");
      return;
    }

    setUploadProgress(0);

    try {
      // Read bytes for any new photos
      const withBytes: Photo[] = await Promise.all(
        photos.map(async (p) => {
          if (p.kind === "new" && !p.bytes) {
            const buf = await p.file.arrayBuffer();
            return { ...p, bytes: new Uint8Array(buf) } as NewPhoto;
          }
          return p;
        }),
      );

      // Build final ExternalBlob array
      let totalProgressSum = 0;
      const newPhotos = withBytes.filter((p) => p.kind === "new");
      const newCount = newPhotos.length;

      const imageUrls: ExternalBlob[] = withBytes.map((p) => {
        if (p.kind === "existing") return p.blob;
        let blob = ExternalBlob.fromBytes(
          (p as NewPhoto).bytes! as Uint8Array<ArrayBuffer>,
        );
        blob = blob.withUploadProgress((pct) => {
          totalProgressSum += pct;
          const overall =
            newCount === 0 ? 100 : Math.round(totalProgressSum / newCount);
          setUploadProgress(Math.min(overall, 99));
        });
        return blob;
      });

      await editMutation.mutateAsync({
        id: listing.id,
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        imageUrls,
        status: listing.status,
      });

      setUploadProgress(100);
      toast.success("Listing updated.");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const isSubmitting = editMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border rounded-none p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="h-[2px] w-full bg-primary/40 sticky top-0 z-10" />
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-tight text-foreground">
              EDIT LISTING
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Photos grid */}
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                PHOTOS ({photos.length})
              </Label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, i) => (
                    <div
                      key={photo.uid}
                      className="relative group border border-border bg-muted/20 overflow-hidden aspect-square"
                    >
                      <img
                        src={
                          photo.kind === "existing"
                            ? photo.url
                            : photo.previewUrl
                        }
                        alt={`Item view ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-background/90 border border-destructive/60 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                        aria-label="Remove photo"
                      >
                        <X size={10} />
                      </button>
                      {/* Reorder buttons */}
                      <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => movePhoto(i, -1)}
                          disabled={i === 0}
                          className="w-5 h-5 bg-background/90 border border-border text-muted-foreground flex items-center justify-center disabled:opacity-30 hover:text-foreground"
                          aria-label="Move left"
                        >
                          <ArrowLeft size={9} />
                        </button>
                        <span className="font-mono text-[8px] text-muted-foreground/60 self-center">
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => movePhoto(i, 1)}
                          disabled={i === photos.length - 1}
                          className="w-5 h-5 bg-background/90 border border-border text-muted-foreground flex items-center justify-center disabled:opacity-30 hover:text-foreground"
                          aria-label="Move right"
                        >
                          <ArrowRight size={9} />
                        </button>
                      </div>
                      {/* Index badge */}
                      {i === 0 && (
                        <div className="absolute top-1 left-1 font-mono text-[8px] bg-primary text-primary-foreground px-1 pointer-events-none">
                          MAIN
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add more photos button */}
              <label className="flex items-center justify-center gap-2 border border-dashed border-primary/30 bg-muted/10 h-10 cursor-pointer hover:bg-primary/5 transition-colors group">
                <ImagePlus
                  size={12}
                  className="text-primary/50 group-hover:text-primary/80"
                />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  ADD PHOTOS
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAddImages}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                NAME
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-input border-border text-foreground font-sans text-sm rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                PRICE
              </Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="e.g. 25.00"
                className="bg-input border-border text-foreground font-sans text-sm rounded-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                DESCRIPTION
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="bg-input border-border text-foreground font-sans text-sm rounded-none resize-none"
              />
            </div>

            {/* Upload progress */}
            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  UPLOADING... {uploadProgress}%
                </p>
                <Progress value={uploadProgress} className="h-1 rounded-none" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1 font-mono text-xs uppercase tracking-wide border-border text-muted-foreground hover:text-foreground rounded-none"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
              >
                {isSubmitting ? (
                  <Loader2 size={12} className="animate-spin mr-1.5" />
                ) : null}
                {isSubmitting ? "SAVING..." : "SAVE"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
