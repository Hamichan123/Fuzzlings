/**
 * ============================================================================
 *  FUZZLINGS — Whitelist backend (Google Apps Script)
 *  Receives submissions from whitelist.html and saves them to a Google Sheet.
 * ============================================================================
 *
 *  WHAT IT DOES
 *   - Creates a header row automatically the first time it runs.
 *   - Appends one row per submission: timestamp, X username, like+RT, comment
 *     link, EVM wallet, IP-less user agent.
 *   - Blocks duplicate wallets / usernames (returns result:"duplicate").
 *
 *  SETUP — see SETUP_GUIDE.md for the full walkthrough. Short version:
 *   1. Open your Google Sheet → Extensions → Apps Script.
 *   2. Delete any sample code, paste THIS whole file, and Save.
 *   3. Deploy → New deployment → type "Web app".
 *        • Execute as:  Me
 *        • Who has access:  Anyone
 *   4. Copy the Web app URL it gives you (ends in /exec).
 *   5. Paste that URL into SCRIPT_URL at the top of whitelist.html.
 *   NOTE: every time you edit this script, redeploy (Deploy → Manage
 *   deployments → edit → New version) or the changes won't go live.
 */

// Optional: set a specific tab name. Leave "" to use the first sheet.
var SHEET_NAME = "";

var HEADERS = ["Timestamp", "X Username", "Liked & Retweeted", "Comment Link", "EVM Wallet", "User Agent"];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME || "Whitelist");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // avoid race conditions on concurrent submits

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter; // fallback for form-encoded posts
    }

    var username = String(data.username || "").trim();
    var liked    = String(data.liked_retweeted || "").trim();
    var comment  = String(data.comment_link || "").trim();
    var wallet   = String(data.wallet || "").trim();
    var ua       = String(data.ua || "").trim().slice(0, 300);

    // ---- server-side validation ----
    if (!/^@?[A-Za-z0-9_]{1,15}$/.test(username))
      return json_({ result: "error", message: "Invalid username." });
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet))
      return json_({ result: "error", message: "Invalid EVM wallet." });
    if (!/https?:\/\/(x|twitter)\.com\/.+\/status\/\d+/i.test(comment))
      return json_({ result: "error", message: "Invalid comment link." });

    if (username.charAt(0) !== "@") username = "@" + username;

    var sheet = getSheet_();

    // ---- duplicate check (wallet or username already present) ----
    var last = sheet.getLastRow();
    if (last > 1) {
      var existing = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      var wLower = wallet.toLowerCase(), uLower = username.toLowerCase();
      for (var i = 0; i < existing.length; i++) {
        var exU = String(existing[i][1]).toLowerCase();
        var exW = String(existing[i][4]).toLowerCase();
        if (exW === wLower || exU === uLower) {
          return json_({ result: "duplicate", message: "Already registered." });
        }
      }
    }

    sheet.appendRow([new Date(), username, liked || "No", comment, wallet, ua]);
    return json_({ result: "success", row: sheet.getLastRow() });

  } catch (err) {
    return json_({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm it's live.
function doGet() {
  return json_({ result: "ok", message: "Fuzzlings whitelist endpoint is live." });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
