export default function SiteFooter() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(
    typeof window !== "undefined" ? window.location.hostname : "",
  );

  return (
    <footer className="border-t border-border mt-16 py-8 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-display text-lg tracking-tight text-primary/70 uppercase">
              DEAD &amp; WORN
            </span>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              UNDERGROUND VINTAGE CLOTHING
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <a
              href="https://www.tiktok.com/@whyteboyswag"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
            >
              @WHYTEBOYSWAG
            </a>
            <span className="font-mono text-[10px] text-muted-foreground">
              DM TO BUY
            </span>
          </div>

          <div className="text-center sm:text-right">
            <p className="font-mono text-[10px] text-muted-foreground">
              &copy; {year}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/60 hover:text-primary transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
