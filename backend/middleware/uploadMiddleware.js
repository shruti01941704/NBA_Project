const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}-${file.originalname}`
    );
  },
});

function checkFileType(file, cb) {
  const allowedExt = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.mp4', '.mov'];
  const name = file.originalname || '';
  const lower = name.toLowerCase();
  const hasExt = allowedExt.some(ext => lower.endsWith(ext));
  if (hasExt) return cb(null, true);
  const hint = (file.mimetype || '').toLowerCase();
  const allowedHints = ['jpeg', 'png', 'pdf', 'msword', 'presentation', 'spreadsheet', 'mp4', 'quicktime'];
  const hasMime = allowedHints.some(h => hint.includes(h));
  if (hasMime) return cb(null, true);
  cb('Unsupported file type');
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;
