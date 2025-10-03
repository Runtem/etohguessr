// generateTowers.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch"; // npm install node-fetch@2
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync"; // npm install csv-parse

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "public", "images");
const OUTPUT_FILE = path.join(IMAGES_DIR, "towers.json");

// CSV export of your sheet
const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/1FlogEu7UQ2KZ4JjHQLs7jzv_S7QLxLfxAVJOEvQ231o/export?format=csv";

async function generate() {
    console.log("Fetching tower names from Google Sheets...");
    const res = await fetch(SHEET_URL);
    const text = await res.text();

    const records = parse(text, {
        columns: false,
        skip_empty_lines: true,
    });

    // Skip header row
    records.shift();

    // Build lookup { acronym: fullName }
    const lookup = {};
    records.forEach(([acronym, fullName]) => {
        if (acronym && fullName) {
            lookup[acronym.trim()] = fullName.trim();
        }
    });

    console.log("Scanning images...");

    function walk(dir, base = "") {
        let files = [];
        for (const file of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, file);
            const relPath = path.join(base, file);
            if (fs.statSync(fullPath).isDirectory()) {
                files = files.concat(walk(fullPath, relPath));
            } else {
                files.push(relPath.replace(/\\/g, "/"));
            }
        }
        return files;
    }

    const allFiles = walk(IMAGES_DIR).filter((f) =>
        /\.(png|jpg|jpeg|gif)$/i.test(f)
    );

    const towers = [];

    allFiles.forEach((file) => {
        // 🚫 skip PoM folder
        if (file.startsWith("PoM/")) return;

        const acronym = path.basename(file, path.extname(file));
        const fullName = lookup[acronym] || acronym;

        towers.push({
            url: `/images/${file}`,
            answers: [acronym, fullName],
        });
    });

    const result = { defaultImages: towers };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`✅ towers.json generated at ${OUTPUT_FILE}`);
}

generate().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
