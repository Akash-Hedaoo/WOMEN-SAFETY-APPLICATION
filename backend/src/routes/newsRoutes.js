const express = require('express');
const { getWomenSafetyNews, getMapNewsAlerts } = require('../controllers/newsController');

const router = express.Router();
router.get('/', getWomenSafetyNews);
router.get('/map-alerts', getMapNewsAlerts);

module.exports = router;
