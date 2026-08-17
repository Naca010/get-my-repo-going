import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Globe,
  Images,
  BarChart3,
  LogOut,
  Loader2,
  ShieldAlert,
  Wand2,
  ListChecks,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin – Volksbank" }] }),
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { to: "/admin/banks", label: "Banken & Filialen", icon: Building2 },
  { to: "/admin/groups", label: "Domains", icon: Globe },
  { to: "/admin/addresses", label: "Adressen-Pool", icon: MapPin },
  { to: "/admin/partners", label: "Partner-Logos", icon: Images },
  { to: "/admin/completions", label: "Abschlüsse", icon: CheckCircle2 },
  { to: "/admin/stats", label: "Statistik", icon: BarChart3 },
];

function AdminLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Toaster />
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Kein Admin-Zugang</h1>
          <p className="text-sm text-muted-foreground">
            Dein Konto <strong>{email}</strong> hat keine Admin-Rolle. Nutze deine Nutzer-ID unten,
            um dich freischalten zu lassen.
          </p>
          <div className="rounded-md border bg-muted p-3 text-xs font-mono break-all">
            {email}
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={signOut}>Abmelden</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <Toaster />
      <aside className="w-60 shrink-0 border-r bg-background flex flex-col">
        <div className="h-14 flex items-center px-4 border-b font-semibold">Admin-Panel</div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground truncate">{email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
