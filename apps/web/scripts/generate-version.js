const fs = require("fs");
const path = require("path");

const version = {
  branch: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
  run: process.env.GITHUB_RUN_NUMBER || "0",
  sha: process.env.NEXT_PUBLIC_GIT_SHA || "unknown",
  date: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
};

const publicDir = path.join(__dirname, "..", "public");
const versionPath = path.join(publicDir, "version.json");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
console.log("Generated version.json:", version);
