// Re-export the full-featured PersonalDataOverview (with inline edit + contact management)
// so the post-login flow uses the same component as the original backend build.
export { default } from "@/components/PersonalDataOverview";
export type CustomerData = {
  anrede: string;
  name: string;
  kundenNr: string;
  geburtsdatum: string;
  familienstand: string;
  email: string;
  emailLabel?: string;
  mobilNr: string;
  mobilLabel?: string;
  adresse: { strasse: string; plzOrt: string };
  twoFactorEnabled?: boolean;
};
