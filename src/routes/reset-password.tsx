import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Passwort zurücksetzen | VR- Info" },
      { property: "og:title", content: "Passwort zurücksetzen | VR- Info" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

const emailSchema = z.string().trim().email("Bitte gib eine gültige E-Mail-Adresse ein.").max(254);
const passwordSchema = z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben.").max(128);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    setRecoveryMode(hash.get("type") === "recovery");

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error("Die Reset-E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.");
      return;
    }
    toast.success("Wenn der Account existiert, erhältst du jetzt eine E-Mail mit dem Reset-Link.");
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    if (password !== confirmation) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) {
      toast.error("Das Passwort konnte nicht geändert werden. Öffne den Link aus der Reset-E-Mail erneut.");
      return;
    }
    toast.success("Passwort geändert. Du kannst dich jetzt anmelden.");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LockKeyhole className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>{recoveryMode ? "Neues Passwort setzen" : "Passwort zurücksetzen"}</CardTitle>
        </CardHeader>
        <CardContent>
          {recoveryMode ? (
            <form className="space-y-4" onSubmit={updatePassword}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort wiederholen</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Passwort speichern
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={requestReset}>
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-Mail</Label>
                <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset-Link senden
              </Button>
              <Button asChild variant="link" className="w-full text-muted-foreground">
                <Link to="/auth">Zurück zur Anmeldung</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}