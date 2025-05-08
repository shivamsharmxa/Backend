const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob
} = require('../controllers/jobController');

// Fake auth middleware for now
const protect = (req, res, next) => {
  // Fake user for testing
  req.user = {
    _id: '6614f3051be0df476e257f08', // Replace with valid ObjectId from User collection
    name: 'Test User',
    email: 'test@example.com'
  };
  next();
};

router.route('/')
  .post(protect, createJob)
  .get(getJobs);

router.route('/:id')
  .get(getJob)
  .put(protect, updateJob)
  .delete(protect, deleteJob);

router.post('/:id/apply', protect, applyForJob);

module.exports = router;
