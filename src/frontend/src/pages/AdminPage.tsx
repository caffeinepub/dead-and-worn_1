import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  FileJson,
  ImagePlus,
  Loader2,
  Plus,
  Tag,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import EditListingDialog from "../components/EditListingDialog";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import {
  type BackupData,
  type Drop,
  type Listing,
  Status,
  useAddListing,
  useCreateDrop,
  useDeleteDrop,
  useDeleteListing,
  useEditDrop,
  useExportData,
  useGetAllDrops,
  useGetAllListings,
  useImportData,
  useSetListingStatus,
} from "../hooks/useQueries";

// ============================================================
// Countdown helper
// ============================================================

function getCountdownParts(scheduledAt: bigint): {
  d: number;
  h: number;
  m: number;
  s: number;
  past: boolean;
} {
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  if (scheduledAt <= nowSec) return { d: 0, h: 0, m: 0, s: 0, past: true };
  const diff = Number(scheduledAt - nowSec);
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return { d, h, m, s, past: false };
}

// ============================================================
// Add Listing Form — multi-photo
// ============================================================

interface ImageEntry {
  uid: string;
  file: File;
  previewUrl: string;
}

function AddListingForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMutation = useAddListing();

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      for (const img of images) URL.revokeObjectURL(img.previewUrl);
    };
  }, [images]);

  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newEntries: ImageEntry[] = files.map((file) => ({
      uid: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    for (const img of images) URL.revokeObjectURL(img.previewUrl);
    setImages([]);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error("Please select at least one image.");
      return;
    }
    if (!name.trim() || !price.trim() || !description.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setUploadProgress(0);
    try {
      // Read all bytes in parallel
      const byteArrays = await Promise.all(
        images.map(async (img) => {
          const buf = await img.file.arrayBuffer();
          return new Uint8Array(buf);
        }),
      );

      const totalFiles = byteArrays.length;
      let uploadedCount = 0;

      const imageFiles = byteArrays.map((bytes, _i) => ({
        bytes,
        onProgress: (pct: number) => {
          const overall = Math.round(
            ((uploadedCount + pct / 100) / totalFiles) * 100,
          );
          setUploadProgress(Math.min(overall, 99));
          if (pct >= 100) uploadedCount++;
        },
      }));

      await addMutation.mutateAsync({
        name: name.trim(),
        price: price.trim(),
        description: description.trim(),
        imageFiles,
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
          {/* Multi-image upload */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              PHOTOS * ({images.length} selected)
            </Label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <div
                    key={img.uid}
                    className="relative group border border-border bg-muted/20 overflow-hidden aspect-square"
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-background/90 border border-destructive/60 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <X size={9} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 font-mono text-[7px] bg-primary/90 text-primary-foreground text-center py-0.5 pointer-events-none">
                        MAIN
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center border border-dashed border-primary/30 bg-muted/10 h-16 cursor-pointer hover:bg-primary/5 transition-colors group">
              <ImagePlus
                size={18}
                className="text-primary/40 group-hover:text-primary/70 transition-colors mb-1"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {images.length === 0
                  ? "CLICK TO ADD PHOTOS"
                  : "ADD MORE PHOTOS"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />
            </label>
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

  const thumbnailUrl = listing.imageUrls[0]?.getDirectURL() ?? "";

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
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={listing.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                <span className="font-mono text-[8px] text-muted-foreground">
                  IMG
                </span>
              </div>
            )}
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
            {listing.imageUrls.length > 1 && (
              <span className="font-mono text-[8px] text-muted-foreground/50">
                {listing.imageUrls.length} photos
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
// Drop Form (create / edit)
// ============================================================

interface DropFormProps {
  initial?: Drop;
  allListings: Listing[];
  onDone: () => void;
}

function DropForm({ initial, allListings, onDone }: DropFormProps) {
  const createMutation = useCreateDrop();
  const editMutation = useEditDrop();

  const toDateTimeLocal = (scheduledAt: bigint): string => {
    const ms = Number(scheduledAt) * 1000;
    const d = new Date(ms);
    // Format: "YYYY-MM-DDTHH:MM"
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [dropName, setDropName] = useState(initial?.name ?? "");
  const [dateTime, setDateTime] = useState(
    initial ? toDateTimeLocal(initial.scheduledAt) : "",
  );
  const [selectedListingIds, setSelectedListingIds] = useState<Set<string>>(
    new Set(initial?.listingIds ?? []),
  );

  const toggleListing = (id: string) => {
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropName.trim()) {
      toast.error("Drop name is required.");
      return;
    }
    if (!dateTime) {
      toast.error("Please set a drop date and time.");
      return;
    }
    if (selectedListingIds.size === 0) {
      toast.error("Select at least one listing for the drop.");
      return;
    }

    const scheduledAt = BigInt(Math.floor(new Date(dateTime).getTime() / 1000));

    try {
      if (initial) {
        await editMutation.mutateAsync({
          id: initial.id,
          name: dropName.trim(),
          scheduledAt,
          listingIds: Array.from(selectedListingIds),
        });
        toast.success("Drop updated.");
      } else {
        await createMutation.mutateAsync({
          name: dropName.trim(),
          scheduledAt,
          listingIds: Array.from(selectedListingIds),
        });
        toast.success("Drop created.");
      }
      onDone();
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const isSaving = createMutation.isPending || editMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border border-border bg-card"
    >
      <div className="h-[2px] w-full bg-primary/30 -mt-4 -mx-4 mb-4 w-[calc(100%+2rem)]" />

      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          DROP NAME *
        </Label>
        <Input
          value={dropName}
          onChange={(e) => setDropName(e.target.value)}
          required
          placeholder="e.g. Summer Grunge Drop"
          className="bg-input border-border text-foreground font-sans text-sm rounded-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          DROP DATE &amp; TIME *
        </Label>
        <Input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
          className="bg-input border-border text-foreground font-sans text-sm rounded-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ASSIGN LISTINGS *
        </Label>
        {allListings.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground/40">
            NO LISTINGS AVAILABLE
          </p>
        ) : (
          <div className="border border-border divide-y divide-border max-h-48 overflow-y-auto">
            {allListings.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20"
              >
                <Checkbox
                  id={`listing-check-${l.id}`}
                  checked={selectedListingIds.has(l.id)}
                  onCheckedChange={() => toggleListing(l.id)}
                  className="rounded-none border-border"
                />
                <label
                  htmlFor={`listing-check-${l.id}`}
                  className="font-mono text-xs text-foreground truncate cursor-pointer flex-1"
                >
                  {l.name}
                </label>
                <span className="font-mono text-[10px] text-muted-foreground ml-auto shrink-0">
                  ${l.price}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={isSaving}
          className="flex-1 font-mono text-xs uppercase tracking-wide border-border text-muted-foreground hover:text-foreground rounded-none"
        >
          CANCEL
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="flex-1 font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
        >
          {isSaving ? (
            <Loader2 size={12} className="animate-spin mr-1.5" />
          ) : null}
          {isSaving ? "SAVING..." : initial ? "UPDATE DROP" : "CREATE DROP"}
        </Button>
      </div>
    </form>
  );
}

// ============================================================
// Drop Row
// ============================================================

function DropRow({
  drop,
  allListings,
}: {
  drop: Drop;
  allListings: Listing[];
}) {
  const deleteMutation = useDeleteDrop();
  const [editing, setEditing] = useState(false);
  const { d, h, m, s, past } = getCountdownParts(drop.scheduledAt);

  const assignedListings = allListings.filter((l) =>
    drop.listingIds.includes(l.id),
  );

  const handleDelete = async () => {
    if (!window.confirm(`Delete drop "${drop.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(drop.id);
      toast.success("Drop deleted.");
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  if (editing) {
    return (
      <DropForm
        initial={drop}
        allListings={allListings}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={12} className="text-primary shrink-0" />
            <span className="font-display text-sm uppercase tracking-tight text-foreground">
              {drop.name}
            </span>
          </div>
          {past ? (
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary px-1.5 py-0.5 border border-primary/30 bg-primary/10">
              DROPPED
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {d > 0 ? `${d}D ` : ""}
              {h > 0 || d > 0 ? `${h}H ` : ""}
              {m > 0 || h > 0 || d > 0 ? `${m}M ` : ""}
              {s}S
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-none"
            title="Edit drop"
          >
            <Edit2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/20 rounded-none"
            title="Delete drop"
          >
            {deleteMutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
          </Button>
        </div>
      </div>

      {/* Assigned listings */}
      <div className="flex flex-wrap gap-1.5">
        {assignedListings.length === 0 ? (
          <span className="font-mono text-[9px] text-muted-foreground/40">
            NO LISTINGS ASSIGNED
          </span>
        ) : (
          assignedListings.map((l) => (
            <span
              key={l.id}
              className="font-mono text-[9px] bg-muted/30 border border-border px-2 py-0.5 text-muted-foreground uppercase"
            >
              {l.name}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// Drops Section
// ============================================================

function DropsSection({ allListings }: { allListings: Listing[] }) {
  const { data: drops, isLoading } = useGetAllDrops();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      {/* Create drop button */}
      {!creating && (
        <Button
          onClick={() => setCreating(true)}
          className="font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-9 px-5"
        >
          <Calendar size={12} className="mr-1.5" />
          CREATE DROP
        </Button>
      )}

      {creating && (
        <DropForm allListings={allListings} onDone={() => setCreating(false)} />
      )}

      {/* Drops list */}
      {isLoading ? (
        <div className="space-y-3">
          {(["d1", "d2"] as const).map((key) => (
            <div key={key} className="border border-border p-4">
              <Skeleton className="h-4 w-32 bg-muted/40 mb-2" />
              <Skeleton className="h-3 w-24 bg-muted/40" />
            </div>
          ))}
        </div>
      ) : !drops || drops.length === 0 ? (
        <div className="border border-dashed border-primary/20 py-12 text-center">
          <p className="font-mono text-xs text-muted-foreground/40 uppercase tracking-widest">
            NO DROPS SCHEDULED
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/25 mt-1 uppercase tracking-widest">
            CREATE A DROP TO SCHEDULE A REVEAL
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drops
            .slice()
            .sort((a, b) => Number(a.scheduledAt - b.scheduledAt))
            .map((drop) => (
              <DropRow key={drop.id} drop={drop} allListings={allListings} />
            ))}
        </div>
      )}

      {/* Info box */}
      <div className="border border-border/40 p-4 bg-muted/10">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-2">
          HOW DROPS WORK
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed">
          Assign listings to a drop. They stay hidden from the public until the
          countdown hits zero — then they all appear at once. A "NEXT DROP IN"
          banner shows on the homepage.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Backup Section
// ============================================================

function BackupSection() {
  const exportMutation = useExportData();
  const importMutation = useImportData();

  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportMutation.mutateAsync();

      // Serialize: convert bigint scheduledAt to string
      const serializable = {
        listings: data.listings,
        drops: data.drops.map((d) => ({
          ...d,
          scheduledAt: d.scheduledAt.toString(),
        })),
      };

      const json = JSON.stringify(serializable, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dead-and-worn-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded!");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      const raw = JSON.parse(text) as {
        listings: BackupData["listings"];
        drops: Array<
          Omit<BackupData["drops"][number], "scheduledAt"> & {
            scheduledAt: string;
          }
        >;
      };

      // Deserialize: convert scheduledAt strings back to bigint
      const data: BackupData = {
        listings: raw.listings,
        drops: raw.drops.map((d) => ({
          ...d,
          scheduledAt: BigInt(d.scheduledAt),
        })),
      };

      await importMutation.mutateAsync(data);
      toast.success("Backup restored successfully!");
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Import failed. Check that the file is a valid backup.");
    }
  };

  const isExporting = exportMutation.isPending;
  const isImporting = importMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="border border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/10">
          <Download size={12} className="text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground">
            EXPORT DATA
          </span>
        </div>
        <div className="p-4 space-y-4">
          <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
            Download all your listings and drops as a JSON file. Photos are not
            included — re-upload them manually after importing.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-9 px-5"
          >
            {isExporting ? (
              <>
                <Loader2 size={12} className="animate-spin mr-1.5" />
                EXPORTING...
              </>
            ) : (
              <>
                <Download size={12} className="mr-1.5" />
                EXPORT BACKUP
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Import */}
      <div className="border border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/10">
          <Upload size={12} className="text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground">
            IMPORT DATA
          </span>
        </div>
        <div className="p-4 space-y-4">
          <p className="font-mono text-[10px] text-muted-foreground/70 leading-relaxed">
            Upload a previously exported backup file to restore your listings
            and drops. Existing listings with matching IDs will have their text
            data updated. Photos must be re-uploaded manually.
          </p>

          {/* File drop zone */}
          <label className="flex flex-col items-center justify-center border border-dashed border-primary/30 bg-muted/10 h-20 cursor-pointer hover:bg-primary/5 transition-colors group">
            <FileJson
              size={18}
              className="text-primary/40 group-hover:text-primary/70 transition-colors mb-1"
            />
            {importFile ? (
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                {importFile.name}
              </span>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                CLICK TO SELECT .JSON FILE
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <Button
            onClick={handleImport}
            disabled={!importFile || isImporting}
            className="font-mono text-xs uppercase tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 rounded-none h-9 px-5"
          >
            {isImporting ? (
              <>
                <Loader2 size={12} className="animate-spin mr-1.5" />
                IMPORTING...
              </>
            ) : (
              <>
                <Upload size={12} className="mr-1.5" />
                IMPORT BACKUP
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="border border-border/40 p-4 bg-muted/10">
        <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-2">
          HOW BACKUP WORKS
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/50 leading-relaxed">
          Before updating to a new version: hit Export to save your data. After
          the new version is live: use Import to restore everything. Re-upload
          photos from the admin listings tab.
        </p>
      </div>
    </div>
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

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-muted/20 border border-border rounded-none h-auto p-0">
            <TabsTrigger
              value="listings"
              className="font-mono text-xs uppercase tracking-widest rounded-none px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              LISTINGS
            </TabsTrigger>
            <TabsTrigger
              value="drops"
              className="font-mono text-xs uppercase tracking-widest rounded-none px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              DROPS
            </TabsTrigger>
            <TabsTrigger
              value="backup"
              className="font-mono text-xs uppercase tracking-widest rounded-none px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              BACKUP
            </TabsTrigger>
          </TabsList>

          {/* Listings tab */}
          <TabsContent value="listings" className="space-y-8 mt-0">
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

            {/* Status legend */}
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
          </TabsContent>

          {/* Drops tab */}
          <TabsContent value="drops" className="mt-0">
            <DropsSection allListings={listings ?? []} />
          </TabsContent>

          {/* Backup tab */}
          <TabsContent value="backup" className="mt-0">
            <BackupSection />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
