import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import { useGetAllDrops, useGetAllListings } from "../hooks/useQueries";

// ============================================================
// Next Drop Countdown Banner
// ============================================================

function NextDropBanner() {
  const { data: drops } = useGetAllDrops();
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      setNow(BigInt(Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!drops || drops.length === 0) return null;

  // Find nearest future drop
  const futureDrops = drops.filter((d) => d.scheduledAt > now);
  if (futureDrops.length === 0) return null;

  const next = futureDrops.reduce((a, b) =>
    a.scheduledAt < b.scheduledAt ? a : b,
  );

  const diff = Number(next.scheduledAt - now);
  if (diff <= 0) return null;

  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}D`);
  if (h > 0 || d > 0) parts.push(`${pad(h)}H`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${pad(m)}M`);
  parts.push(`${pad(s)}S`);

  return (
    <div
      className="relative border-y border-primary/40 bg-primary/5 overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 0.06) 2px, oklch(0 0 0 / 0.06) 4px)",
        }}
      />

      {/* Pulse dot */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary/60 shrink-0">
          NEXT DROP IN —
        </span>
        <div className="flex items-center gap-3">
          {parts.map((part) => (
            <span
              key={part}
              className="font-mono text-lg sm:text-xl font-bold text-foreground tracking-[0.08em] tabular-nums"
              style={{
                textShadow: "0 0 12px oklch(0.83 0.23 142 / 0.4)",
              }}
            >
              {part}
            </span>
          ))}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 sm:ml-auto">
          {next.name}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Home Page
// ============================================================

export default function HomePage() {
  const { data: listings, isLoading } = useGetAllListings();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* ── Broken-grid zine hero ── */}
      <section className="relative border-b border-border overflow-hidden scanlines">
        {/* Bleed grid lines — zine print guides */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.83 0.23 142 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.83 0.23 142 / 0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Vertical slash accent — left edge */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/50"
          aria-hidden="true"
        />

        {/* Oversized ghost text behind everything */}
        <div
          className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none"
          aria-hidden="true"
        >
          <span
            className="font-display text-[22vw] uppercase leading-none tracking-tighter"
            style={{
              color: "oklch(0.83 0.23 142 / 0.025)",
              transform: "translateY(10%) translateX(-2%)",
              whiteSpace: "nowrap",
            }}
          >
            DEAD&amp;WORN
          </span>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-12 sm:py-20">
          {/* Sub-label row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-primary/60" />
            <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-primary/55">
              EST. 2024 &#47;&#47; UNDERGROUND VINTAGE &#47;&#47; DM TO BUY
            </span>
          </div>

          {/* Main title — intentionally oversized */}
          <div className="relative">
            {/* Mis-registration ghost */}
            <div
              className="absolute font-display uppercase leading-[0.86] tracking-[-0.03em] select-none pointer-events-none"
              aria-hidden="true"
              style={{
                fontSize: "clamp(4rem, 14vw, 11rem)",
                color: "oklch(0.83 0.23 142 / 0.08)",
                top: "3px",
                left: "3px",
              }}
            >
              DEAD
              <br />
              <span style={{ color: "oklch(0.53 0.24 26 / 0.15)" }}>&amp;</span>
              <span
                className="hero-worn"
                style={{ color: "oklch(0.83 0.23 142 / 0.08)" }}
              >
                WORN
              </span>
            </div>

            {/* Real title */}
            <h1
              className="font-display uppercase leading-[0.86] tracking-[-0.03em] relative z-10"
              style={{ fontSize: "clamp(4rem, 14vw, 11rem)" }}
            >
              <span className="text-foreground glitch">DEAD</span>
              <br />
              <span className="text-primary green-glow">&amp;</span>
              <span className="hero-worn text-foreground/90">WORN</span>
            </h1>
          </div>

          {/* Xerox divider */}
          <div
            className="xerox-rule mt-6 mb-5 mr-auto"
            style={{ width: "min(340px, 80%)" }}
          />

          {/* Blurb + TikTok inline */}
          <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-xs">
            Curated secondhand &amp; vintage alternative clothing.{" "}
            <a
              href="https://www.tiktok.com/@whyteboyswag"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-mono tracking-wide transition-colors"
            >
              @whyteboyswag
            </a>{" "}
            on TikTok — DM to buy.
          </p>

          {/* Floating price/style tag — broken grid element */}
          <div
            className="absolute hidden lg:flex flex-col items-end gap-1 pointer-events-none select-none"
            aria-hidden="true"
            style={{ right: "6%", bottom: "14%" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary/30">
              NO RESTOCKS
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary/20">
              ALL ONE-OF-ONE
            </span>
            <div className="w-16 h-px bg-primary/20 mt-1" />
          </div>
        </div>
      </section>

      {/* ── Next Drop Banner ── */}
      <NextDropBanner />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1.5 h-1.5 bg-primary"
              style={{
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              ALL LISTINGS
            </span>
          </div>
          {listings && listings.length > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground/40 tracking-wider">
              {listings.length} piece{listings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(
              [
                "s1",
                "s2",
                "s3",
                "s4",
                "s5",
                "s6",
                "s7",
                "s8",
                "s9",
                "s10",
              ] as const
            ).map((key) => (
              <div key={key} className="border border-border">
                <Skeleton className="aspect-[3/4] w-full bg-muted/40" />
                <div className="p-3 border-t border-border space-y-2">
                  <Skeleton className="h-3 w-3/4 bg-muted/40" />
                  <Skeleton className="h-3 w-1/3 bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : !listings || listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center dashed-border">
            <p className="font-display text-4xl uppercase text-muted-foreground/20 tracking-tighter">
              NOTHING YET
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/25 mt-2 uppercase tracking-[0.25em]">
              CHECK BACK SOON
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
