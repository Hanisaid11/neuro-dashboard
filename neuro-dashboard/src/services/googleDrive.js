// ---------------------------------------------------------------------------
// Client-side Google OAuth2 using Google Identity Services (GIS), and the
// Drive API v3 REST endpoints directly (no gapi client library needed).
//
// Scope used: drive.file -> the app can only see/edit files IT created in
// the user's Drive (its own backup file), never the rest of their Drive.
//
// Setup required by the developer running this app (see README.md):
//   1. Create an OAuth 2.0 Client ID (type "Web application") in Google
//      Cloud Console, with this app's origin under "Authorized JavaScript
//      origins".
//   2. Put that client id in a .env file as VITE_GOOGLE_CLIENT_ID.
// ---------------------------------------------------------------------------

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'neuro-finance-backup.json';

let gisLoadingPromise = null;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoadingPromise) return gisLoadingPromise;
  gisLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('تعذر تحميل خدمة تسجيل الدخول من Google'));
    document.head.appendChild(script);
  });
  return gisLoadingPromise;
}

export function isGoogleConfigured() {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

// Opens the Google consent popup and resolves with an access token.
export async function requestAccessToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('لم يتم ضبط Google Client ID. أضف VITE_GOOGLE_CLIENT_ID في ملف .env');
  }
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response?.access_token) resolve(response);
          else reject(new Error('تم رفض الإذن من Google Drive'));
        },
        error_callback: (err) => reject(new Error(err?.message || 'فشل تسجيل الدخول إلى Google'))
      });
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
}

export function revokeAccessToken(token) {
  if (window.google?.accounts?.oauth2 && token) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
}

async function driveFetch(url, accessToken, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Drive API error ${res.status}: ${text}`);
  }
  return res;
}

// Looks up the app's own backup file in Drive, if it was created before.
export async function findBackupFile(accessToken) {
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`,
    accessToken
  );
  const json = await res.json();
  return json.files?.[0] || null;
}

// Creates the file if it doesn't exist yet, or updates it in place if it does.
export async function uploadBackupFile(accessToken, payload, existingFileId) {
  const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
  const boundary = '-------neurofinanceboundary';
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(payload)}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const res = await driveFetch(url, accessToken, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
  return res.json();
}

export async function downloadBackupFile(accessToken, fileId) {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    accessToken
  );
  return res.json();
}
