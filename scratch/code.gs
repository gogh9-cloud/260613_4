// ═══════════════════════════════════════════════════════════
// Code.gs — 버블버블 퀴즈 어드벤처 서버 로직 정리본
//
// 학생 시트: 반 | 번호 | 이름 | 점수합계 | [단계별 점수...] | 마지막 접속
// 오답 시트: 반 | 번호 | 이름 | 문항 번호 | 오답
// 퀴즈 시트: 문항 번호 | 문항 | 선택지 | 이미지 | 정답
// ═══════════════════════════════════════════════════════════

const TZ = 'Asia/Seoul';
const SHEET = { STUDENTS: '학생', LOG: '오답' };
const STUDENT_HEADERS = ['반', '번호', '이름', '점수합계', '마지막 접속'];
const LOG_HEADERS = ['반', '번호', '이름', '문항 번호', '오답'];

// 1-based column indexes
const SC = { BAN: 1, NUM: 2, NAME: 3, TOTAL: 4 };
const QZ = { NUM: 1, QUESTION: 2, OPTIONS: 3, IMAGE: 4, ANSWER: 5 };

function doGet() {
  ensureCoreSheets_();
  return HtmlService
    .createHtmlOutputFromFile('game')
    .setTitle('버블버블 퀴즈 어드벤처')
    .addMetaTag('viewport', 'width=device-width,initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};

    let result;
    switch (body.action) {
      case 'loginOrRegister':
        result = loginOrRegister(body.ban, body.num, body.name);
        break;
      case 'getPlayerInfo':
        result = getPlayerInfo(body.ban, body.num, body.name);
        break;
      case 'submitAnswer':
        result = submitAnswer(body.ban, body.num, body.name, body.questionNum, body.answer, body.isCorrect);
        break;
      case 'saveStageScore':
        result = saveStageScore(body.ban, body.num, body.name, body.stageName, body.stageScore, body.solved);
        break;
      case 'savePosition':
        result = savePosition(body.ban, body.num, body.name);
        break;
      case 'getQuizBank':
        result = getQuizBank(body.sheetName);
        break;
      case 'getImageDataUrl':
        result = getImageDataUrl(body.url || body.fileId);
        break;
      case 'getSheetNames':
        result = getQuizSheetNames();
        break;
      default:
        result = { ok: false, error: 'unknown action' };
    }
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: err.message || String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function today_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy. M. d');
}

function getSs_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureCoreSheets_() {
  ensureSheet_(SHEET.STUDENTS, STUDENT_HEADERS);
  ensureSheet_(SHEET.LOG, LOG_HEADERS);
}

function ensureSheet_(name, headers) {
  const ss = getSs_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const cur = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach((h, i) => {
      if (!cur[i]) sh.getRange(1, i + 1).setValue(h);
    });
  }
  styleHeader_(sh, 1, Math.max(sh.getLastColumn(), headers.length));
  return sh;
}

function getStudentSheet_() {
  const sh = ensureSheet_(SHEET.STUDENTS, STUDENT_HEADERS);
  ensureLastAccessColumn_(sh);
  return sh;
}

function getLogSheet_() {
  return ensureSheet_(SHEET.LOG, LOG_HEADERS);
}

function getQuizSheet_(name) {
  const sh = getSs_().getSheetByName(name);
  if (!sh) throw new Error(`시트 없음: ${name}`);
  return sh;
}

function styleHeader_(sh, startCol, endCol) {
  if (endCol < startCol) return;
  sh.getRange(1, startCol, 1, endCol - startCol + 1)
    .setFontWeight('bold')
    .setBackground('#1c2340')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
}

function ensureLastAccessColumn_(sh) {
  const lastCol = Math.max(sh.getLastColumn(), STUDENT_HEADERS.length);
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  if (!headers.includes('마지막 접속')) {
    sh.getRange(1, lastCol + 1).setValue('마지막 접속');
    styleHeader_(sh, lastCol + 1, lastCol + 1);
  }
}

// 0-based layout: A=0, E=4부터 단계 점수, 마지막 접속 열 앞까지가 단계 점수
function getStudentsLayout_(sh) {
  ensureLastAccessColumn_(sh);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const stageStart = 4;
  let lastColIdx = headers.lastIndexOf('마지막 접속');
  if (lastColIdx < stageStart) lastColIdx = headers.length - 1;
  const stages = headers.slice(stageStart, lastColIdx).filter(Boolean);
  return { headers, stages, stageStart, lastColIdx };
}

function findStudent_(ban, num, name) {
  const sh = getStudentSheet_();
  const values = sh.getDataRange().getValues();
  const cleanName = String(name || '').trim();

  for (let i = 1; i < values.length; i++) {
    if (Number(values[i][0]) === Number(ban) &&
        Number(values[i][1]) === Number(num) &&
        String(values[i][2]).trim() === cleanName) {
      return { row: i + 1, data: values[i], sh };
    }
  }
  return null;
}

function safeScore_(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 999999) return 0;
  return Math.floor(n);
}

function rowToStageScores_(data, sh) {
  const layout = getStudentsLayout_(sh);
  return layout.stages.reduce((acc, stageName, i) => {
    const score = safeScore_(data[layout.stageStart + i]);
    if (stageName && score > 0) acc[stageName] = score;
    return acc;
  }, {});
}

function calcTotalScore_(data, sh) {
  const layout = getStudentsLayout_(sh);
  return layout.stages.reduce((sum, stageName, i) => {
    return sum + safeScore_(data[layout.stageStart + i]);
  }, 0);
}

function ensureStageColumn_(sh, stageName) {
  if (!stageName) throw new Error('단계 이름이 없습니다.');

  const layout = getStudentsLayout_(sh);
  const idx = layout.stages.indexOf(stageName);
  if (idx >= 0) return layout.stageStart + idx; // 0-based

  // 마지막 접속 열 바로 앞에 새 단계 열 삽입
  const insertCol = layout.lastColIdx + 1; // 1-based
  sh.insertColumnBefore(insertCol);
  sh.getRange(1, insertCol).setValue(stageName);
  styleHeader_(sh, insertCol, insertCol);

  if (sh.getLastRow() > 1) {
    sh.getRange(2, insertCol, sh.getLastRow() - 1, 1).clearContent();
  }
  SpreadsheetApp.flush();
  return insertCol - 1; // 0-based
}

function loginOrRegister(ban, num, name) {
  if (!ban || !num || !name || String(name).trim().length < 1) {
    return { ok: false, error: '반, 번호, 이름을 모두 입력해 주세요.' };
  }

  ban = Number(ban);
  num = Number(num);
  name = String(name).trim();

  const found = findStudent_(ban, num, name);
  if (!found) {
    return {
      ok: false,
      error: '학생 명단에 없는 정보입니다. 반·번호·이름을 정확히 입력해 주세요.',
    };
  }

  const now = today_();
  const layout = getStudentsLayout_(found.sh);
  found.sh.getRange(found.row, layout.lastColIdx + 1).setValue(now);
  SpreadsheetApp.flush();

  const latest = found.sh.getRange(found.row, 1, 1, found.sh.getLastColumn()).getValues()[0];
  return {
    ok: true,
    isNew: false,
    name: latest[SC.NAME - 1],
    score: calcTotalScore_(latest, found.sh),
    stageScores: rowToStageScores_(latest, found.sh),
  };
}

function getPlayerInfo(ban, num, name) {
  if (!ban || !num || !name) return { ok: false, error: '입력 오류' };

  const found = findStudent_(Number(ban), Number(num), String(name).trim());
  if (!found) return { ok: true, found: false };

  const latest = found.sh.getRange(found.row, 1, 1, found.sh.getLastColumn()).getValues()[0];
  return {
    ok: true,
    found: true,
    name: latest[SC.NAME - 1],
    score: calcTotalScore_(latest, found.sh),
    stageScores: rowToStageScores_(latest, found.sh),
  };
}

function savePosition(ban, num, name) {
  try {
    const found = findStudent_(Number(ban), Number(num), String(name).trim());
    if (!found) return { ok: false, error: '학생 없음' };

    const layout = getStudentsLayout_(found.sh);
    found.sh.getRange(found.row, layout.lastColIdx + 1).setValue(today_());
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function submitAnswer(ban, num, name, questionNum, answer, isCorrect) {
  if (!isCorrect) {
    const sh = getLogSheet_();
    sh.appendRow([
      Number(ban),
      Number(num),
      String(name || '').trim(),
      String(questionNum || '').trim(),
      String(answer || '').slice(0, 300),
    ]);

    const row = sh.getLastRow();
    sh.getRange(row, 1, 1, LOG_HEADERS.length).setHorizontalAlignment('center');
    sh.getRange(row, 3).setHorizontalAlignment('left');
    sh.getRange(row, 5).setHorizontalAlignment('left');
    SpreadsheetApp.flush();
  }
  return { ok: true };
}

function saveStageScore(ban, num, name, stageName, stageScore, solved) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);

  try {
    const found = findStudent_(Number(ban), Number(num), String(name).trim());
    if (!found) return { ok: false, error: '학생 없음' };

    const newScore = Number(stageScore) || 0;
    const colIdx0 = ensureStageColumn_(found.sh, String(stageName || '').trim());
    const colIdx1 = colIdx0 + 1;

    const rowData = found.sh.getRange(found.row, 1, 1, found.sh.getLastColumn()).getValues()[0];
    const oldBest = safeScore_(rowData[colIdx0]);
    const cleanNewScore = safeScore_(newScore);
    if (cleanNewScore >= oldBest) {
      found.sh.getRange(found.row, colIdx1).setValue(cleanNewScore);
    }

    const latest = found.sh.getRange(found.row, 1, 1, found.sh.getLastColumn()).getValues()[0];
    const totalScore = calcTotalScore_(latest, found.sh);
    found.sh.getRange(found.row, SC.TOTAL).setValue(totalScore);

    const layout = getStudentsLayout_(found.sh);
    found.sh.getRange(found.row, layout.lastColIdx + 1).setValue(today_());
    SpreadsheetApp.flush();

    const finalData = found.sh.getRange(found.row, 1, 1, found.sh.getLastColumn()).getValues()[0];
    return {
      ok: true,
      score: calcTotalScore_(finalData, found.sh),
      stageScores: rowToStageScores_(finalData, found.sh),
      solved: Number(solved) || 0,
    };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    lock.releaseLock();
  }
}

function getQuizSheetNames() {
  ensureCoreSheets_();
  const names = getSs_().getSheets()
    .map(sh => sh.getName())
    .filter(name => name !== SHEET.STUDENTS && name !== SHEET.LOG);
  return { ok: true, sheetNames: names };
}

function getQuizBank(sheetName) {
  const sh = getQuizSheet_(sheetName);
  const rows = sh.getDataRange().getValues().slice(1);

  const quizzes = rows
    .map(row => {
      const questionNum = String(row[QZ.NUM - 1] || '').trim();
      const question = String(row[QZ.QUESTION - 1] || '').trim();
      if (!question) return null;

      const options = splitOptions_(row[QZ.OPTIONS - 1]);
      const answers = splitAnswers_(row[QZ.ANSWER - 1]);

      const rawImage = String(row[QZ.IMAGE - 1] || '').trim();
      const imageInfo = normalizeImageInfo_(rawImage);

      return {
        questionNum,
        type: options.length > 0 ? 'choice' : 'short',
        question,
        options,
        answer: answers.length > 1 ? answers : (answers[0] || ''),
        image: imageInfo.url,
        imageFileId: imageInfo.fileId,
      };
    })
    .filter(Boolean);

  return { ok: true, sheetName: sh.getName(), quizzes };
}

function splitOptions_(raw) {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text) return [];

  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
    } catch (err) {
      // CSV fallback
    }
  }
  return text.split(',').map(v => String(v).trim()).filter(Boolean);
}

function splitAnswers_(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map(v => String(v).replace(/\s/g, ''))
    .filter(Boolean);
}


function normalizeImageInfo_(raw) {
  const text = String(raw || '').trim();
  if (!text) return { url: '', fileId: '' };

  const fileId = extractDriveFileId_(text);
  if (fileId) {
    return {
      fileId,
      url: 'https://drive.google.com/uc?export=view&id=' + fileId,
    };
  }

  const url = text.match(/https?:\/\/\S+/i);
  return { url: url ? url[0].trim() : text, fileId: '' };
}

function extractDriveFileId_(value) {
  const raw = String(value || '').trim();
  let m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = raw.match(/(?:^|[^a-zA-Z0-9_-])([a-zA-Z0-9_-]{25,})(?:[^a-zA-Z0-9_-]|$)/);
  if (m) return m[1];
  return '';
}

// 구글 드라이브 이미지 표시 보조
// Drive 공유 링크가 <img>에서 막히는 경우 서버가 이미지 파일을 읽어 data URL로 전달합니다.
function getImageDataUrl(urlOrFileId) {
  try {
    const raw = String(urlOrFileId || '').trim();
    if (!raw) return { ok: false, error: '이미지 URL이 비어 있습니다.' };

    const fileId = extractDriveFileId_(raw) || raw;
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const mimeType = blob.getContentType() || 'image/png';

    if (!String(mimeType).startsWith('image/')) {
      return { ok: false, error: '이미지 파일이 아닙니다: ' + mimeType };
    }

    return {
      ok: true,
      fileId,
      mimeType,
      dataUrl: 'data:' + mimeType + ';base64,' + Utilities.base64Encode(blob.getBytes()),
    };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

// 선생님 메뉴용: 학생 기록 초기화
function resetStudents() {
  const ui = SpreadsheetApp.getUi();
  const choice = ui.alert('⚠️ 경고', '모든 학생 점수를 초기화할까요?', ui.ButtonSet.YES_NO);
  if (choice !== ui.Button.YES) return;

  const sh = getStudentSheet_();
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  ui.alert('✅ 초기화 완료');
}
