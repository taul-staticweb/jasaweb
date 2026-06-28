/**
 * ============================================================
 * Taul StaticWeb — Google Apps Script CMS Template
 * ============================================================
 * CARA DEPLOY:
 * 1. Buka Google Spreadsheet Anda
 * 2. Extensions > Apps Script
 * 3. Copy-paste seluruh kode ini
 * 4. Ganti SPREADSHEET_ID di bawah dengan ID spreadsheet Anda
 * 5. Deploy > New Deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy URL deployment, tempelkan di GAS_URL pada file tema
 *
 * STRUKTUR SPREADSHEET:
 * Sheet "brand"       → Kolom A: Key, Kolom B: Value (format key-value)
 * Sheet "data"        → Baris 1 adalah header kolom
 * Sheet "testimonial" → Baris 1 adalah header kolom
 * Sheet "faq"         → Baris 1 adalah header kolom
 *
 * KOLOM WAJIB DI SHEET "brand" (Kolom A = key, Kolom B = value):
 * brand_name, logo_url, wa_number, color_accent, color_bg,
 * color_text, hero_title, hero_subtitle, footer_text
 *
 * KOLOM WAJIB DI SHEET "data" (baris pertama = header):
 * nama_produk, jenis, harga, harga_coret, satuan,
 * stok, badge, deskripsi_singkat, deskripsi,
 * foto_produk_1, foto_produk_2, foto_produk_3
 *
 * KOLOM WAJIB DI SHEET "testimonial":
 * nama, bintang, isi, platform_order
 *
 * KOLOM WAJIB DI SHEET "faq":
 * pertanyaan, jawaban
 * ============================================================
 */

// ============================================================
// ⚙️ KONFIGURASI — GANTI ID SPREADSHEET DI SINI
// ============================================================
const SPREADSHEET_ID = '1Icw-VUM5xYUqgSCaCpbgDwSecnX_y6wsOnNTc1Hotqc';
// ============================================================

// Nama sheet — sesuaikan dengan nama tab di spreadsheet Anda (huruf besar/kecil HARUS sama)
const SHEET_NAMES = {
  branding:     'brand',         // Tab data branding (nama, warna, logo, dll)
  products:     'data',          // Tab daftar produk/layanan
  testimonials: 'testimonial',   // Tab testimoni pelanggan
  faq:          'faq'            // Tab pertanyaan & jawaban
};

// ============================================================
// 🔍 FUNGSI DEBUG — Jalankan ini di editor GAS untuk diagnosa
// ============================================================
function debugSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const allSheets = ss.getSheets().map(s => s.getName());
  Logger.log('=== SEMUA SHEET YANG DITEMUKAN ===');
  Logger.log(JSON.stringify(allSheets));
  Logger.log('');
  Logger.log('=== SHEET_NAMES yang dikonfigurasi ===');
  Logger.log(JSON.stringify(SHEET_NAMES));
  Logger.log('');
  Logger.log('=== CEK KECOCOKAN ===');
  Object.entries(SHEET_NAMES).forEach(([key, name]) => {
    const found = ss.getSheetByName(name);
    Logger.log(key + ' ("' + name + '"): ' + (found ? '✅ DITEMUKAN (' + found.getLastRow() + ' baris)' : '❌ TIDAK DITEMUKAN'));
  });
  Logger.log('');
  Logger.log('=== ISI SHEET BRANDING (5 baris pertama) ===');
  const bSheet = ss.getSheetByName(SHEET_NAMES.branding);
  if (bSheet) {
    const rows = bSheet.getRange(1, 1, Math.min(5, bSheet.getLastRow()), 2).getValues();
    rows.forEach((r, i) => Logger.log('Baris ' + (i+1) + ': Col A="' + r[0] + '" | Col B="' + r[1] + '"'));
  } else {
    Logger.log('Sheet "' + SHEET_NAMES.branding + '" tidak ditemukan!');
  }
}
// ============================================================

// ============================================================
// doGet — Endpoint untuk MEMBACA data
// ============================================================
function doGet(e) {
  const params = e.parameter;
  const type = params.type || 'branding';
  
  try {
    let result;
    
    switch(type) {
      case 'branding':
        result = getBranding();
        break;
      case 'products':
        result = getSheetAsArray(SHEET_NAMES.products);
        break;
      case 'testimonials':
        result = getSheetAsArray(SHEET_NAMES.testimonials);
        break;
      case 'faq':
        result = getSheetAsArray(SHEET_NAMES.faq);
        break;
      case 'all':
        // Ambil semua data sekaligus (efisien untuk loading awal)
        result = {
          branding: getBranding(),
          products: getSheetAsArray(SHEET_NAMES.products),
          testimonials: getSheetAsArray(SHEET_NAMES.testimonials),
          faq: getSheetAsArray(SHEET_NAMES.faq)
        };
        break;
      // === UNTUK ADMIN DASHBOARD ===
      case 'sheets':
        result = getSheetNames();
        break;
      case 'headers':
        const sheetForHeaders = params.sheet || SHEET_NAMES.products;
        result = getSheetHeaders(sheetForHeaders);
        break;
      case 'data':
        const sheetForData = params.sheet || SHEET_NAMES.products;
        result = getSheetRawData(sheetForData);
        break;
      default:
        result = { error: 'Tipe tidak dikenal: ' + type };
    }
    
    return createResponse(result);
    
  } catch(err) {
    return createResponse({ error: err.message });
  }
}

// ============================================================
// doPost — Endpoint untuk MENULIS data (Admin Dashboard)
// ============================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const sheet = body.sheet;
    const data = body.data;
    const rowIndex = body.rowIndex; // 1-indexed (baris data, bukan header)
    
    let result;
    
    switch(action) {
      case 'add':
        // Tambah baris baru
        result = addRow(sheet, data);
        break;
      case 'update':
        // Update baris existing berdasarkan rowIndex
        result = updateRow(sheet, rowIndex, data);
        break;
      case 'delete':
        // Hapus baris berdasarkan rowIndex
        result = deleteRow(sheet, rowIndex);
        break;
      case 'update_branding':
        // Update key-value di sheet Branding
        result = updateBranding(data);
        break;
      default:
        result = { success: false, error: 'Action tidak dikenal: ' + action };
    }
    
    return createResponse(result);
    
  } catch(err) {
    return createResponse({ success: false, error: err.message });
  }
}

// ============================================================
// FUNGSI INTERNAL
// ============================================================

/**
 * Ambil data Branding sebagai object key-value
 */
function getBranding() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.branding);
  if (!sheet) return {};
  
  const data = sheet.getDataRange().getValues();
  const result = {};
  
  data.forEach(row => {
    const key = String(row[0]).trim();
    const value = String(row[1] !== undefined ? row[1] : '').trim();
    if (key && key !== '') {
      // Normalize key: lowercase, spaces jadi underscore
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      result[normalizedKey] = value;
    }
  });
  
  return result;
}

/**
 * Ambil data sheet sebagai array of objects (baris 1 = header)
 */
function getSheetAsArray(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Skip baris kosong
    if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;
    
    const obj = { _rowIndex: i }; // Simpan index asli untuk keperluan update
    headers.forEach((header, j) => {
      obj[header] = String(row[j] !== undefined ? row[j] : '').trim();
    });
    rows.push(obj);
  }
  
  return rows;
}

/**
 * Ambil nama semua sheet (untuk admin)
 */
function getSheetNames() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheets().map(s => s.getName());
}

/**
 * Ambil headers sebuah sheet (untuk admin form builder)
 */
function getSheetHeaders(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return firstRow.map(h => String(h).trim()).filter(h => h !== '');
}

/**
 * Ambil raw data sheet (header + semua baris) untuk admin
 */
function getSheetRawData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { headers: [], rows: [] };
  
  const all = sheet.getDataRange().getValues();
  if (all.length === 0) return { headers: [], rows: [] };
  
  const headers = all[0].map(h => String(h).trim());
  const rows = [];
  
  for (let i = 1; i < all.length; i++) {
    const row = all[i];
    if (row.every(c => c === '' || c === null)) continue;
    rows.push({ 
      _rowIndex: i + 1, // Nomor baris di spreadsheet (1-indexed, termasuk header)
      values: row.map(c => String(c !== undefined ? c : '').trim())
    });
  }
  
  return { headers, rows, sheetName };
}

/**
 * Tambah baris baru ke sheet
 */
function addRow(sheetName, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(h => data[h] || '');
  
  sheet.appendRow(newRow);
  return { success: true, message: 'Baris berhasil ditambahkan.' };
}

/**
 * Update baris berdasarkan nomor baris spreadsheet
 */
function updateRow(sheetName, rowNumber, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const updatedRow = headers.map(h => data[h] !== undefined ? data[h] : '');
  
  // rowNumber adalah nomor baris di spreadsheet (baris 1 = header, baris 2+ = data)
  sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);
  return { success: true, message: 'Baris berhasil diperbarui.' };
}

/**
 * Hapus baris berdasarkan nomor baris spreadsheet
 */
function deleteRow(sheetName, rowNumber) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: 'Sheet tidak ditemukan: ' + sheetName };
  
  sheet.deleteRow(rowNumber);
  return { success: true, message: 'Baris berhasil dihapus.' };
}

/**
 * Update key-value di sheet Branding
 */
function updateBranding(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.branding);
  if (!sheet) return { success: false, error: 'Sheet Branding tidak ditemukan.' };
  
  const allData = sheet.getDataRange().getValues();
  let updated = 0;
  let notFound = [];
  
  Object.keys(data).forEach(key => {
    let found = false;
    for (let i = 0; i < allData.length; i++) {
      const rowKey = String(allData[i][0]).trim().toLowerCase().replace(/\s+/g, '_');
      const inputKey = key.toLowerCase().replace(/\s+/g, '_');
      if (rowKey === inputKey) {
        sheet.getRange(i + 1, 2).setValue(data[key]);
        updated++;
        found = true;
        break;
      }
    }
    if (!found) {
      // Key tidak ada → tambahkan baris baru
      sheet.appendRow([key, data[key]]);
      updated++;
    }
  });
  
  return { 
    success: true, 
    message: `${updated} field berhasil diperbarui.`,
    notFound 
  };
}

/**
 * Buat response JSON dengan CORS headers
 */
function createResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
