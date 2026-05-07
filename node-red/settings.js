/**
 * Node-RED settings for TaskFlow (Render deployment)
 *
 * Node-RED will auto-load flow.json from this directory on every start.
 * No manual import or Deploy needed after the first deployment.
 */

const path = require('path');

module.exports = {
    // ── Core ─────────────────────────────────────────────────────────────
    // Point userDir at this folder so Node-RED uses flow.json that lives here
    userDir: __dirname,
    flowFile: path.join(__dirname, 'flow.json'),

    // ── HTTP Server ───────────────────────────────────────────────────────
    // Render injects PORT automatically; fall back to 1880 for local dev
    uiPort: process.env.PORT || 1880,

    // Bind to all interfaces so Render's reverse proxy can reach the process
    uiHost: '0.0.0.0',

    // ── Security ──────────────────────────────────────────────────────────
    // Disable the editor UI in production so the flow cannot be changed
    // via the browser (keeps the deployed flow stable).
    // Remove or comment out these two lines if you need the editor.
    disableEditor: process.env.NODE_ENV === 'production',
    httpAdminRoot: process.env.NODE_ENV === 'production' ? false : '/admin',

    // ── Environment variables exposed to flow functions ───────────────────
    // Access with:  env.get('NODE_RED_SECRET')  inside a Function node
    functionGlobalContext: {},

    // ── Logging ───────────────────────────────────────────────────────────
    logging: {
        console: {
            level: 'info',
            metric: false,
            audit: false
        }
    },

    // ── Editor theme (only used when editor is enabled) ───────────────────
    editorTheme: {
        projects: {
            enabled: false
        }
    }
};
