/**
 * B.H. Copyright (c) 2026 Yemot HaMashiach Ltd.
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Yemot HaMashiach Ltd. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Yemot HaMashiach Ltd.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4500;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// יצירת תיקיית האחסון אם אינה קיימת
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// אחסון קבצים — שמירה על השם המקורי, ומניעת דריסה ע"י הוספת מספר
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // תיקון קידוד שם קובץ (עברית/UTF-8)
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safe = path.basename(original);
    let finalName = safe;
    let counter = 1;
    while (fs.existsSync(path.join(UPLOAD_DIR, finalName))) {
      const ext = path.extname(safe);
      const base = path.basename(safe, ext);
      finalName = `${base} (${counter})${ext}`;
      counter++;
    }
    cb(null, finalName);
  },
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));

// רשימת הקבצים הזמינים
app.get('/api/files', (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, names) => {
    if (err) return res.status(500).json({ error: 'שגיאה בקריאת התיקייה' });
    const files = names
      .map((name) => {
        const stat = fs.statSync(path.join(UPLOAD_DIR, name));
        return { name, size: stat.size, mtime: stat.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json(files);
  });
});

// העלאת קבצים (ניתן כמה בבת אחת)
app.post('/api/upload', upload.array('files'), (req, res) => {
  res.json({ ok: true, count: (req.files || []).length });
});

// הורדת קובץ
app.get('/api/download/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(filePath)) return res.status(404).send('הקובץ לא נמצא');
  res.download(filePath, name);
});

// מחיקת קובץ
app.delete('/api/files/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'הקובץ לא נמצא' });
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'שגיאה במחיקה' });
    res.json({ ok: true });
  });
});

// איתור כתובות IP מקומיות להצגה למשתמש
function getLocalIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIps();
  console.log('\n  שיתוף קבצים מקומי פועל! 🚀\n');
  console.log(`  במחשב זה:        http://localhost:${PORT}`);
  ips.forEach((ip) => {
    console.log(`  ממחשבים אחרים:   http://${ip}:${PORT}`);
  });
  console.log('\n  (יש לוודא שכל המחשבים מחוברים לאותה רשת)\n');
});
