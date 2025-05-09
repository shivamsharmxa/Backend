const express = require("express");
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob,
} = require("../controllers/jobController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Add error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Job Route Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

router.route("/").post(authMiddleware, createJob).get(getJobs);

router
  .route("/:id")
  .get(getJob)
  .put(authMiddleware, updateJob)
  .delete(authMiddleware, deleteJob);

router.post("/:id/apply", authMiddleware, applyForJob);

// Apply error handling middleware
router.use(errorHandler);

module.exports = router;
