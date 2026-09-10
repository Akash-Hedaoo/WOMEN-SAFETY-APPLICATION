const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const checkIcccAuthorization = require('../middleware/icccAuthMiddleware');
const { submitComplaint, getComplaints, reviewComplaint, sendToGovernmentDemo } = require('../controllers/complaintController');

const router = express.Router();

router.post('/', protect, submitComplaint);
router.get('/', protect, checkIcccAuthorization, getComplaints);
router.patch('/:id/review', protect, checkIcccAuthorization, reviewComplaint);
router.post('/:id/send-to-government', protect, checkIcccAuthorization, sendToGovernmentDemo);

module.exports = router;
