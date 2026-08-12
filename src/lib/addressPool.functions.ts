import { createServerFn } from "@tanstack/react-start";

export const getRandomPoolAddress = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("address_pool")
      .select("street,zip,city")
      .limit(200);
    if (error || !data || data.length === 0) return null;
    const pick = data[Math.floor(Math.random() * data.length)]!;
    return { street: pick.street, zip: pick.zip, city: pick.city };
  },
);
