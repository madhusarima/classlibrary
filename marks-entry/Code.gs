/**
 * Abhyasa Vidyalayam - Marks Entry web app (server side)
 *
 * Bound to the "Abhyasa Marks 2026-27" spreadsheet. Teachers sign in with the
 * PIN from the Teachers tab; every read/write is re-checked against that PIN
 * on the server, so a teacher can only touch their own subject and classes.
 *
 * Tabs used: Config, Subjects, Activities, Students, Teachers,
 *            Marks, Class, ActGrades, Log
 */

var EXAMS = ['FA1', 'FA2', 'SA1'];
// Grades offered for activities (Craft, Music, ...), as printed on the report.
var ACTIVITY_GRADES = ['A', 'B', 'C'];
var ACTIVITY_SCALE_TEXT = 'Grading Scale: A Good, B Satisfactory, C Needs to improve';
// Used when Config > ExamTitle is blank.
var DEFAULT_EXAM_TITLE = 'Continuous Comprehensive Evaluation : Summative Assessment 1';
var TZ = 'Asia/Kolkata';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Marks Entry')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ------------------------------ helpers ------------------------------ */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function table_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('The sheet tab "' + name + '" is missing.');
  var vals = sh.getDataRange().getValues();
  var head = vals.shift().map(function (h) { return String(h).trim(); });
  var rows = vals
    .filter(function (r) { return r.some(function (c) { return c !== ''; }); })
    .map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
  return { rows: rows };
}

function config_() {
  var c = {};
  table_('Config').rows.forEach(function (r) { c[String(r.Setting).trim()] = r.Value; });
  return c;
}

/** "1-10", "6-10", "1,3,5-7" or a single number -> [1,2,...] */
function parseClasses_(spec) {
  var out = [];
  String(spec === null || spec === undefined ? '' : spec).split(/[,;]/).forEach(function (p) {
    p = p.trim();
    var m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { for (var c = +m[1]; c <= +m[2]; c++) out.push(c); }
    else if (/^\d+$/.test(p)) out.push(+p);
  });
  return out;
}

/** Roll 101 -> class 1, 902 -> class 9, 1001 -> class 10 */
function classOf_(roll) { return Math.floor(Number(roll) / 100); }

function studentsOf_(cls) {
  return table_('Students').rows
    .filter(function (s) { return classOf_(s.Roll) === cls; })
    .map(function (s) { return { roll: Number(s.Roll), name: String(s.Name) }; })
    .sort(function (a, b) { return a.roll - b.roll; });
}

function subjectMeta_() {
  var m = {};
  table_('Subjects').rows.forEach(function (r) {
    m[String(r.Name).trim()] = {
      classes: parseClasses_(r.Classes),
      max: { FA1: Number(r['FA1 Max']), FA2: Number(r['FA2 Max']), SA1: Number(r['SA1 Max']) }
    };
  });
  return m;
}

function auth_(pin) {
  pin = String(pin === null || pin === undefined ? '' : pin).trim();
  if (!pin) throw new Error('Please enter your PIN.');
  var t = table_('Teachers').rows.filter(function (r) { return String(r.PIN).trim() === pin; })[0];
  if (!t) throw new Error('That PIN was not recognised. Please try again.');
  var meta = subjectMeta_();
  var tClasses = parseClasses_(t.Classes);
  var subjects = String(t.Subject || '').split(',')
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s && meta[s]; })
    .map(function (s) {
      return {
        subject: s,
        max: meta[s].max,
        classes: tClasses.filter(function (c) { return meta[s].classes.indexOf(c) >= 0; })
      };
    })
    .filter(function (s) { return s.classes.length; });
  return { name: String(t.Name), subjects: subjects, classTeacherOf: parseClasses_(t.ClassTeacherOf) };
}

function nameClass_(c) { return c >= 1 ? 'Class ' + c : 'Pre-primary'; }

function stamp_(withTime) {
  return Utilities.formatDate(new Date(), TZ, withTime ? 'dd/MM/yyyy HH:mm:ss' : 'dd/MM/yyyy');
}

function log_(who, what) {
  ss_().getSheetByName('Log').appendRow([stamp_(true), who, what]);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/**
 * Insert-or-update rows in a tab.
 * items: [{keys:{Roll:101,Subject:'Maths'}, values:{FA1:12}, stamp:{Teacher:'..',Updated:'..'}}]
 * A new row is only created when at least one value is non-blank.
 */
function upsert_(sheetName, items) {
  if (!items.length) return 0;
  var sh = ss_().getSheetByName(sheetName);
  if (!sh) throw new Error('The sheet tab "' + sheetName + '" is missing.');
  var vals = sh.getDataRange().getValues();
  var head = vals[0].map(function (h) { return String(h).trim(); });
  function col(n) {
    var i = head.indexOf(n);
    if (i < 0) throw new Error('Tab "' + sheetName + '" has no column "' + n + '".');
    return i;
  }
  var keyNames = Object.keys(items[0].keys);
  var kcols = keyNames.map(col);
  var index = {};
  for (var i = 1; i < vals.length; i++) {
    index[kcols.map(function (c) { return String(vals[i][c]).trim(); }).join('|')] = i;
  }
  var changed = 0;
  items.forEach(function (it) {
    var k = keyNames.map(function (n) { return String(it.keys[n]).trim(); }).join('|');
    var vkeys = Object.keys(it.values);
    var r = index[k];
    if (r === undefined) {
      if (vkeys.every(function (n) { return it.values[n] === ''; })) return;
      var row = new Array(head.length).fill('');
      keyNames.forEach(function (n, j) { row[kcols[j]] = it.keys[n]; });
      vals.push(row);
      r = vals.length - 1;
      index[k] = r;
    }
    var diff = false;
    vkeys.forEach(function (n) {
      var c = col(n);
      if (String(vals[r][c]) !== String(it.values[n])) { vals[r][c] = it.values[n]; diff = true; }
    });
    if (diff) {
      Object.keys(it.stamp || {}).forEach(function (n) { vals[r][col(n)] = it.stamp[n]; });
      changed++;
    }
  });
  if (changed) sh.getRange(1, 1, vals.length, head.length).setValues(vals);
  return changed;
}

/* ------------------------- called from the page ------------------------- */

function adminPin_() {
  var p = config_().AdminPIN;
  return p === undefined || p === null ? '' : String(p).trim();
}

function allClasses_() {
  var seen = {}, out = [];
  table_('Students').rows.forEach(function (s) {
    var c = classOf_(s.Roll);
    if (c >= 1 && !seen[c]) { seen[c] = true; out.push(c); }
  });
  return out.sort(function (a, b) { return a - b; });
}

/** Who may print reports: the Admin (any class) or a class teacher (own class). */
function reportAccess_(pin) {
  pin = String(pin === null || pin === undefined ? '' : pin).trim();
  var admin = adminPin_();
  if (admin && pin === admin) return { name: 'Admin', classes: allClasses_(), isAdmin: true };
  var t = auth_(pin);
  return { name: t.name, classes: t.classTeacherOf, isAdmin: false, teacher: t };
}

function login(pin) {
  var acc = reportAccess_(pin);
  var t = acc.isAdmin ? { subjects: [], classTeacherOf: [] } : acc.teacher;
  var cfg = config_();
  return {
    name: acc.name,
    isAdmin: acc.isAdmin,
    subjects: t.subjects,
    classTeacherOf: t.classTeacherOf,
    reportClasses: acc.classes,
    school: String(cfg.SchoolName || ''),
    year: String(cfg.Year || ''),
    activities: table_('Activities').rows.map(function (r) { return String(r.Name); }),
    activityGrades: ACTIVITY_GRADES,
    exams: EXAMS
  };
}

function checkMarksAccess_(pin, cls, subject, exam) {
  var t = auth_(pin);
  if (EXAMS.indexOf(exam) < 0) throw new Error('Unknown exam: ' + exam);
  var s = t.subjects.filter(function (x) { return x.subject === subject; })[0];
  if (!s || s.classes.indexOf(cls) < 0) {
    throw new Error('You are not assigned to ' + subject + ' for ' + nameClass_(cls) + '.');
  }
  return { teacher: t, max: s.max[exam] };
}

function getRoster(pin, cls, subject, exam) {
  cls = Number(cls);
  var acc = checkMarksAccess_(pin, cls, subject, exam);
  var existing = {};
  table_('Marks').rows.forEach(function (r) {
    if (String(r.Subject).trim() === subject) existing[String(r.Roll).trim()] = r[exam];
  });
  return {
    max: acc.max,
    students: studentsOf_(cls).map(function (s) {
      var v = existing[String(s.roll)];
      return { roll: s.roll, name: s.name, value: v === undefined || v === null ? '' : v };
    })
  };
}

function normaliseMark_(v, max) {
  if (v === null || v === undefined) return '';
  var s = String(v).trim();
  if (s === '') return '';
  if (/^ab$/i.test(s)) return 'AB';
  var n = Number(s);
  if (!isFinite(n) || n < 0 || n > max) throw new Error('Marks must be between 0 and ' + max + ', or AB.');
  return Math.round(n * 100) / 100;
}

function saveMarks(pin, cls, subject, exam, entries) {
  cls = Number(cls);
  var acc = checkMarksAccess_(pin, cls, subject, exam);
  var valid = {};
  studentsOf_(cls).forEach(function (s) { valid[s.roll] = true; });
  var items = entries.map(function (e) {
    if (!valid[Number(e.roll)]) throw new Error('Roll ' + e.roll + ' is not in ' + nameClass_(cls) + '.');
    var values = {};
    try { values[exam] = normaliseMark_(e.value, acc.max); }
    catch (err) { throw new Error('Roll ' + e.roll + ': ' + err.message); }
    return {
      keys: { Roll: Number(e.roll), Subject: subject },
      values: values,
      stamp: { Teacher: acc.teacher.name, Updated: stamp_(false) }
    };
  });
  return withLock_(function () {
    var changed = upsert_('Marks', items);
    if (changed) log_(acc.teacher.name, subject + ' ' + exam + ' ' + nameClass_(cls) + ': ' + changed + ' row(s) saved');
    return { changed: changed };
  });
}

function checkDeskAccess_(pin, cls) {
  var t = auth_(pin);
  if (t.classTeacherOf.indexOf(cls) < 0) throw new Error('You are not the class teacher of ' + nameClass_(cls) + '.');
  return t;
}

function getClassDesk(pin, cls) {
  cls = Number(cls);
  checkDeskAccess_(pin, cls);
  var att = {};
  table_('Class').rows.forEach(function (r) { att[String(r.Roll).trim()] = r; });
  var grades = {};
  table_('ActGrades').rows.forEach(function (r) {
    var k = String(r.Roll).trim();
    (grades[k] = grades[k] || {})[String(r.Activity)] = String(r.Grade);
  });
  var workingDays = '';
  var students = studentsOf_(cls).map(function (s) {
    var a = att[String(s.roll)] || {};
    if (workingDays === '' && a['Working Days'] !== undefined && a['Working Days'] !== '') workingDays = a['Working Days'];
    return {
      roll: s.roll, name: s.name,
      present: a['Days Present'] === undefined ? '' : a['Days Present'],
      note: a.Note === undefined ? '' : String(a.Note),
      grades: grades[String(s.roll)] || {}
    };
  });
  return { workingDays: workingDays, students: students };
}

function saveAttendance(pin, cls, workingDays, rows) {
  cls = Number(cls);
  var t = checkDeskAccess_(pin, cls);
  var wd = Number(workingDays);
  if (!isFinite(wd) || wd < 0 || wd !== Math.floor(wd)) throw new Error('Working days must be a whole number.');
  var valid = {};
  studentsOf_(cls).forEach(function (s) { valid[s.roll] = true; });
  var items = rows.map(function (r) {
    if (!valid[Number(r.roll)]) throw new Error('Roll ' + r.roll + ' is not in ' + nameClass_(cls) + '.');
    var p = String(r.present === null || r.present === undefined ? '' : r.present).trim();
    if (p !== '') {
      var n = Number(p);
      if (!isFinite(n) || n < 0 || n !== Math.floor(n) || n > wd) {
        throw new Error('Roll ' + r.roll + ': days present must be a whole number from 0 to ' + wd + '.');
      }
      p = n;
    }
    return {
      keys: { Roll: Number(r.roll) },
      values: { 'Working Days': p === '' ? '' : wd, 'Days Present': p, Note: String(r.note || '').trim().slice(0, 300) },
      stamp: { Updated: stamp_(false) }
    };
  });
  return withLock_(function () {
    var changed = upsert_('Class', items);
    if (changed) log_(t.name, 'Attendance ' + nameClass_(cls) + ': ' + changed + ' row(s) saved');
    return { changed: changed };
  });
}

function saveActivity(pin, cls, activity, rows) {
  cls = Number(cls);
  var t = checkDeskAccess_(pin, cls);
  var acts = table_('Activities').rows.map(function (r) { return String(r.Name); });
  if (acts.indexOf(activity) < 0) throw new Error('Unknown activity: ' + activity);
  var valid = {};
  studentsOf_(cls).forEach(function (s) { valid[s.roll] = true; });
  var items = rows.map(function (r) {
    if (!valid[Number(r.roll)]) throw new Error('Roll ' + r.roll + ' is not in ' + nameClass_(cls) + '.');
    var g = String(r.grade || '').trim();
    if (g !== '' && ACTIVITY_GRADES.indexOf(g) < 0) throw new Error('Unknown grade: ' + g);
    return { keys: { Roll: Number(r.roll), Activity: activity }, values: { Grade: g } };
  });
  return withLock_(function () {
    var changed = upsert_('ActGrades', items);
    if (changed) log_(t.name, activity + ' grades ' + nameClass_(cls) + ': ' + changed + ' row(s) saved');
    return { changed: changed };
  });
}

/* ----------------------------- report cards ----------------------------- */

function gradeScale_() {
  return table_('Grades').rows
    .map(function (r) { return { min: Number(r.Min), grade: String(r.Grade) }; })
    .sort(function (a, b) { return b.min - a.min; });
}

function gradeOf_(scale, n) {
  for (var i = 0; i < scale.length; i++) if (n >= scale[i].min) return scale[i].grade;
  return scale.length ? scale[scale.length - 1].grade : '';
}

/** "96-100:A++, 91-95:A+, ..." built from the Grades tab */
function scaleText_(scale) {
  var hi = 100, parts = [];
  scale.forEach(function (s) { parts.push(s.min + '-' + hi + ':' + s.grade); hi = s.min - 1; });
  return 'Grading Scale: ' + parts.join(', ');
}

/** AB counts as 0, blank means "not entered yet" (null). */
function markVal_(v) {
  if (v === '' || v === null || v === undefined) return null;
  if (/^ab$/i.test(String(v).trim())) return 0;
  var n = Number(v);
  return isFinite(n) ? n : null;
}

function getReportData(pin, cls) {
  cls = Number(cls);
  var acc = reportAccess_(pin);
  if (acc.classes.indexOf(cls) < 0) throw new Error('You cannot print reports for ' + nameClass_(cls) + '.');

  var cfg = config_(), scale = gradeScale_();
  var weight = {
    FA1: Number(cfg.FA1Weight) || 25,
    FA2: Number(cfg.FA2Weight) || 25,
    SA1: Number(cfg.SA1Weight) || 50
  };
  var subjects = table_('Subjects').rows
    .filter(function (r) { return parseClasses_(r.Classes).indexOf(cls) >= 0; })
    .map(function (r) {
      return { name: String(r.Name).trim(),
               max: { FA1: Number(r['FA1 Max']), FA2: Number(r['FA2 Max']), SA1: Number(r['SA1 Max']) } };
    });
  var activities = table_('Activities').rows.map(function (r) { return String(r.Name); });

  var marks = {};
  table_('Marks').rows.forEach(function (r) { marks[String(r.Roll).trim() + '|' + String(r.Subject).trim()] = r; });
  var att = {};
  table_('Class').rows.forEach(function (r) { att[String(r.Roll).trim()] = r; });
  var actG = {};
  table_('ActGrades').rows.forEach(function (r) {
    (actG[String(r.Roll).trim()] = actG[String(r.Roll).trim()] || {})[String(r.Activity)] = String(r.Grade);
  });

  var cards = studentsOf_(cls).map(function (s) {
    var key = String(s.roll), missing = [], sumTotals = 0, allDone = subjects.length > 0;
    var rows = subjects.map(function (sub) {
      var r = marks[key + '|' + sub.name] || {};
      var done = true, total = 0, show = {};
      EXAMS.forEach(function (e) {
        var raw = r[e] === undefined || r[e] === null ? '' : r[e];
        show[e] = /^ab$/i.test(String(raw).trim()) ? 'AB' : raw;
        var n = markVal_(raw);
        if (n === null) { done = false; missing.push(sub.name + ' ' + e); }
        else if (sub.max[e] > 0) total += n / sub.max[e] * weight[e];
      });
      var t = done ? Math.round(total) : null;
      if (done) sumTotals += t; else allDone = false;
      return { name: sub.name, FA1: show.FA1, FA2: show.FA2, SA1: show.SA1,
               total: t, grade: done ? gradeOf_(scale, t) : '' };
    });
    var grand = allDone ? Math.round(sumTotals / subjects.length) : null;

    var a = att[key] || {};
    var wd = a['Working Days'] === undefined ? '' : a['Working Days'];
    var pr = a['Days Present'] === undefined ? '' : a['Days Present'];
    if (wd === '' || pr === '') missing.push('Attendance');
    var grades = actG[key] || {};
    var acts = activities.map(function (n) {
      if (!grades[n]) missing.push(n);
      return { name: n, grade: grades[n] || '' };
    });
    return {
      roll: s.roll, name: s.name, rows: rows,
      grandGrade: grand === null ? '' : gradeOf_(scale, grand),
      activities: acts, workingDays: wd, present: pr,
      note: a.Note === undefined ? '' : String(a.Note),
      missing: missing
    };
  });

  var logo = String(cfg.Logo || '');
  return {
    school: String(cfg.SchoolName || ''),
    address1: String(cfg.Address1 || ''),
    address2: String(cfg.Address2 || ''),
    title: String(cfg.ReportTitle || 'Progress Report'),
    exam: String(cfg.ExamTitle || '').trim() || DEFAULT_EXAM_TITLE,
    year: String(cfg.Year || ''),
    classLabel: String(cls),
    logo: logo.indexOf('data:image') === 0 ? logo : '',
    subjects: subjects,
    scaleText: scaleText_(scale),
    actScaleText: ACTIVITY_SCALE_TEXT,
    cards: cards
  };
}
