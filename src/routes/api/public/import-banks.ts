import { importBanks } from "@/lib/import-banks.functions";
import { createFileRoute } from "@tanstack/react-router";
import fs from "fs";

export const Route = createFileRoute("/api/public/import-banks")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const csvPath = "/tmp/extraction/banken.csv";
          if (!fs.existsSync(csvPath)) {
            return new Response("CSV file not found", { status: 404 });
          }

          const content = fs.readFileSync(csvPath, "utf-8");
          const lines = content.split("\n").filter((line) => line.trim() !== "");
          const headers = lines[0].split(",").map((h) => h.trim());

          const parseCSVLine = (line: string) => {
            const result = [];
            let current = "";
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const banks = lines.slice(1).map((line) => {
            const values = parseCSVLine(line);
            const entry: any = {};
            headers.forEach((header, index) => {
              let val = values[index] || "";
              // Remove surrounding quotes
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
              }
              entry[header] = val;
            });

            return {
              id: entry.id,
              name: entry.name,
              gruppe: entry.gruppe,
              blz: entry.blz,
              online_banking_url: entry.online_banking_url,
              hide_name_in_header: entry.hide_name_in_header === "true",
              logo_storage_path: entry.logo_file,
              unverified: entry.unverified === "true",
            };
          });

          const result = await importBanks({ data: banks });
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
