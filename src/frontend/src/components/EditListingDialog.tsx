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
import { ImagePlus, Loader2 } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { type Listing, Status, useEditListing } from "../hooks/useQueries";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const editMutation = useEditListing();

  useEffect(() => {
    if (open) {
      setName(listing.name);
      setPrice(listing.price);
      setDescription(listing.description);
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
    }
  }, [open, listing]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setUploadProgress(0);
    try {
      let imageBytes: Uint8Array | null = null;
      if (imageFile) {
        const buf = await imageFile.arrayBuffer();
        imageBytes = new Uint8Array(buf);
      }
      await editMutation.mutateAsync({
        id: listing.id,
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        imageBytes,
        existingImageUrl: imageBytes ? undefined : listing.imageUrl,
        status: listing.status,
        onProgress: setUploadProgress,
      });
      toast.success("Listing updated.");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const isSubmitting = editMutation.isPending;
  const currentImageUrl = imagePreview || listing.imageUrl.getDirectURL();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border rounded-none p-0 overflow-hidden">
        <div className="h-[2px] w-full bg-primary/40" />
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl uppercase tracking-tight text-foreground">
              EDIT LISTING
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Image */}
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                IMAGE
              </Label>
              <div className="relative border border-border bg-muted/20 aspect-[3/2] overflow-hidden">
                <img
                  src={currentImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 flex items-end justify-center pb-3 cursor-pointer group">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest bg-background/80 border border-primary/30 text-primary px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <ImagePlus size={10} />
                    CHANGE IMAGE
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
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
