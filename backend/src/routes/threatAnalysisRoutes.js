const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const { analyseVoice, analyseMovement } = require('../controllers/threatAnalysisController');

const router = express.Router();

const aiBackupLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Online AI backup is limited to 12 checks per minute. Local monitoring is still active.' }
});

router.post('/voice', protect, aiBackupLimiter, analyseVoice);
router.post('/movement', protect, aiBackupLimiter, analyseMovement);

module.exports = router;
