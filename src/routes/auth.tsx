import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin-Anmeldung | VR- Info" },
      { property: "og:title", content: "Admin-Anmeldung | VR- Info" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Ungültige E-Mail").max(254),
  password: z.string().min(6, "Passwort mind. 6 Zeichen").max(128),
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/admin" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        router.invalidate();
        navigate({ to: "/admin" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
      return;
    }
    setBusy(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setBusy(false);
      if (error) {
        toast.error(
          error.code === "invalid_credentials"
            ? "E-Mail oder Passwort ist nicht korrekt. Setze dein Passwort zurück, falls du unsicher bist."
            : "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
        );
        return;
      }
      toast.success("Willkommen zurück");
    } else {
      const { error } = await supabase.auth.signUp({
        ...parsed.data,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Konto erstellt. Prüfe ggf. deine E-Mails zur Bestätigung.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>{mode === "login" ? "Admin-Anmeldung" : "Konto erstellen"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Anmelden" : "Registrieren"}
            </Button>
            {mode === "login" && (
              <Button asChild type="button" variant="link" className="w-full text-muted-foreground">
                <a href="/reset-password">Passwort vergessen?</a>
              </Button>
            )}
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "Neues Konto erstellen" : "Bereits registriert? Anmelden"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
