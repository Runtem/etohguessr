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

// ✨ Hardcoded PoM images
const POM_IMAGES = [
    {
        url: "/images/PoM/ToXIC.jpg",
        answers: ["ToXIC", "Tower of Xerially Infuriating Calamity"],
    },
    {
        url: "/images/PoM/ToOLC.jpg",
        answers: ["ToOLC", "Tower of Overthinking Life Choices"],
    },
    {
        url: "/images/PoM/ToVM.jpg",
        answers: ["ToVM", "Tower of Vindinctive Maneuvers"],
    },
    {
        url: "/images/PoM/ToSE.jpg",
        answers: ["ToSE", "Tower of Shunning Excursion"],
    },
    {
        url: "/images/PoM/ToVH.jpg",
        answers: ["ToVH", "Tower of Vacant Hindrances"],
    },
    {
        url: "/images/PoM/ToWM.jpg",
        answers: ["ToWM", "Tower of Water Melon"],
    },
    {
        url: "/images/PoM/TotRP.jpg",
        answers: ["TotRP", "Tower of The Roof's Pique"],
    },
    {
        url: "/images/PoM/ToEV.jpg",
        answers: ["ToEV", "Tower of Eternal Void"],
    },
    {
        url: "/images/PoM/ToBF.jpg",
        answers: ["ToBF", "Tower of Blind Fate"],
    },
    {
        url: "/images/PoM/ToSF.jpg",
        answers: ["ToSF", "Tower of Spiralling Fates"],
    },
    {
        url: "/images/PoM/ToMDC.jpg",
        answers: ["ToMDC", "Tower of Modernistic Design Choices"],
    },
    {
        url: "/images/PoM/WaT.jpg",
        answers: ["WaT", "Was A Tower"],
    },
    {
        url: "/images/PoM/CoIV.jpg",
        answers: ["CoIV", "Citadel of Infinite Void"],
    },
];

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

    const result = {
        defaultImages: towers,
        pomImages: POM_IMAGES, // ✅ include hardcoded PoM
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`✅ towers.json generated at ${OUTPUT_FILE}`);
}

generate().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
