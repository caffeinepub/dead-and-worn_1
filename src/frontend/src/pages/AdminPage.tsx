import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  ImagePlus,
  Loader2,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import EditListingDialog from "../components/EditListingDialog";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import {
  type Listing,
  Status,
  useAddListing,
  useDeleteListing,
  useGetAllListings,
  useSetListingStatus,
} from "../hooks/useQueries";

// ============================================================
// Add Listing Form
// ============================================================

function AddListingForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMutation = useAddListing();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error("Please select an image.");
      return;
    }
    if (!name.trim() || !price.trim() || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setUploadProgress(0);
    try {
      const buf = await imageFile.arrayBuffer();
      const imageBytes = new Uint8Array(buf);
      await addMutation.mutateAsync({
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        imageBytes,
        onProgress: setUploadProgress,
      });
      toast.success("Listing added successfully!");
      resetForm();
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const isSubmitting = addMutation.isPending;

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-primary" />
          <span className="font-mono text-xs uppercase tracking-widest text-foreground">
            ADD NEW LISTING
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image upload */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              IMAGE *
            </Label>
            {imagePreview ? (
              <div className="relative border border-border bg-muted/20 overflow-hidden aspect-[4/3]">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 flex items-end justify-center pb-3 cursor-pointer group">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest bg-background/80 border border-primary/30 text-primary px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <ImagePlus size={10} />
                    CHANGE
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border border-dashed border-primary/30 bg-muted/10 aspect-[4/3] cursor-pointer hover:bg-primary/5 transition-colors group">
                <ImagePlus
                  size={24}
                  className="text-primary/40 group-hover:text-primary/60 transition-colors mb-2"
                />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  CLICK TO UPLOAD IMAGE
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  required
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                NAME *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Vintage Band Tee"
                className="bg-input border-border text-foreground font-sans text-sm rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                PRICE *
              </Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="e.g. 35.00"
                className="bg-input border-border text-foreground font-sans text-sm rounded-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              DESCRIPTION *
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              placeholder="Describe the item, condition, size..."
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

          {isSubmitting && (
            <p className="font-mono text-[10px] text-primary uppercase tracking-widest animate-pulse">
              POSTING LISTING... PLEASE WAIT
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-10 px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin mr-1.5" />
                POSTING...
              </>
            ) : (
              <>
                <Plus size={12} className="mr-1.5" />
                POST LISTING
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

// ============================================================
// Listing Row
// ============================================================

function AdminListingRow({ listing }: { listing: Listing }) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteListing();
  const statusMutation = useSetListingStatus();
  const isSelling = listing.status === Status.selling;

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${listing.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(listing.id);
      toast.success("Listing removed.");
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = isSelling ? Status.available : Status.selling;
    try {
      await statusMutation.mutateAsync({ id: listing.id, status: newStatus });
      toast.success(
        newStatus === Status.selling
          ? "Marked as SELLING."
          : "Marked as AVAILABLE.",
      );
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 border-b border-border hover:bg-muted/20 transition-colors group">
        {/* Thumbnail */}
        <Link
          to="/listing/$id"
          params={{ id: listing.id }}
          className="shrink-0"
        >
          <div className="w-12 h-12 border border-border overflow-hidden bg-muted/20">
            <img
              src={listing.imageUrl.getDirectURL()}
              alt={listing.name}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/listing/$id"
              params={{ id: listing.id }}
              className="font-display text-sm uppercase tracking-tight text-foreground hover:text-primary transition-colors truncate max-w-[200px]"
            >
              {listing.name}
            </Link>
            {isSelling && (
              <span className="selling-pulse inline-flex items-center font-mono text-[9px] uppercase tracking-widest bg-destructive text-destructive-foreground px-1.5 py-0.5 font-bold shrink-0">
                ⚡ SELLING
              </span>
            )}
          </div>
          <p className="price-tag text-xs mt-0.5">${listing.price}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-none"
            title="Edit"
          >
            <Edit2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            disabled={statusMutation.isPending}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-accent-foreground hover:bg-accent/20 rounded-none"
            title={isSelling ? "Mark Available" : "Mark Selling"}
          >
            {statusMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Tag size={12} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/20 rounded-none"
            title="Delete"
          >
            {deleteMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </Button>
        </div>
      </div>

      <EditListingDialog
        listing={listing}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

// ============================================================
// Admin Page
// ============================================================

export default function AdminPage() {
  const { data: listings, isLoading } = useGetAllListings();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-1">
            &#47;&#47; ADMIN DASHBOARD &#47;&#47;
          </p>
          <h1 className="font-display text-4xl uppercase tracking-tight text-foreground">
            MANAGE SHOP
          </h1>
        </div>

        <div className="space-y-8">
          {/* Add form */}
          <AddListingForm />

          {/* Listings management */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                ALL LISTINGS
              </span>
              {listings && (
                <span className="font-mono text-xs text-muted-foreground/40">
                  ({listings.length})
                </span>
              )}
            </div>

            <div className="border border-border bg-card">
              {/* Legend */}
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-muted/20">
                <div className="w-12 shrink-0" />
                <span className="flex-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                  ITEM
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 shrink-0">
                  ACTIONS
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-0">
                  {(["r1", "r2", "r3", "r4", "r5"] as const).map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 border-b border-border"
                    >
                      <Skeleton className="w-12 h-12 bg-muted/40 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-32 bg-muted/40" />
                        <Skeleton className="h-3 w-12 bg-muted/40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !listings || listings.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-mono text-xs text-muted-foreground/40 uppercase tracking-widest">
                    NO LISTINGS YET
                  </p>
                </div>
              ) : (
                <div>
                  {listings.map((listing) => (
                    <AdminListingRow key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend for status */}
          <div className="border border-border/40 p-4 bg-muted/10">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-2">
              STATUS GUIDE
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Tag size={10} className="text-muted-foreground" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  Toggle SELLING status on any listing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex font-mono text-[9px] bg-destructive text-destructive-foreground px-1.5 py-0.5">
                  ⚡ SELLING
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  = currently in the process of selling
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
