import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override on purpose: public pages render dynamically so
// an admin edit (e.g. marking an item Sold Out) is visible immediately.
// See MASTER-PLAN.md §10 "Frontend ↔ admin sync".
export default defineCloudflareConfig();
