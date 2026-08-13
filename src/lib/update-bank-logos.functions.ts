
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

export const importBankLogos = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const csvPath = "/tmp/extraction/banken.csv";
    if (!fs.existsSync(csvPath)) {
      throw new Error("CSV file not found");
    }

    const content = fs.readFileSync(csvPath, "utf-8");
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Processing ${records.length} records for logo updates...`);

    const updates = records.map((record: any) => {
      // Extract filename from logo_file path (e.g., "logos/name.jpg" -> "name.jpg")
      const logoFilename = record.logo_file ? path.basename(record.logo_file) : null;
      
      return {
        id: record.id,
        logo: logoFilename, // Mapping logo_file to logo column
        logo_url: record.logo_url // Keeping the original logo_url if provided
      };
    });

    // Batch update in chunks of 50 to avoid payload size issues
    const chunkSize = 50;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin
        .from("banks")
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error("Error updating chunk:", error);
      }
    }

    return { success: true, count: updates.length };
  });
