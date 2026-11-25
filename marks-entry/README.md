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
- Activity grades offered are set in `ACTIVITY_GRADES` at the top of `Code.gs` (A, B, C, D).

## Before real use
- Change the PINs (the sheet currently has sample PINs, and the Admin PIN is in plain text).
  Share the sheet itself only with people who should see every PIN.
- Test with one teacher first.
