# Abhyasa Vidyalayam – Marks Entry (teachers' web form)

A mobile-friendly page where teachers sign in with their PIN and enter data
straight into the "Abhyasa Marks 2026-27" Google Sheet. No server needed:
it runs as a Google Apps Script web app attached to the sheet.

## What teachers can do
- **Subject teachers** – pick Subject → Class → Exam (FA1 / FA2 / SA1), then type
  marks for each child. AB button for absent. Marks are checked against the
  maximum in the *Subjects* tab; the Save button stays off until everything is valid.
- **Class teachers** – *Attendance* (working days, days present, note) and
  *Activities* (one tap grade per child for Craft, Music, Dance, ...).
- A teacher only ever sees their own subject(s) and class(es) (from the *Teachers* tab).
  This is enforced on the server, not just hidden on the page.
- Every save is written to *Marks* / *Class* / *ActGrades* with the teacher's name and
  date, and a line is added to *Log*. Unchanged rows are not touched.

## One-time setup (about 5 minutes)
1. Open the sheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with `Code.gs` from this folder.
3. Add an HTML file (+ button → HTML) named exactly `Index` and paste `Index.html`.
4. Project Settings → tick **Show "appsscript.json"** and paste `appsscript.json` over it.
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Authorise when asked, then share the web-app link with teachers (add it to their phone's home screen).

After changing the code, use **Deploy → Manage deployments → Edit → New version**.

## Sheet rules the app relies on
- *Students*: `Roll` = class × 100 + number (101 = class 1, 902 = class 9, 1001 = class 10).
- *Teachers*: `Classes` and `ClassTeacherOf` like `1-10`, `6-10`, `1,3,5-7`.
  Keep these cells formatted as **plain text** so Sheets doesn't turn `6-10` into a date.
  A teacher can list several subjects separated by commas.
- Keep the column headers in each tab unchanged.
- Activity grades are A, B, C (`ACTIVITY_GRADES` at the top of `Code.gs`).

## Before real use
- Change the PINs (the sheet currently has sample PINs, and the Admin PIN is in plain text).
  Share the sheet itself only with people who should see every PIN.
- Test with one teacher first.

## Progress reports (printing)
Sign in with the **Admin PIN** (Config tab) to print any class, or with a class teacher's PIN
to print their own class. Choose the class -> **Open reports** -> **Print / Save as PDF**
(paper A4, margins None, headers and footers off). One child per page.

Each page follows the 2024 layout: header with logo, "Progress Report", the exam title,
Name / Class, then the Academic Record table with **Subject | FA1 | FA2 | SA1 | Overall Grade**
and a **Grand Grade** row, the activity grades, attendance, class teacher's notes and signatures.

- Subjects shown = the rows of the *Subjects* tab whose `Classes` include the child's class.
- Overall Grade: FA1 + FA2 + SA1 are scaled to the weights in *Config* (25/25/50), added,
  rounded to a whole number, and looked up in the *Grades* tab. AB counts as 0.
  A blank mark means "not entered yet": that subject's grade and the Grand Grade stay blank.
- Grand Grade: the average of all subject totals (rounded), graded on the same scale.
- Cards with missing marks, attendance or activity grades are flagged on screen only
  (the flag does not print). Tick "Only complete cards" to print just the finished ones.
- **Exam title:** set *Config > ExamTitle* to
  `Continuous Comprehensive Evaluation : Summative Assessment 1`
  (the year is added automatically). If left blank, that text is used.
- **Logo:** the school logo is built in. To use another one, put a data-URL image in *Config > Logo*.
