const express = require('express');
const router = express.Router();
const { filterJobs } = require('../controllers/jobFilterController');

// POST request to filter jobs
router.post('/filter', filterJobs);

module.exports = router;
