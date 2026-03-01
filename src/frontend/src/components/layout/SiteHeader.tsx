import { Link, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, Settings } from "lucide-react";
import { useAuth } from "../../App";

export default function SiteHeader() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <header className="relative border-b border-border sticky top-0 z-50 bg-background/96 backdrop-blur-sm">
      {/* Top marquee strip — slightly thicker, more presence */}
      <div
        className="w-full overflow-hidden py-1 border-b"
        style={{
          background: "oklch(0.83 0.23 142 / 0.08)",
          borderColor: "oklch(0.83 0.23 142 / 0.18)",
        }}
      >
        <div className="flex whitespace-nowrap marquee-track">
          {(["a", "b", "c", "d", "e", "f", "g", "h"] as const).map((key) => (
            <span
              key={key}
              className="font-mono uppercase px-5"
              style={{
                fontSize: "9px",
                letterSpacing: "0.28em",
                color: "oklch(0.83 0.23 142 / 0.55)",
              }}
            >
              ✦&nbsp;DEAD AND WORN&nbsp;✦&nbsp;UNDERGROUND
              VINTAGE&nbsp;✦&nbsp;DM TO
              BUY&nbsp;✦&nbsp;@WHYTEBOYSWAG&nbsp;✦&nbsp;NO RESTOCKS
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            {/* Left accent bar */}
            <div
              className="hidden sm:block w-[3px] h-7 self-center"
              style={{ background: "oklch(0.83 0.23 142 / 0.6)" }}
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span
                className="font-display uppercase leading-none glitch"
                style={{
                  fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                  letterSpacing: "-0.025em",
                  color: "oklch(0.83 0.23 142)",
                }}
              >
                DEAD &amp; WORN
              </span>
              <span
                className="font-mono uppercase hidden sm:block"
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  color: "oklch(0.50 0.014 168)",
                  marginTop: "1px",
                }}
              >
                UNDERGROUND VINTAGE
              </span>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="font-mono uppercase transition-colors"
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "oklch(0.50 0.014 168)",
              }}
              activeProps={{ style: { color: "oklch(0.83 0.23 142)" } }}
            >
              SHOP
            </Link>

            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 font-mono uppercase transition-colors"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.22em",
                    color: "oklch(0.83 0.23 142)",
                  }}
                >
                  <Settings size={11} />
                  ADMIN
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 font-mono uppercase transition-colors hover:opacity-70"
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.22em",
                    color: "oklch(0.50 0.014 168)",
                  }}
                >
                  <LogOut size={11} />
                  OUT
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 font-mono uppercase transition-colors"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.22em",
                  color: "oklch(0.50 0.014 168)",
                }}
              >
                <LogIn size={11} />
                LOGIN
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
