import { Link } from "@tanstack/react-router";
import { type Listing, Status } from "../hooks/useQueries";

interface ListingCardProps {
  listing: Listing;
  index?: number;
}

export default function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const imageUrl = listing.imageUrl.getDirectURL();
  const isSelling = listing.status === Status.selling;

  return (
    <Link to="/listing/$id" params={{ id: listing.id }} className="block group">
      <article
        className="card-root overflow-hidden bg-card fade-up"
        style={{
          animationDelay: `${index * 55}ms`,
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        {/* Image + overlay */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted/30">
          <img
            src={imageUrl}
            alt={listing.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />

          {/* FIX 3: gradient overlay with metadata — replaces simple tint */}
          <div className="card-overlay z-10">
            <p className="font-display text-xs uppercase tracking-wide text-white/90 leading-tight line-clamp-2 mb-1">
              {listing.name}
            </p>
            <span className="price-stamp">${listing.price}</span>
          </div>

          {/* Selling badge — on image, top-left */}
          {isSelling && (
            <div className="absolute top-0 left-0 z-20">
              <span className="selling-pulse inline-flex items-center gap-0.5 bg-destructive text-destructive-foreground font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-1 font-bold">
                ⚡ SELLING
              </span>
            </div>
          )}

          {/* Corner registration mark — top-right */}
          <div
            className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none"
            aria-hidden="true"
          >
            <div className="w-3 h-3 border-t border-r border-primary/60" />
          </div>

          {/* Xerox artifact — bottom-left corner mark */}
          <div
            className="absolute bottom-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none select-none"
            aria-hidden="true"
          >
            <div className="w-3 h-3 border-b border-l border-primary/60" />
          </div>
        </div>

        {/* Info strip — always visible, minimal */}
        <div className="px-2.5 py-2 border-t border-border flex items-baseline justify-between gap-1">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground truncate group-hover:text-foreground transition-colors">
            {listing.name}
          </h3>
          {/* Price — small, in the strip — the overlay stamp is the hero */}
          <span className="font-mono text-[10px] text-primary/70 shrink-0 tracking-wide">
            ${listing.price}
          </span>
        </div>
      </article>
    </Link>
  );
}
