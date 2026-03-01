import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Edit2,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../App";
import EditListingDialog from "../components/EditListingDialog";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import {
  Status,
  useDeleteListing,
  useGetListing,
  useSetListingStatus,
} from "../hooks/useQueries";

// ============================================================
// Image Gallery
// ============================================================

function ImageGallery({ urls, name }: { urls: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const count = urls.length;

  if (count === 0) {
    return (
      <div className="border border-border bg-muted/20 aspect-[3/4] flex items-center justify-center">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          NO IMAGE
        </span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative border border-border overflow-hidden bg-muted/20">
        <img
          src={urls[current]}
          alt={`${name} — view ${current + 1} of ${count}`}
          className="w-full object-cover"
          style={{ maxHeight: "70vh" }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/40 pointer-events-none" />

        {/* Navigation arrows — only if more than 1 image */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 border border-border/60 text-foreground flex items-center justify-center hover:bg-background hover:border-primary/50 transition-all backdrop-blur-sm"
              aria-label="Previous photo"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 border border-border/60 text-foreground flex items-center justify-center hover:bg-background hover:border-primary/50 transition-all backdrop-blur-sm"
              aria-label="Next photo"
            >
              <ArrowRight size={14} />
            </button>

            {/* Counter badge */}
            <div className="absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-widest bg-background/80 border border-border/60 px-2 py-0.5 backdrop-blur-sm text-muted-foreground">
              {current + 1} / {count}
            </div>
          </>
        )}
      </div>

      {/* Dots + thumbnail strip — only if more than 1 image */}
      {count > 1 && (
        <>
          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5">
            {urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to view ${i + 1}`}
                className={`transition-all duration-200 ${
                  i === current
                    ? "w-4 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-border hover:bg-primary/50"
                }`}
              />
            ))}
          </div>

          {/* Thumbnail row */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {urls.map((url, i) => (
              <button
                key={`thumb-${url}`}
                type="button"
                onClick={() => setCurrent(i)}
                className={`shrink-0 w-14 h-14 border overflow-hidden transition-all duration-150 ${
                  i === current
                    ? "border-primary/60 ring-1 ring-primary/30"
                    : "border-border opacity-60 hover:opacity-100 hover:border-primary/30"
                }`}
                aria-label={`View ${i + 1}`}
              >
                <img
                  src={url}
                  alt={`View ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Listing Page
// ============================================================

export default function ListingPage() {
  const { id } = useParams({ from: "/listing/$id" });
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: listing, isLoading } = useGetListing(id);
  const deleteMutation = useDeleteListing();
  const statusMutation = useSetListingStatus();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Remove this listing?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Listing removed.");
      navigate({ to: "/" });
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const handleToggleStatus = async () => {
    if (!listing) return;
    const newStatus =
      listing.status === Status.selling ? Status.available : Status.selling;
    try {
      await statusMutation.mutateAsync({ id, status: newStatus });
      toast.success(
        newStatus === Status.selling
          ? "Marked as SELLING."
          : "Marked as AVAILABLE.",
      );
    } catch {
      toast.error("Something went wrong, please try again.");
    }
  };

  const isSelling = listing?.status === Status.selling;
  const imageUrls = listing?.imageUrls.map((b) => b.getDirectURL()) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ChevronLeft size={12} />
          ALL LISTINGS
        </Link>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] w-full bg-muted/40" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-muted/40" />
              <Skeleton className="h-6 w-1/4 bg-muted/40" />
              <Skeleton className="h-24 w-full bg-muted/40" />
            </div>
          </div>
        ) : !listing ? (
          <div className="flex flex-col items-center justify-center py-24 text-center dashed-border">
            <p className="font-display text-4xl uppercase text-muted-foreground/30 tracking-tighter">
              NOT FOUND
            </p>
            <Link
              to="/"
              className="font-mono text-xs text-primary mt-4 uppercase tracking-widest hover:underline"
            >
              BACK TO SHOP
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery */}
            <div>
              <ImageGallery urls={imageUrls} name={listing.name} />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-4">
              {/* Status badge */}
              {isSelling && (
                <span className="selling-pulse self-start inline-flex items-center gap-1 bg-destructive text-destructive-foreground font-mono text-xs uppercase tracking-widest px-3 py-1.5 font-bold">
                  ⚡ IN THE PROCESS OF SELLING
                </span>
              )}

              <div>
                <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-tight text-foreground leading-tight">
                  {listing.name}
                </h1>
                <p className="price-tag text-2xl mt-2">${listing.price}</p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-sans text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {/* Buy CTA */}
              <div className="border border-primary/20 p-4 bg-primary/5 mt-2">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  HOW TO BUY
                </p>
                <p className="font-sans text-sm text-foreground/80 mb-3">
                  Interested? DM us on TikTok to buy.
                </p>
                <a
                  href="https://www.tiktok.com/@whyteboyswag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-mono text-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-wider border border-primary/30 px-4 py-2 hover:bg-primary/10"
                >
                  @WHYTEBOYSWAG
                </a>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="border border-primary/20 p-4 bg-primary/5 flex flex-wrap gap-2 mt-2">
                  <p className="w-full font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    ADMIN CONTROLS
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border-primary/30 text-primary hover:bg-primary/10 rounded-none"
                  >
                    <Edit2 size={12} />
                    EDIT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border-accent/40 text-accent-foreground hover:bg-accent/20 rounded-none"
                  >
                    <Tag size={12} />
                    {statusMutation.isPending
                      ? "..."
                      : isSelling
                        ? "MARK AVAILABLE"
                        : "MARK SELLING"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide rounded-none"
                  >
                    <Trash2 size={12} />
                    {deleteMutation.isPending ? "..." : "REMOVE"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit dialog */}
        {listing && (
          <EditListingDialog
            listing={listing}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
