import fs from "node:fs";
const data = JSON.parse(fs.readFileSync("data/phonebook.json", "utf8"));
if (data.length !== 168) throw new Error(`Expected 168 units, got ${data.length}`);
if (data.flatMap(x => x.contacts).length !== 672) throw new Error("Expected 672 contacts");
if (!data.every((x,i) => x.id === i + 1 && x.unit && x.formerUnit && x.contacts.length === 4)) throw new Error("Invalid unit structure");
for (const file of ["index.html","styles.css","app.js","manifest.webmanifest","service-worker.js","assets/logo-tphcm.png","assets/trong-dong-background.png"]) if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
console.log("Verified 168 units, 672 contacts, and application assets.");
