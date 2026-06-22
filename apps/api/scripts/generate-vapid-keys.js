#!/usr/bin/env node

// Generate VAPID keys for web push
// Run with: node scripts/generate-vapid-keys.js

import { generateVAPIDKeys } from "web-push";

const keys = generateVAPIDKeys();

console.log("VAPID Keys Generated:");
console.log("");
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("");
console.log("Add these to your .env file:");
console.log("VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
