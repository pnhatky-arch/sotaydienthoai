import fs from "node:fs";
import path from "node:path";

const output = "dist/cloudflare";
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of ["index.html", "styles.css", "app.js", "manifest.webmanifest", "service-worker.js"]) {
  fs.copyFileSync(file, path.join(output, file));
}
for (const directory of ["assets", "data"]) {
  fs.cpSync(directory, path.join(output, directory), { recursive: true });
}
fs.copyFileSync("cloudflare/_headers", path.join(output, "_headers"));
fs.copyFileSync("cloudflare/HUONG-DAN-CLOUDFLARE.txt", path.join(output, "HUONG-DAN-CLOUDFLARE.txt"));
console.log(`Prepared ${output}`);
