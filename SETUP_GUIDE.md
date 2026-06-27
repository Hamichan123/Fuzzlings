# Fuzzlings — Setup Guide

Three files make up your site, plus the backend script:

| File | What it is |
|------|------------|
| `index.html` | The animated home page |
| `whitelist.html` | The 4-task whitelist application |
| `Code.gs` | Google Apps Script that saves submissions to your Sheet |

The two HTML files are **fully self-contained** — the monster artwork is embedded inside them, so they work anywhere with no extra folders.

---

## Part 1 — Connect the Google Sheet (do this first)

1. Go to **sheets.new** to create a new Google Sheet. Name it e.g. *Fuzzlings Whitelist*.
2. In the menu: **Extensions → Apps Script**.
3. Delete the sample `function myFunction() {}` and **paste the entire contents of `Code.gs`**.
4. Click the **Save** icon (💾).
5. Click **Deploy → New deployment**.
   - Click the gear ⚙️ next to "Select type" → choose **Web app**.
   - **Description:** anything (e.g. "whitelist v1").
   - **Execute as:** `Me`.
   - **Who has access:** `Anyone`.  ← important, or the form can't reach it.
6. Click **Deploy**. Authorize the script when Google asks (choose your account → *Advanced* → *Go to project (unsafe)* → *Allow*). This is normal for your own script.
7. Copy the **Web app URL** — it ends in `/exec`.
8. *(Optional check)* paste that URL in a browser. You should see:
   `{"result":"ok","message":"Fuzzlings whitelist endpoint is live."}`

## Part 2 — Plug the URL into the site

1. Open `whitelist.html` in a text editor.
2. Near the top of the `<script>` block, find:
   ```js
   const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
3. Replace the placeholder with your `/exec` URL, e.g.:
   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfy.../exec";
   ```
4. Save. Done — submissions now land in your Sheet automatically.

> **Demo mode:** if you leave the placeholder as-is, the page still works for previewing (it shows the success animation) but does **not** save anything. The browser console will warn you.

## Part 3 — Put it online

Pick any static host (all free):

- **Netlify Drop** — drag the folder onto **app.netlify.com/drop**. Instant URL.
- **Vercel** — `vercel` in the folder, or import via the dashboard.
- **GitHub Pages** — push both HTML files to a repo, enable Pages.
- **Cloudflare Pages** — connect a repo or upload directly.

Make sure `index.html` and `whitelist.html` sit in the **same folder** so the "Join Whitelist" links work.

---

## What gets saved per entry

`Timestamp · X Username · Liked & Retweeted · Comment Link · EVM Wallet · User Agent`

The script also:
- auto-creates the header row,
- blocks duplicate wallets **and** duplicate usernames,
- validates the wallet and comment link server-side (not just in the browser).

## A note on the "follow" and "like/retweet" tasks
X doesn't allow a website to *automatically* verify a follow, like or retweet without the paid X API. So those two tasks use an honest "open the link, then confirm" flow. Your real proof is the **X username** and the **comment link** in the Sheet — you can spot-check those against your followers/replies before mint.

## Updating the script later
If you edit `Code.gs`, you must publish a new version: **Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy**. The `/exec` URL stays the same.

---
Stay fuzzy. ✦
