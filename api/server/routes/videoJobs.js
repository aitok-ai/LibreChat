const express = require('express');
const { requireJwtAuth, checkBan, uaParser } = require('~/server/middleware');
const router = express.Router();
const VideoJobsController = require('../controllers/videoJobs');

router.use(requireJwtAuth);
router.use(checkBan);
router.use(uaParser);

// Create a new video job
router.post('/', VideoJobsController.createVideoJob);

// Get status of a video job
router.get('/:id', VideoJobsController.getVideoJob);

// Cancel a video job
router.post('/:id/cancel', VideoJobsController.cancelVideoJob);

// Download render ZIP (and MP4 if needed)
router.get('/:id/download/zip', VideoJobsController.downloadZip);

module.exports = router;
