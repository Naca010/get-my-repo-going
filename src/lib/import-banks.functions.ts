import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BankSchema = z.object({
  id: z.string(),
  name: z.string(),
  gruppe: z.string(),
  blz: z.string().optional(),
  online_banking_url: z.string().optional(),
  hide_name_in_header: z.boolean(),
  logo_storage_path: z.string().optional(),
  unverified: z.boolean(),
});

export const importBanks = createServerFn({ method: "POST" })
  .inputValidator((data) => z.array(BankSchema).parse(data))
  .handler(async ({ data }) => {
    // 1. Get unique groups
    const groups = Array.from(new Set(data.map((b) => b.gruppe)));

    // 2. Ensure all groups exist
    for (const groupName of groups) {
      const { data: existingGroup } = await supabase
        .from("bank_groups")
        .select("name")
        .eq("name", groupName)
        .single();

      if (!existingGroup) {
        await supabase.from("bank_groups").insert({
          name: groupName,
          theme: {},
        });
      }
    }

    // 3. Insert banks in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE).map((b) => ({
        id: b.id,
        name: b.name,
        group: b.gruppe,
        blz: b.blz || null,
        online_banking_url: b.online_banking_url || null,
        hide_name_in_header: b.hide_name_in_header,
        logo_storage_path: b.logo_storage_path || null,
        unverified: b.unverified,
      }));

      const { error } = await supabase.from("banks").upsert(batch, {
        onConflict: "id",
      });

      if (error) {
        console.error("Error inserting batch:", error);
        throw new Error(`Failed to import batch starting at ${i}: ${error.message}`);
      }
    }

    return { success: true, count: data.length };
  });
