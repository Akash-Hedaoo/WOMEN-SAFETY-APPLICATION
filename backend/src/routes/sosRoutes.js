const express = require('express');
const router = express.Router();
const { triggerSos, cancelSos, markSafe, getSosHistory, getActiveSos, getIcccIncidents, updateIcccIncidentStatus } = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');
const checkIcccAuthorization = require('../middleware/icccAuthMiddleware');

router.use(protect);

router.post('/trigger', triggerSos);
router.post('/cancel', cancelSos);
router.post('/mark-safe', markSafe);
router.get('/history', getSosHistory);
router.get('/active', getActiveSos);

// ICCC Command Dashboard endpoints (Protected by operator check)
router.get('/iccc/incidents', checkIcccAuthorization, getIcccIncidents);
router.patch('/iccc/incidents/:id/status', checkIcccAuthorization, updateIcccIncidentStatus);

module.exports = router;

