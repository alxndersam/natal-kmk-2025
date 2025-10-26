/**
 * Apps Script handler: menerima application/json (fallback) atau multipart/form-data (upload file).
 * - Simpan file (jika ada) ke Drive, atur sharing ke Anyone with link (opsional).
 * - Simpan data pendaftaran ke Spreadsheet.
 *
 * Important:
 * - Ganti SPREADSHEET_ID dengan ID spreadsheet Anda.
 * - Setel akses Web App ke "Execute as: Me" dan "Who has access: Anyone, even anonymous"
 *   (atau sesuai kebutuhan keamanan).
 */

const SPREADSHEET_ID = '1lrK9P74dGg0daZ-Ym5gZIP_BC1Nu53bLanKPE4lPmf0';
const SHEET_NAME = 'Responses'; // atau nama sheet tujuan

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ok:true, time: new Date().toISOString()}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postType = (e.postData && e.postData.type) ? e.postData.type : '';
    if (postType.indexOf('application/json') !== -1) {
      // Lama: menerima JSON tanpa file (fallback)
      const payload = JSON.parse(e.postData.contents);
      const row = buildRowFromObject(payload, '');
      appendRow(row);
      return jsonResponse({result: 'success'});
    } else if (postType.indexOf('multipart/form-data') !== -1) {
      // Multipart parser
      const boundary = getBoundary(postType);
      if (!boundary) return jsonResponse({result:'error', message:'No boundary'}, 400);
      const parts = parseMultipart(e.postData.contents, boundary);
      // parts: [{name, filename, type, data (string)}]
      let fields = {};
      let fileUrl = '';
      let fileName = '';

      parts.forEach(part => {
        if (part.filename) {
          // create file in Drive
          try {
            // Convert part.data (string) to bytes and create a blob
            const bytes = Utilities.newBlob(part.data).getBytes();
            const blob = Utilities.newBlob(bytes, part.type || 'application/octet-stream', part.filename);
            const file = DriveApp.createFile(blob);
            // Optional: set sharing so anyone with link can view (review security)
            try {
              file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (errPerm) {
              // ignore if permission setting fails
              console.warn('setSharing failed:', errPerm);
            }
            fileUrl = file.getUrl();
            fileName = part.filename;
          } catch (fileErr) {
            console.error('File save error:', fileErr);
          }
        } else {
          // normal field
          fields[part.name] = part.data;
        }
      });

      // Build row using fields and file info
      const payload = {
        nama: fields['nama'] || fields['name'] || '',
        npm: fields['npm'] || '',
        jurusan: fields['jurusan'] || '',
        angkatan: fields['angkatan'] || '',
        whatsapp: fields['whatsapp'] || '',
        divisi1: fields['divisi1'] || '',
        alasan1: fields['alasan1'] || '',
        divisi2: fields['divisi2'] || '',
        alasan2: fields['alasan2'] || '',
        bersedia: fields['bersedia'] || '',
        linkKRS: fileName || fields['linkKRS'] || '',
        temaNatal: fields['temaNatal'] || ''
      };

      const row = buildRowFromObject(payload, fileUrl);
      appendRow(row);

      return jsonResponse({result:'success', fileUrl: fileUrl});
    } else {
      // Unsupported content type
      return jsonResponse({result:'error', message:'Unsupported content type'}, 415);
    }
  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({result:'error', message: String(err)}, 500);
  }
}

/* Helper: build spreadsheet row */
function buildRowFromObject(obj, fileUrl) {
  // Adjust column order to match your sheet
  return [
    new Date(),
    obj.nama || '',
    obj.npm || '',
    obj.jurusan || '',
    obj.angkatan || '',
    obj.whatsapp || '',
    obj.divisi1 || '',
    obj.alasan1 || '',
    obj.divisi2 || '',
    obj.alasan2 || '',
    obj.bersedia || '',
    obj.linkKRS || '',
    fileUrl || '',
    obj.temaNatal || ''
  ];
}

/* Append row to spreadsheet */
function appendRow(row) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'GANTI_DENGAN_SPREADSHEET_ID') {
    throw new Error('SPREADSHEET_ID belum diatur di Code.gs');
  }
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.appendRow(row);
}

/* Create JSON response */
function jsonResponse(obj, statusCode) {
  statusCode = statusCode || 200;
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  // Apps Script Web Apps do not support setting HTTP status code in simple way; return body contains status
  return output;
}

/* Extract boundary string from Content-Type */
function getBoundary(contentType) {
  const m = contentType.match(/boundary=(.*)$/);
  return m ? m[1] : '';
}

/*
 * Very small multipart parser:
 * - raw string: e.postData.contents
 * - boundary: boundary string (without leading --)
 * Returns array of parts: {name, filename (optional), type (content-type), data}
 *
 * NOTE: parsing binary data via e.postData.contents may sometimes corrupt binary for certain encodings.
 * This parser works for common text-based uploads and smaller files; if you need robust binary-safe parsing,
 * consider alternative upload flows (Drive API with OAuth) or base64-encoding file on client.
 */
function parseMultipart(raw, boundary) {
  const results = [];
  const delimiter = '--' + boundary;
  const parts = raw.split(delimiter);
  parts.forEach(function(part) {
    part = part.trim();
    if (!part || part === '--') return;
    // split headers/body
    const idx = part.indexOf('\r\n\r\n');
    const head = idx !== -1 ? part.substring(0, idx) : '';
    const body = idx !== -1 ? part.substring(idx + 4) : '';
    // parse headers
    const headers = {};
    const lines = head.split(/\r\n/);
    lines.forEach(function(line) {
      const i = line.indexOf(':');
      if (i > -1) {
        const key = line.substring(0, i).trim().toLowerCase();
        const val = line.substring(i + 1).trim();
        headers[key] = val;
      }
    });
    const disposition = headers['content-disposition'] || '';
    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : null;
    const filename = filenameMatch ? filenameMatch[1] : null;
    const contentType = headers['content-type'] || '';
    // remove trailing CRLF on body
    let data = body;
    if (data.endsWith('\r\n')) data = data.substring(0, data.length - 2);
    results.push({name: name, filename: filename, type: contentType, data: data});
  });
  return results;
}