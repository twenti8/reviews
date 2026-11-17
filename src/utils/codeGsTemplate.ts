export const CODE_GS_TEMPLATE = `/**
 * Google Apps Script Backend for Cute Pastel Bio & Customer Review App
 *
 * Sheet 1: StoreSettings
 *   - Column A: key (storeInfo, theme, avatarUrl, bannerUrl, musicConfig, adminPin, creditHighlights)
 *   - Column B+: value (Automatically split into 45,000-char chunks across C, D, E... to avoid the 50,000-char cell limit)
 *
 * Sheet 2: Reviews
 *   - Exact Columns: id | name | product | rating | comment | date
 */

var SETTINGS_SHEET_NAME = 'StoreSettings';
var REVIEWS_SHEET_NAME = 'Reviews';
var CHUNK_SIZE = 45000;
var REVIEW_HEADERS = ['id', 'name', 'product', 'rating', 'comment', 'date'];

function getOrCreateSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var settingsSheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    settingsSheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  } else if (settingsSheet.getLastRow() === 0) {
    settingsSheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  }

  var reviewsSheet = ss.getSheetByName(REVIEWS_SHEET_NAME);
  if (!reviewsSheet) {
    reviewsSheet = ss.insertSheet(REVIEWS_SHEET_NAME);
    reviewsSheet.getRange(1, 1, 1, REVIEW_HEADERS.length).setValues([REVIEW_HEADERS]);
  } else if (reviewsSheet.getLastRow() === 0) {
    reviewsSheet.getRange(1, 1, 1, REVIEW_HEADERS.length).setValues([REVIEW_HEADERS]);
  }

  return { settingsSheet: settingsSheet, reviewsSheet: reviewsSheet };
}

function chunkString_(str, size) {
  if (!str) return [''];
  var chunks = [];
  for (var i = 0; i < str.length; i += size) {
    chunks.push(str.substring(i, i + size));
  }
  return chunks;
}

function writeSettingRow_(sheet, key, rawValue) {
  var valueStr = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
  var chunks = chunkString_(valueStr, CHUNK_SIZE);
  var lastRow = sheet.getLastRow();
  var targetRow = -1;

  if (lastRow >= 2) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) === String(key)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  if (targetRow === -1) {
    targetRow = Math.max(2, lastRow + 1);
  }

  var maxCols = Math.max(sheet.getLastColumn(), chunks.length + 1);
  if (maxCols > 1) {
    sheet.getRange(targetRow, 2, 1, maxCols - 1).clearContent();
  }

  var rowValues = [key].concat(chunks);
  sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
}

function readAllSettings_(sheet) {
  var result = {};
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return result;

  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (var r = 0; r < rows.length; r++) {
    var key = String(rows[r][0] || '').trim();
    if (!key) continue;

    var combined = '';
    for (var c = 1; c < rows[r].length; c++) {
      if (rows[r][c] !== '' && rows[r][c] !== null && rows[r][c] !== undefined) {
        combined += String(rows[r][c]);
      }
    }

    try {
      result[key] = JSON.parse(combined);
    } catch (err) {
      result[key] = combined;
    }
  }
  return result;
}

function readAllReviews_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var rows = sheet.getRange(2, 1, lastRow - 1, REVIEW_HEADERS.length).getValues();
  var reviews = [];

  for (var i = 0; i < rows.length; i++) {
    var id = String(rows[i][0] || '').trim();
    if (!id) continue;
    reviews.push({
      id: id,
      name: String(rows[i][1] || ''),
      product: String(rows[i][2] || ''),
      rating: Number(rows[i][3]) || 5,
      comment: String(rows[i][4] || ''),
      date: String(rows[i][5] || ''),
    });
  }
  return reviews;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  try {
    var sheets = getOrCreateSheets_();
    var settings = readAllSettings_(sheets.settingsSheet);
    var reviews = readAllReviews_(sheets.reviewsSheet);
    return jsonResponse_({
      ok: true,
      settings: settings,
      reviews: reviews,
    });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err.message || String(err),
    });
  }
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);
    var action = payload.action || 'syncAll';
    var sheets = getOrCreateSheets_();

    if (action === 'syncAll') {
      var settings = payload.settings || {};
      var settingKeys = Object.keys(settings);
      for (var i = 0; i < settingKeys.length; i++) {
        var k = settingKeys[i];
        writeSettingRow_(sheets.settingsSheet, k, settings[k]);
      }

      if (Array.isArray(payload.reviews)) {
        var lastRow = sheets.reviewsSheet.getLastRow();
        if (lastRow >= 2) {
          sheets.reviewsSheet
            .getRange(2, 1, lastRow - 1, REVIEW_HEADERS.length)
            .clearContent();
        }
        if (payload.reviews.length > 0) {
          var rowsToWrite = payload.reviews.map(function (r) {
            return [
              String(r.id || ''),
              String(r.name || ''),
              String(r.product || ''),
              Number(r.rating) || 5,
              String(r.comment || ''),
              String(r.date || ''),
            ];
          });
          sheets.reviewsSheet
            .getRange(2, 1, rowsToWrite.length, REVIEW_HEADERS.length)
            .setValues(rowsToWrite);
        }
      }

      return jsonResponse_({ ok: true, action: 'syncAll' });
    }

    if (action === 'saveSettings') {
      var partial = payload.settings || {};
      var keys = Object.keys(partial);
      for (var j = 0; j < keys.length; j++) {
        writeSettingRow_(sheets.settingsSheet, keys[j], partial[keys[j]]);
      }
      return jsonResponse_({ ok: true, action: 'saveSettings' });
    }

    if (action === 'addReview' && payload.review) {
      var rev = payload.review;
      sheets.reviewsSheet.appendRow([
        String(rev.id || ''),
        String(rev.name || ''),
        String(rev.product || ''),
        Number(rev.rating) || 5,
        String(rev.comment || ''),
        String(rev.date || ''),
      ]);
      return jsonResponse_({ ok: true, action: 'addReview' });
    }

    if (action === 'deleteReview' && payload.id) {
      var targetId = String(payload.id);
      var rLast = sheets.reviewsSheet.getLastRow();
      if (rLast >= 2) {
        var idValues = sheets.reviewsSheet.getRange(2, 1, rLast - 1, 1).getValues();
        for (var rowIdx = idValues.length - 1; rowIdx >= 0; rowIdx--) {
          if (String(idValues[rowIdx][0]) === targetId) {
            sheets.reviewsSheet.deleteRow(rowIdx + 2);
          }
        }
      }
      return jsonResponse_({ ok: true, action: 'deleteReview' });
    }

    return jsonResponse_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err.message || String(err),
    });
  }
}`;
