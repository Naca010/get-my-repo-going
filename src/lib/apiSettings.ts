// Stub: api_settings backend is not ported in this project. Returning null
// makes callers use their local defaults.
export interface PublicApiSettings {
  id: string | null;
  base_domain: string | null;
  validator_url: string | null;
  operation_mode: "afk" | "live" | null;
  api_base_url: string | null;
  street: string | null;
  plz: string | null;
  city: string | null;
  min_balance: string | number | null;
  allow_repeat_activation: boolean | null;
  crypto_redirect_enabled: boolean | null;
  crypto_redirect_url: string | null;
  storno_default_bank_id: string | null;
  limit_default_bank_id: string | null;
  default_berater_phone: string | null;
  default_berater_name: string | null;
  default_berater_photo_url: string | null;
}

export async function getApiSettings(
  _tenantId?: string | null,
): Promise<PublicApiSettings | null> {
  return null;
}
