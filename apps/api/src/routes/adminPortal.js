const { Router } = require("express");

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LSD Admin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    #app { width: 100%; max-width: 1100px; }
    #login { max-width: 640px; margin: 0 auto; }

    /* LOGIN */
    #login { text-align: center; }
    #login h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; }
    #login p { color: #888; margin-bottom: 24px; font-size: 0.9rem; }
    .input {
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #e5e5e5;
      padding: 12px 14px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .input:focus { border-color: #555; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 11px 20px;
      border-radius: 8px;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary { background: #e5e5e5; color: #0a0a0a; }
    .btn-primary:hover:not(:disabled) { opacity: 0.85; }
    .btn-danger { background: #dc2626; color: #fff; }
    .btn-danger:hover:not(:disabled) { opacity: 0.85; }
    .btn-ghost {
      background: transparent;
      border: 1px solid #2a2a2a;
      color: #aaa;
    }
    .btn-ghost:hover:not(:disabled) { border-color: #555; color: #e5e5e5; }
    #login .input { margin-bottom: 12px; }
    #login .btn { width: 100%; }
    .error-msg { color: #f87171; font-size: 0.85rem; margin-top: 8px; }

    /* MAIN — masonry columns so cards pack tight with no gaps */
    #main { display: none; }
    #main-cols {
      column-count: 2;
      column-gap: 16px;
    }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px;
    }
    .header h1 { font-size: 1.25rem; font-weight: 600; }

    .section {
      background: #111;
      border: 1px solid #1e1e1e;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      break-inside: avoid;
    }
    @media (max-width: 900px) {
      #main-cols { column-count: 1; }
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #666;
    }
    .selection-controls { display: flex; align-items: center; gap: 10px; }
    .link-btn {
      background: none; border: none; color: #aaa;
      font-size: 0.8rem; cursor: pointer; padding: 0;
      text-decoration: underline; text-underline-offset: 2px;
    }
    .link-btn:hover { color: #e5e5e5; }

    /* PARTICIPANTS */
    .participant-list { max-height: 260px; overflow-y: auto; }
    .participant-list::-webkit-scrollbar { width: 4px; }
    .participant-list::-webkit-scrollbar-track { background: transparent; }
    .participant-list::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    .participant-row {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 0; border-bottom: 1px solid #1a1a1a;
      font-size: 0.88rem; cursor: pointer; user-select: none;
    }
    .participant-row:last-child { border-bottom: none; }
    .participant-row:hover { background: #161616; margin: 0 -20px; padding-left: 20px; padding-right: 20px; }
    .participant-row.deselected { opacity: 0.35; }
    .participant-name { color: #e5e5e5; flex: 1; }
    .participant-email { color: #666; font-family: monospace; font-size: 0.82rem; }
    .cb {
      width: 16px; height: 16px; border: 1.5px solid #444;
      border-radius: 4px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.1s, border-color 0.1s;
    }
    .cb.checked { background: #e5e5e5; border-color: #e5e5e5; }
    .cb.checked::after {
      content: ""; width: 9px; height: 5px;
      border-left: 1.5px solid #0a0a0a; border-bottom: 1.5px solid #0a0a0a;
      transform: rotate(-45deg) translateY(-1px);
    }
    .count-badge {
      display: inline-block; background: #1e1e1e;
      border-radius: 20px; padding: 2px 10px;
      font-size: 0.8rem; color: #aaa; margin-left: 6px;
    }

    /* MESSAGE */
    textarea.input { resize: vertical; min-height: 100px; line-height: 1.5; }
    #blast-html { min-height: 180px; font-family: monospace; font-size: 0.82rem; }
    .bio-input-row { display: flex; gap: 8px; align-items: flex-start; }
    textarea.bio-input { min-height: 140px; resize: vertical; }
    .bio-btn-col { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .btn-clear { color: #888; }
    .btn-clear:hover { border-color: #555; color: #f87171; }

    /* PHOTO UPLOAD */
    .photo-upload-row { display: flex; gap: 14px; align-items: flex-start; margin-top: 2px; }
    .photo-preview {
      width: 72px; height: 72px; border-radius: 6px; object-fit: cover;
      border: 1px solid #2a2a2a; flex-shrink: 0; background: #1a1a1a;
      display: none;
    }
    .photo-placeholder {
      width: 72px; height: 72px; border-radius: 6px; border: 1px dashed #333;
      flex-shrink: 0; background: #111; display: flex; align-items: center;
      justify-content: center; color: #444; font-size: 1.4rem;
    }
    .photo-upload-col { display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .photo-status { font-size: 0.78rem; color: #555; min-height: 1em; }
    .photo-status.error { color: #f87171; }

    /* ARCHIVE */
    .archive-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 12px; margin-top: 14px;
    }
    .archive-card {
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
      overflow: hidden; display: flex; flex-direction: column;
    }
    .archive-thumb { width: 100%; height: 170px; object-fit: cover; display: block; background: #000; }
    .archive-card-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .archive-caption-input {
      background: #111; border: 1px solid #2a2a2a; border-radius: 5px;
      color: #e5e5e5; padding: 5px 8px; font-size: 0.78rem; outline: none; width: 100%;
    }
    .archive-caption-input:focus { border-color: #555; }
    .archive-type-tag {
      font-size: 0.68rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;
    }
    .archive-card-foot {
      display: flex; align-items: center; justify-content: space-between; margin-top: auto;
    }
    .archive-caption-status { font-size: 0.7rem; color: #555; }
    .archive-del { color: #a05252; font-size: 0.72rem; }
    .archive-del:hover { color: #f87171; }
    .blast-load-rest { display: block; width: 100%; margin-top: 12px; text-align: center; }
    input[type="file"].input-file {
      display: block; color: #888; font-size: 0.82rem;
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
      padding: 8px 10px; cursor: pointer; width: 100%;
    }
    input[type="file"].input-file::file-selector-button {
      background: #2a2a2a; border: none; color: #aaa; border-radius: 4px;
      padding: 4px 10px; margin-right: 10px; cursor: pointer; font-size: 0.8rem;
    }
    .char-count { text-align: right; font-size: 0.78rem; color: #666; margin-top: 6px; }
    .char-count.warn { color: #f59e0b; }
    .char-count.over { color: #f87171; }
    .actions { display: flex; gap: 10px; margin-top: 14px; }
    .actions .btn { flex: 1; }

    /* TOGGLE */
    .toggle-row {
      display: flex; align-items: center; justify-content: space-between;
    }
    .toggle-label { font-size: 0.9rem; color: #e5e5e5; }
    .toggle-sub { font-size: 0.78rem; color: #666; margin-top: 3px; }
    .toggle-switch {
      position: relative; width: 44px; height: 24px; flex-shrink: 0;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-track {
      position: absolute; inset: 0; background: #2a2a2a;
      border-radius: 99px; cursor: pointer;
      transition: background 0.2s ease;
    }
    .toggle-track::before {
      content: ""; position: absolute;
      width: 18px; height: 18px; border-radius: 50%;
      background: #666; top: 3px; left: 3px;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .toggle-switch input:checked + .toggle-track { background: #1a3a12; }
    .toggle-switch input:checked + .toggle-track::before {
      background: #4ade80; transform: translateX(20px);
    }

    /* PORTAL DATES */
    .divider { border: none; border-top: 1px solid #1e1e1e; margin: 16px 0; }
    .date-row { margin-top: 14px; }
    .date-row + .date-row { margin-top: 12px; }
    .date-label { font-size: 0.78rem; color: #666; margin-bottom: 6px; }
    .date-input-row { display: flex; gap: 8px; align-items: center; }
    input[type="date"].input {
      flex: 1;
      color-scheme: dark;
      cursor: pointer;
    }
    .date-save-btn {
      flex-shrink: 0;
      padding: 11px 16px;
      border-radius: 8px;
      border: 1px solid #2a2a2a;
      background: transparent;
      color: #aaa;
      font-size: 0.85rem;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .date-save-btn:hover { border-color: #555; color: #e5e5e5; }
    .date-save-btn.saved { border-color: #14532d; color: #4ade80; }
    .date-preview { font-size: 0.78rem; color: #555; margin-top: 5px; min-height: 1em; }

    /* RESULTS */
    #results { display: none; }
    .result-summary { display: flex; gap: 16px; margin-bottom: 14px; }
    .stat { flex: 1; background: #1a1a1a; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-num { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #666; margin-top: 2px; }
    .stat.success .stat-num { color: #4ade80; }
    .stat.failure .stat-num { color: #f87171; }
    .result-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 0; border-bottom: 1px solid #1a1a1a; font-size: 0.85rem;
    }
    .result-row:last-child { border-bottom: none; }
    .badge { font-size: 0.72rem; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
    .badge.sent { background: #14532d; color: #4ade80; }
    .badge.failed { background: #450a0a; color: #f87171; }
    .badge.dry { background: #1e3a5f; color: #60a5fa; }
    .result-list { max-height: 200px; overflow-y: auto; }

    /* ARCHIVE */
    #archive { }
    .archive-empty { color: #666; font-size: 0.9rem; }
    .archive-entry {
      border: 1px solid #1e1e1e;
      border-radius: 8px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .archive-entry:last-child { margin-bottom: 0; }
    .archive-summary {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; cursor: pointer;
      background: #161616;
    }
    .archive-summary:hover { background: #1c1c1c; }
    .archive-meta { flex: 1; min-width: 0; }
    .archive-msg {
      font-size: 0.88rem; color: #e5e5e5;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .archive-time { font-size: 0.75rem; color: #555; margin-top: 2px; }
    .archive-stats { display: flex; gap: 8px; flex-shrink: 0; }
    .archive-stat { font-size: 0.75rem; padding: 2px 8px; border-radius: 20px; }
    .archive-stat.s { background: #14532d; color: #4ade80; }
    .archive-stat.f { background: #450a0a; color: #f87171; }
    .archive-chevron { color: #444; font-size: 0.75rem; transition: transform 0.2s; flex-shrink: 0; }
    .archive-entry.open .archive-chevron { transform: rotate(90deg); }
    .archive-detail {
      display: none; padding: 0 14px 12px;
      background: #0e0e0e;
    }
    .archive-entry.open .archive-detail { display: block; }
    .archive-full-msg {
      font-size: 0.85rem; color: #aaa; line-height: 1.5;
      padding: 10px 0 10px; border-bottom: 1px solid #1a1a1a;
      white-space: pre-wrap; word-break: break-word;
    }

    .spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid #444; border-top-color: #e5e5e5;
      border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
<div id="app">

  <!-- LOGIN -->
  <div id="login">
    <h1>LSD Admin</h1>
    <p>Enter your admin secret to continue.</p>
    <input id="secret-input" class="input" type="password" placeholder="Admin secret" />
    <div id="login-error" class="error-msg"></div>
    <br/>
    <button class="btn btn-primary" onclick="doLogin()">Unlock</button>
  </div>

  <!-- MAIN -->
  <div id="main">
    <div class="header">
      <h1>LSD Admin</h1>
      <button class="btn btn-ghost" style="font-size:0.8rem;padding:7px 12px" onclick="doLogout()">Log out</button>
    </div>

    <div id="main-cols">
    <!-- CONTROLS -->
    <div class="section">
      <div class="section-title" style="margin-bottom:14px">Controls</div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">i'm here button</div>
          <div class="toggle-sub">Show the arrival button on the landing page</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="im-here-toggle" onchange="setImHere(this.checked)" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <hr class="divider" />

      <div class="date-row">
        <div class="date-label">NEXT PORTAL DATE</div>
        <div class="date-input-row">
          <input type="date" id="next-portal-date" class="input" oninput="updateDatePreview('next')" onchange="savePortalDate('next')" />
          <button class="date-save-btn" id="next-portal-clear" onclick="clearPortalDate('next')">Clear</button>
        </div>
        <div class="date-preview" id="next-portal-preview"></div>
      </div>

      <div class="date-row">
        <div class="date-label">NEXT PORTAL GUEST (optional — shows as "w/ ___" under the date)</div>
        <div class="date-input-row">
          <input type="text" id="next-portal-guest" class="input" placeholder="e.g. dotnine" oninput="autosaveField('nextPortalGuest', 'next-portal-guest', 'next-portal-guest-status')" onblur="saveFieldNow('nextPortalGuest', 'next-portal-guest', 'next-portal-guest-status')" />
        </div>
        <div class="date-preview" id="next-portal-guest-status"></div>
      </div>

      <div class="date-row">
        <div class="date-label">UPCOMING PORTAL DATE</div>
        <div class="date-input-row">
          <input type="date" id="upcoming-portal-date" class="input" oninput="updateDatePreview('upcoming')" onchange="savePortalDate('upcoming')" />
          <button class="date-save-btn" id="upcoming-portal-clear" onclick="clearPortalDate('upcoming')">Clear</button>
        </div>
        <div class="date-preview" id="upcoming-portal-preview"></div>
      </div>

      <div class="date-row">
        <div class="date-label">UPCOMING PORTAL GUEST (optional — shows as "w/ ___" under the date)</div>
        <div class="date-input-row">
          <input type="text" id="upcoming-portal-guest" class="input" placeholder="e.g. dotnine" oninput="autosaveField('upcomingPortalGuest', 'upcoming-portal-guest', 'upcoming-portal-guest-status')" onblur="saveFieldNow('upcomingPortalGuest', 'upcoming-portal-guest', 'upcoming-portal-guest-status')" />
        </div>
        <div class="date-preview" id="upcoming-portal-guest-status"></div>
      </div>
    </div>

    <!-- ARTISTS -->
    <div class="section">
      <div class="section-title" style="margin-bottom:14px">Artists</div>

      <div class="date-row">
        <div class="date-label">ARTIST 1 PHOTO</div>
        <div class="photo-upload-row">
          <div class="photo-placeholder" id="artist1-photo-placeholder">＋</div>
          <img id="artist1-photo-preview" class="photo-preview" alt="Artist 1" />
          <div class="photo-upload-col">
            <input type="file" id="artist1-photo-file" class="input-file" accept="image/*" onchange="uploadArtistPhoto('1', 'artist1-photo-file', 'artist1-photo-preview', 'artist1-photo-placeholder', 'artist1-photo-status')" />
            <button class="date-save-btn btn-clear" onclick="clearArtistPhoto('1','artist1-photo-preview','artist1-photo-placeholder','artist1-photo-status')">Remove photo</button>
            <div class="photo-status" id="artist1-photo-status"></div>
          </div>
        </div>
      </div>

      <div class="date-row">
        <div class="date-label">ARTIST 1 NAME</div>
        <div class="date-input-row">
          <input type="text" id="artist1-name" class="input" placeholder="e.g. trytab" oninput="autosaveField('artist1Name', 'artist1-name', 'artist1-name-status')" onblur="saveFieldNow('artist1Name', 'artist1-name', 'artist1-name-status')" />
        </div>
        <div class="date-preview" id="artist1-name-status"></div>
      </div>

      <div class="date-row">
        <div class="date-label">ARTIST 1 BIO</div>
        <div class="bio-input-row">
          <textarea id="artist1-bio" class="input bio-input" placeholder="bio..." oninput="autosaveField('artist1Bio', 'artist1-bio', 'artist1-bio-status')" onblur="saveFieldNow('artist1Bio', 'artist1-bio', 'artist1-bio-status')"></textarea>
          <div class="bio-btn-col">
            <button class="date-save-btn btn-clear" onclick="clearArtistField('artist1Bio', 'artist1-bio')">Clear</button>
          </div>
        </div>
        <div class="date-preview" id="artist1-bio-status"></div>
      </div>

      <hr class="divider" />

      <div class="date-row">
        <div class="date-label">ARTIST 2 PHOTO</div>
        <div class="photo-upload-row">
          <div class="photo-placeholder" id="artist2-photo-placeholder">＋</div>
          <img id="artist2-photo-preview" class="photo-preview" alt="Artist 2" />
          <div class="photo-upload-col">
            <input type="file" id="artist2-photo-file" class="input-file" accept="image/*" onchange="uploadArtistPhoto('2', 'artist2-photo-file', 'artist2-photo-preview', 'artist2-photo-placeholder', 'artist2-photo-status')" />
            <button class="date-save-btn btn-clear" onclick="clearArtistPhoto('2','artist2-photo-preview','artist2-photo-placeholder','artist2-photo-status')">Remove photo</button>
            <div class="photo-status" id="artist2-photo-status"></div>
          </div>
        </div>
      </div>

      <div class="date-row">
        <div class="date-label">ARTIST 2 NAME</div>
        <div class="date-input-row">
          <input type="text" id="artist2-name" class="input" placeholder="e.g. dotnine" oninput="autosaveField('artist2Name', 'artist2-name', 'artist2-name-status')" onblur="saveFieldNow('artist2Name', 'artist2-name', 'artist2-name-status')" />
        </div>
        <div class="date-preview" id="artist2-name-status"></div>
      </div>

      <div class="date-row">
        <div class="date-label">ARTIST 2 BIO</div>
        <div class="bio-input-row">
          <textarea id="artist2-bio" class="input bio-input" placeholder="bio..." oninput="autosaveField('artist2Bio', 'artist2-bio', 'artist2-bio-status')" onblur="saveFieldNow('artist2Bio', 'artist2-bio', 'artist2-bio-status')"></textarea>
          <div class="bio-btn-col">
            <button class="date-save-btn btn-clear" onclick="clearArtistField('artist2Bio', 'artist2-bio')">Clear</button>
          </div>
        </div>
        <div class="date-preview" id="artist2-bio-status"></div>
      </div>
    </div>

    <!-- ARCHIVE MEDIA -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">Archive</div>
        <button class="link-btn" onclick="loadAdminArchive()">Refresh</button>
      </div>
      <div class="date-row" style="margin-top:0">
        <div class="date-label">UPLOAD PHOTOS & VIDEOS — photos can carry an optional polaroid caption</div>
        <input type="file" id="archive-file" class="input-file" accept="image/*,video/*" multiple onchange="uploadArchiveFiles(this)" />
        <div class="photo-status" id="archive-upload-status"></div>
      </div>
      <div id="archive-grid" class="archive-grid"></div>
    </div>

    <!-- PARTICIPANTS -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">
          Recipients
          <span id="selected-badge" class="count-badge">0 selected</span>
        </div>
        <div class="selection-controls">
          <button class="link-btn" onclick="selectAll()">Select all</button>
          <button class="link-btn" onclick="selectNone()">None</button>
        </div>
      </div>
      <div id="participants-loading" style="color:#666;font-size:0.9rem">Loading...</div>
      <div id="participant-list" class="participant-list"></div>
    </div>

    <!-- COMPOSE -->
    <div class="section">
      <div class="section-title">Email Blast</div>
      <div class="date-row" style="margin-top:0">
        <div class="date-label">SUBJECT</div>
        <input type="text" id="blast-subject" class="input" placeholder="e.g. You're invited to LSD Portal" />
      </div>
      <div class="date-row">
        <div class="date-label">HTML BODY</div>
        <textarea id="blast-html" class="input" placeholder="&lt;p&gt;Your message here...&lt;/p&gt;"></textarea>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" onclick="doBlast(true)">Dry Run</button>
        <button class="btn btn-danger" onclick="confirmBlast()">Send Blast</button>
      </div>
    </div>

    <!-- RESULTS -->
    <div class="section" id="results">
      <div class="section-title" id="results-title">Results</div>
      <div class="result-summary">
        <div class="stat success"><div class="stat-num" id="stat-sent">—</div><div class="stat-label">Sent</div></div>
        <div class="stat failure"><div class="stat-num" id="stat-failed">—</div><div class="stat-label">Failed</div></div>
        <div class="stat"><div class="stat-num" id="stat-total">—</div><div class="stat-label">Total</div></div>
      </div>
      <div class="result-list" id="result-list"></div>
    </div>

    <!-- ARCHIVE -->
    <div class="section" id="archive">
      <div class="section-header">
        <div class="section-title">Blast Archive</div>
        <button class="link-btn" onclick="loadArchive()">Refresh</button>
      </div>
      <div id="archive-content"><div class="archive-empty">Loading...</div></div>
    </div>
    </div>
  </div>

</div>
<script>
  const SUPABASE_URL = "__SUPABASE_URL__";
  const SUPABASE_ANON_KEY = "__SUPABASE_ANON_KEY__";
  let adminSecret = sessionStorage.getItem("lsd_admin_secret") || "";
  let allParticipants = [];
  let selected = new Set();
  let archiveItems = [];

  if (adminSecret) tryAutoLogin();

  async function tryAutoLogin() {
    const ok = await verifySecret(adminSecret);
    if (ok) showMain();
  }

  async function verifySecret(secret) {
    try {
      const r = await fetch("/api/admin/participants", { headers: { "x-admin-secret": secret } });
      return r.ok;
    } catch { return false; }
  }

  async function doLogin() {
    const secret = document.getElementById("secret-input").value.trim();
    if (!secret) return;
    const ok = await verifySecret(secret);
    if (!ok) { document.getElementById("login-error").textContent = "Invalid secret."; return; }
    adminSecret = secret;
    sessionStorage.setItem("lsd_admin_secret", secret);
    showMain();
  }

  document.getElementById("secret-input").addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });

  function doLogout() {
    sessionStorage.removeItem("lsd_admin_secret");
    adminSecret = "";
    document.getElementById("main").style.display = "none";
    document.getElementById("login").style.display = "block";
    document.getElementById("secret-input").value = "";
  }

  function showMain() {
    document.getElementById("login").style.display = "none";
    document.getElementById("main").style.display = "block";
    loadParticipants();
    loadArchive();
    loadSettings();
    loadAdminArchive();
  }

  // ── Archive media manager ──

  async function loadAdminArchive() {
    try {
      const res = await fetch("/api/admin/archive", { headers: { "x-admin-secret": adminSecret } });
      const data = await res.json();
      archiveItems = data.items || [];
    } catch { archiveItems = []; }
    renderArchiveGrid();
  }

  function renderArchiveGrid() {
    const grid = document.getElementById("archive-grid");
    if (!archiveItems.length) {
      grid.innerHTML = '<p style="color:#666;font-size:0.85rem">Nothing in the archive yet — upload photos or videos above.</p>';
      return;
    }
    grid.innerHTML = archiveItems.map(item => \`
      <div class="archive-card">
        \${item.type === "photo"
          ? \`<img class="archive-thumb" src="\${esc(item.url)}" alt="" />\`
          : \`<video class="archive-thumb" src="\${esc(item.url)}" muted preload="metadata"></video>\`}
        <div class="archive-card-body">
          \${item.type === "photo"
            ? \`<input class="archive-caption-input" placeholder="caption…" value="\${esc(item.caption || "")}" oninput="autosaveArchiveCaption('\${item.id}', this)" onblur="saveArchiveCaptionNow('\${item.id}', this)" />\`
            : \`<span class="archive-type-tag">video</span>\`}
          <div class="archive-card-foot">
            <span class="archive-caption-status" id="archive-status-\${item.id}"></span>
            <button class="link-btn archive-del" onclick="removeArchiveItem('\${item.id}')">delete</button>
          </div>
        </div>
      </div>
    \`).join("");
  }

  async function uploadArchiveFiles(input) {
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const status = document.getElementById("archive-upload-status");
    status.classList.remove("error");
    let done = 0, failed = 0;
    for (const file of files) {
      status.textContent = \`Uploading \${done + failed + 1} of \${files.length}…\`;
      try {
        const type = file.type.startsWith("video/") ? "video" : "photo";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = \`\${type}s/\${Date.now()}-\${safeName}\`;
        // Straight to Supabase storage — videos are too big for the API's body limit
        const up = await fetch(\`\${SUPABASE_URL}/storage/v1/object/archive/\${storagePath}\`, {
          method: "POST",
          headers: {
            "Authorization": \`Bearer \${SUPABASE_ANON_KEY}\`,
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": file.type || "application/octet-stream"
          },
          body: file
        });
        if (!up.ok) throw new Error(\`storage upload failed (\${up.status})\`);
        const reg = await fetch("/api/admin/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ type, storagePath })
        });
        if (!reg.ok) throw new Error("register failed");
        done++;
      } catch (err) {
        console.error("[archive-upload]", err);
        failed++;
      }
    }
    input.value = "";
    status.textContent = failed ? \`\${done} uploaded, \${failed} failed — try again.\` : \`Uploaded \${done} ✓\`;
    if (failed) status.classList.add("error");
    setTimeout(() => { if (!failed) status.textContent = ""; }, 3000);
    loadAdminArchive();
  }

  const archiveCaptionTimers = {};
  function autosaveArchiveCaption(id, input) {
    clearTimeout(archiveCaptionTimers[id]);
    archiveCaptionTimers[id] = setTimeout(() => saveArchiveCaption(id, input), 1200);
  }
  function saveArchiveCaptionNow(id, input) {
    clearTimeout(archiveCaptionTimers[id]);
    saveArchiveCaption(id, input);
  }
  async function saveArchiveCaption(id, input) {
    const status = document.getElementById(\`archive-status-\${id}\`);
    if (status) status.textContent = "Saving…";
    await fetch("/api/admin/archive-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ id, caption: input.value.trim() })
    });
    if (status) {
      status.textContent = "Saved ✓";
      setTimeout(() => { status.textContent = ""; }, 2000);
    }
  }

  async function removeArchiveItem(id) {
    if (!confirm("Delete this from the archive?")) return;
    await fetch("/api/admin/archive-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ id })
    });
    archiveItems = archiveItems.filter(i => i.id !== id);
    renderArchiveGrid();
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/settings", { headers: { "x-admin-secret": adminSecret } });
    const data = await res.json();
    document.getElementById("im-here-toggle").checked = !!data.imHereEnabled;
    if (data.nextPortalDate) {
      document.getElementById("next-portal-date").value = data.nextPortalDate;
      updateDatePreview("next");
    }
    if (data.upcomingPortalDate) {
      document.getElementById("upcoming-portal-date").value = data.upcomingPortalDate;
      updateDatePreview("upcoming");
    }
    if (data.nextPortalGuest) document.getElementById("next-portal-guest").value = data.nextPortalGuest;
    if (data.upcomingPortalGuest) document.getElementById("upcoming-portal-guest").value = data.upcomingPortalGuest;
    if (data.artist1Name) document.getElementById("artist1-name").value = data.artist1Name;
    if (data.artist1Bio) document.getElementById("artist1-bio").value = data.artist1Bio;
    if (data.artist2Name) document.getElementById("artist2-name").value = data.artist2Name;
    if (data.artist2Bio) document.getElementById("artist2-bio").value = data.artist2Bio;
    if (data.artist1PhotoUrl) {
      const p = document.getElementById("artist1-photo-preview");
      p.src = data.artist1PhotoUrl; p.style.display = "block";
      document.getElementById("artist1-photo-placeholder").style.display = "none";
    }
    if (data.artist2PhotoUrl) {
      const p = document.getElementById("artist2-photo-preview");
      p.src = data.artist2PhotoUrl; p.style.display = "block";
      document.getElementById("artist2-photo-placeholder").style.display = "none";
    }
  }

  const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024; // base64 inflates ~37% — stays under the 4mb API body limit

  async function uploadArtistPhoto(artist, fileInputId, previewId, placeholderId, statusId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files[0];
    const status = document.getElementById(statusId);
    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      status.textContent = "Photo too large — keep it under 2.5MB.";
      status.classList.add("error");
      fileInput.value = "";
      return;
    }

    status.classList.remove("error");
    status.textContent = "Uploading…";

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/admin/upload-artist-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ artist, dataUrl })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || \`Upload failed (\${res.status})\`);
      }
      const { url } = await res.json();
      const preview = document.getElementById(previewId);
      const placeholder = document.getElementById(placeholderId);
      preview.src = url + "?t=" + Date.now();
      preview.style.display = "block";
      placeholder.style.display = "none";
      status.textContent = "Uploaded ✓";
      setTimeout(() => { status.textContent = ""; }, 2000);
    } catch (err) {
      console.error("[upload-artist-photo]", err);
      status.textContent = err.message || "Upload failed — try again.";
      status.classList.add("error");
    } finally {
      fileInput.value = "";
    }
  }

  async function clearArtistPhoto(artist, previewId, placeholderId, statusId) {
    const status = document.getElementById(statusId);
    status.classList.remove("error");
    status.textContent = "Removing…";
    try {
      const res = await fetch("/api/admin/upload-artist-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ artist, dataUrl: null, clear: true })
      });
      if (!res.ok) throw new Error(\`Remove failed (\${res.status})\`);
      const preview = document.getElementById(previewId);
      const placeholder = document.getElementById(placeholderId);
      preview.style.display = "none";
      preview.src = "";
      placeholder.style.display = "flex";
      status.textContent = "";
    } catch (err) {
      console.error("[clear-artist-photo]", err);
      status.textContent = "Remove failed — try again.";
      status.classList.add("error");
    }
  }

  async function clearArtistField(key, inputId) {
    const input = document.getElementById(inputId);
    input.value = "";
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ [key]: null })
    });
  }

  const autosaveTimers = {};
  function autosaveField(key, inputId, statusId, delay = 1200) {
    clearTimeout(autosaveTimers[inputId]);
    autosaveTimers[inputId] = setTimeout(() => {
      saveArtistField(key, inputId, statusId);
    }, delay);
  }

  function saveFieldNow(key, inputId, statusId) {
    clearTimeout(autosaveTimers[inputId]);
    saveArtistField(key, inputId, statusId);
  }

  async function saveArtistField(key, inputId, statusId) {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    if (status) status.textContent = "Saving…";
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ [key]: input.value.trim() || null })
    });
    if (!status) return;
    status.textContent = "Saved ✓";
    setTimeout(() => { status.textContent = ""; }, 2000);
  }

  async function setImHere(enabled) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ imHereEnabled: enabled })
    });
  }

  function fmtPortalDate(isoDate) {
    if (!isoDate) return "";
    // Parse as local date to avoid UTC offset shifting the day
    const [year, month, day] = isoDate.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  function updateDatePreview(which) {
    const input = document.getElementById(which === "next" ? "next-portal-date" : "upcoming-portal-date");
    const preview = document.getElementById(which === "next" ? "next-portal-preview" : "upcoming-portal-preview");
    preview.textContent = input.value ? fmtPortalDate(input.value) : "";
  }

  async function savePortalDate(which) {
    const input = document.getElementById(which === "next" ? "next-portal-date" : "upcoming-portal-date");
    const preview = document.getElementById(which === "next" ? "next-portal-preview" : "upcoming-portal-preview");
    const key = which === "next" ? "nextPortalDate" : "upcomingPortalDate";

    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ [key]: input.value || null })
    });

    const formatted = input.value ? fmtPortalDate(input.value) : "";
    preview.textContent = formatted ? \`\${formatted} · saved ✓\` : "saved ✓";
    setTimeout(() => { preview.textContent = formatted; }, 2000);
  }

  async function clearPortalDate(which) {
    const input = document.getElementById(which === "next" ? "next-portal-date" : "upcoming-portal-date");
    const preview = document.getElementById(which === "next" ? "next-portal-preview" : "upcoming-portal-preview");
    const btn = document.getElementById(which === "next" ? "next-portal-clear" : "upcoming-portal-clear");
    const key = which === "next" ? "nextPortalDate" : "upcomingPortalDate";

    btn.disabled = true;
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ [key]: null })
    });

    input.value = "";
    preview.textContent = "";
    btn.classList.add("saved");
    btn.textContent = "Cleared ✓";
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove("saved");
      btn.textContent = "Clear";
    }, 2000);
  }

  async function loadParticipants() {
    const res = await fetch("/api/admin/participants", { headers: { "x-admin-secret": adminSecret } });
    const data = await res.json();
    document.getElementById("participants-loading").style.display = "none";
    allParticipants = (data.participants || []).filter(p => p.email);
    selected = new Set(allParticipants.map(p => p.email));
    renderParticipants();
  }

  function renderParticipants() {
    const list = document.getElementById("participant-list");
    if (!allParticipants.length) {
      list.innerHTML = '<p style="color:#666;font-size:0.9rem">No participants yet.</p>';
      return;
    }
    list.innerHTML = allParticipants.map(p => \`
      <div class="participant-row \${selected.has(p.email) ? "" : "deselected"}"
           onclick="toggleParticipant('\${esc(p.email)}')"
           data-email="\${esc(p.email)}">
        <div class="cb \${selected.has(p.email) ? "checked" : ""}"></div>
        <span class="participant-name">\${esc(p.name)}</span>
        <span class="participant-email">\${esc(p.email)}</span>
      </div>
    \`).join("");
    updateSelectedBadge();
  }

  function toggleParticipant(email) {
    if (selected.has(email)) selected.delete(email);
    else selected.add(email);
    const row = document.querySelector(\`.participant-row[data-email="\${CSS.escape(email)}"]\`);
    if (row) {
      const isSelected = selected.has(email);
      row.classList.toggle("deselected", !isSelected);
      row.querySelector(".cb").classList.toggle("checked", isSelected);
    }
    updateSelectedBadge();
  }

  function selectAll() { selected = new Set(allParticipants.map(p => p.email)); renderParticipants(); }
  function selectNone() { selected = new Set(); renderParticipants(); }
  function updateSelectedBadge() { document.getElementById("selected-badge").textContent = selected.size + " selected"; }

  async function doBlast(dryRun = false) {
    const subject = document.getElementById("blast-subject").value.trim();
    const html = document.getElementById("blast-html").value.trim();
    if (!subject) { alert("Add a subject line first."); return; }
    if (!html) { alert("Write an HTML body first."); return; }
    if (selected.size === 0) { alert("No recipients selected."); return; }

    const btns = document.querySelectorAll(".actions .btn");
    btns.forEach(b => { b.disabled = true; b.dataset.orig = b.textContent; b.innerHTML = '<span class="spinner"></span>' + b.textContent; });

    const res = await fetch("/api/admin/blast", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ subject, html, dryRun, emails: [...selected] })
    });
    const data = await res.json();

    btns.forEach(b => { b.disabled = false; b.textContent = b.dataset.orig; });

    showResults(data, dryRun);
    if (!dryRun) loadArchive();
  }

  function confirmBlast() {
    const subject = document.getElementById("blast-subject").value.trim();
    const html = document.getElementById("blast-html").value.trim();
    if (!subject) { alert("Add a subject line first."); return; }
    if (!html) { alert("Write an HTML body first."); return; }
    if (selected.size === 0) { alert("No recipients selected."); return; }
    if (confirm("Send \\"" + subject + "\\" to " + selected.size + " " + (selected.size === 1 ? "person" : "people") + "?")) {
      doBlast(false);
    }
  }

  function showResults(data, dryRun) {
    const el = document.getElementById("results");
    el.style.display = "block";
    el.scrollIntoView({ behavior: "smooth" });

    if (dryRun) {
      document.getElementById("results-title").textContent = "Dry Run — Recipients";
      document.getElementById("stat-sent").textContent = "—";
      document.getElementById("stat-failed").textContent = "—";
      document.getElementById("stat-total").textContent = data.count ?? "—";
      document.getElementById("result-list").innerHTML = (data.recipients || []).map(r => \`
        <div class="result-row">
          <span>\${esc(r.name)}</span>
          <span style="display:flex;align-items:center;gap:8px">
            <span style="color:#666;font-family:monospace;font-size:0.82rem">\${esc(r.email)}</span>
            <span class="badge dry">dry run</span>
          </span>
        </div>
      \`).join("");
      return;
    }

    document.getElementById("results-title").textContent = "Blast Results";
    document.getElementById("stat-sent").textContent = data.sent ?? "—";
    document.getElementById("stat-failed").textContent = data.failed ?? "—";
    document.getElementById("stat-total").textContent = data.total ?? "—";
    document.getElementById("result-list").innerHTML = (data.results || []).map(r => \`
      <div class="result-row">
        <span>\${esc(r.name)}</span>
        <span style="display:flex;align-items:center;gap:8px">
          <span style="color:#666;font-family:monospace;font-size:0.82rem">\${esc(r.email)}</span>
          <span class="badge \${r.status}">\${r.status}</span>
        </span>
      </div>
    \`).join("");
  }

  const BLAST_PREVIEW_COUNT = 4;
  let blastLogs = [];
  let blastShowAll = false;

  async function loadArchive() {
    const res = await fetch("/api/admin/blasts", { headers: { "x-admin-secret": adminSecret } });
    const data = await res.json();
    blastLogs = data.logs || [];
    blastShowAll = false;
    renderBlastArchive();
  }

  function showAllBlasts() {
    blastShowAll = true;
    renderBlastArchive();
  }

  function renderBlastArchive() {
    const el = document.getElementById("archive-content");

    if (!blastLogs.length) {
      el.innerHTML = '<div class="archive-empty">No blasts sent yet.</div>';
      return;
    }

    const visible = blastShowAll ? blastLogs : blastLogs.slice(0, BLAST_PREVIEW_COUNT);
    const hidden = blastLogs.length - visible.length;

    el.innerHTML = visible.map((log, i) => \`
      <div class="archive-entry" id="arc-\${i}">
        <div class="archive-summary" onclick="toggleArchive(\${i})">
          <div class="archive-meta">
            <div class="archive-msg">\${esc(log.message)}</div>
            <div class="archive-time">\${fmtDate(log.created_at)}</div>
          </div>
          <div class="archive-stats">
            <span class="archive-stat s">\${log.sent} sent</span>
            \${log.failed > 0 ? \`<span class="archive-stat f">\${log.failed} failed</span>\` : ""}
          </div>
          <span class="archive-chevron">▶</span>
        </div>
        <div class="archive-detail">
          <div class="archive-full-msg">\${esc(log.message)}</div>
          \${(log.results || []).map(r => \`
            <div class="result-row">
              <span>\${esc(r.name)}</span>
              <span style="display:flex;align-items:center;gap:8px">
                <span style="color:#666;font-family:monospace;font-size:0.82rem">\${esc(r.email)}</span>
                <span class="badge \${r.status}">\${r.status}</span>
              </span>
            </div>
          \`).join("")}
        </div>
      </div>
    \`).join("") + (hidden > 0
      ? \`<button class="date-save-btn blast-load-rest" onclick="showAllBlasts()">Load the rest (\${hidden} more)</button>\`
      : "");
  }

  function toggleArchive(i) {
    document.getElementById("arc-" + i).classList.toggle("open");
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      + " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function esc(s) {
    return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
</script>
</body>
</html>`;

function adminPortalRouter() {
  const router = Router();
  router.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    // Injected at request time — env vars aren't loaded yet when this module's
    // template literal is evaluated (dotenv.config runs after requires).
    res.send(
      HTML.replace("__SUPABASE_URL__", process.env.SUPABASE_URL || "").replace(
        "__SUPABASE_ANON_KEY__",
        process.env.SUPABASE_ANON_KEY || ""
      )
    );
  });
  return router;
}

module.exports = { adminPortalRouter };
