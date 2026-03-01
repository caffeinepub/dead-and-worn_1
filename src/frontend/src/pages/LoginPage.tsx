import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useAuth } from "../App";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";

export default function LoginPage() {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  if (isAdmin) {
    navigate({ to: "/admin" });
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const success = login(username.trim(), password);
    if (success) {
      navigate({ to: "/admin" });
    } else {
      setError("Access denied. Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 mb-2">
              &#47;&#47; RESTRICTED ACCESS &#47;&#47;
            </p>
            <h1 className="font-display text-4xl uppercase tracking-tight text-foreground">
              ADMIN LOGIN
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-2 uppercase tracking-widest">
              DEAD &amp; WORN
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="border border-border bg-card p-6 space-y-4"
          >
            {/* Top accent line */}
            <div className="h-[2px] w-full bg-primary/40 -mt-6 -mx-6 mb-6 w-[calc(100%+3rem)]" />

            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                USERNAME
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                required
                className="bg-input border-border text-foreground font-mono text-sm rounded-none focus-visible:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0"
                placeholder="enter username"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                PASSWORD
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="bg-input border-border text-foreground font-mono text-sm rounded-none pr-10 focus-visible:ring-primary focus-visible:ring-1 focus-visible:ring-offset-0"
                  placeholder="enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="border border-destructive/40 bg-destructive/10 px-3 py-2"
              >
                <p className="font-mono text-xs text-destructive-foreground">
                  ⚠ {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-mono text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-10"
            >
              ENTER
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                ← BACK TO SHOP
              </Link>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
