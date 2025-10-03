// checkTowers.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOWERS_FILE = path.join(__dirname, "public", "images", "towers.json");

function checkDuplicates() {
    if (!fs.existsSync(TOWERS_FILE)) {
        console.error("❌ towers.json not found. Run generateTowers.js first.");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(TOWERS_FILE, "utf-8"));
    const defaultTowers = data.defaultImages || [];
    const pomTowers = data.pomImages || [];

    let found = false;

    function checkArray(towers, label) {
        towers.forEach((tower) => {
            const answers = tower.answers.map((a) => a.trim().toLowerCase());
            if (answers.length > 1 && answers[0] === answers[1]) {
                console.log(
                    `⚠️ Duplicate answers in ${label} for ${tower.url}: [${tower.answers.join(", ")}]`
                );
                found = true;
            }
        });
    }

    checkArray(defaultTowers, "defaultImages");
    checkArray(pomTowers, "pomImages");

    if (!found) {
        console.log("✅ No duplicate answers found in either defaultImages or pomImages.");
    }
}

checkDuplicates();