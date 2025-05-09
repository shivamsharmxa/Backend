const Job = require("../models/Job");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private/Employer
const createJob = asyncHandler(async (req, res) => {
  try {
    console.log("Starting job creation process");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Creating job with user:", req.user?._id);

    if (!req.user || !req.user._id) {
      console.error("No authenticated user found");
      res.status(401);
      throw new Error("Not authenticated");
    }

    const {
      title,
      company,
      companyLogo,
      location,
      area,
      salary,
      description,
      requirements,
      skills,
      specializations,
      jobType,
      experience,
      employmentType,
      jobCategory,
      department,
      shift,
      openings,
      languages,
      hospitalDetails,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      title,
      company,
      location,
      area,
      description,
      requirements,
      jobCategory,
      department,
      shift,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      res.status(400);
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    console.log("Creating job document...");
    const job = await Job.create({
      title,
      company,
      companyLogo: companyLogo || undefined,
      location,
      area,
      salary,
      description,
      requirements,
      skills,
      specializations,
      jobType,
      experience,
      employmentType,
      jobCategory,
      department,
      shift,
      openings,
      languages,
      hospitalDetails,
      postedBy: req.user._id,
    });

    console.log("Job created successfully:", job._id);

    // Find all followers of the user who posted the job, excluding the job poster
    console.log("Finding followers for user:", req.user._id);
    const followers = await Follow.find({
      following: req.user._id,
      follower: { $ne: req.user._id }, // Exclude the job poster from followers list
    });
    console.log("Found followers (excluding job poster):", followers.length);

    if (followers.length > 0) {
      console.log("Creating notifications for followers...");
      const notifications = await Promise.all(
        followers.map(async (follower) => {
          console.log("Creating notification for follower:", follower.follower);
          const notification = await Notification.create({
            type: "NEW_JOB",
            sender: req.user._id,
            recipient: follower.follower,
            jobId: job._id,
          });
          console.log("Created notification:", notification._id);
          return { notification, followerId: follower.follower };
        })
      );

      // Get the current user's details
      console.log("Getting current user details...");
      const currentUser = await User.findById(req.user._id);
      console.log("Current user:", currentUser.username);

      // Emit socket events for real-time notifications
      const io = req.app.get("io");
      if (!io) {
        console.error("Socket.io instance not found in app");
      } else {
        console.log("Emitting notifications via socket.io");
        notifications.forEach(({ notification, followerId }) => {
          console.log("Emitting notification to follower:", followerId);
          io.to(followerId.toString()).emit("notification", {
            type: "NEW_JOB",
            senderId: req.user._id,
            senderName: currentUser.username,
            jobId: job._id,
            jobTitle: title,
            company: company,
            notificationId: notification._id,
          });
        });
      }
    }

    res.status(201).json(job);
  } catch (error) {
    console.error("Error in createJob:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error creating job",
      error: error.message,
      stack: error.stack,
    });
  }
});

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  try {
    console.log("Received request for getJobs with query:", req.query);
    const {
      search,
      location,
      jobType,
      experience,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { status: "Active" };
    console.log("Building query object...");

    if (search) {
      console.log("Adding text search for:", search);
      query.$text = { $search: search };
    }

    if (location) {
      console.log("Adding location filter for:", location);
      query.location = new RegExp(location, "i");
    }

    if (jobType) {
      console.log("Adding jobType filter for:", jobType);
      query.jobType = jobType;
    }

    if (experience) {
      console.log("Adding experience filter for:", experience);
      query["experience.min"] = { $lte: experience };
      query["experience.max"] = { $gte: experience };
    }

    if (salaryMin || salaryMax) {
      console.log("Adding salary range filter:", { salaryMin, salaryMax });
      query["salary.min"] = { $gte: salaryMin || 0 };
      query["salary.max"] = { $lte: salaryMax || Number.MAX_SAFE_INTEGER };
    }

    console.log("Final query object:", query);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("postedBy", "name email");

    console.log(`Found ${jobs.length} jobs`);

    const count = await Job.countDocuments(query);
    console.log("Total job count:", count);

    res.json({
      jobs,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error in getJobs:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching jobs",
      error: error.message,
      stack: error.stack,
    });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "postedBy",
    "name email"
  );
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  res.json(job);
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Employer
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to update this job");
  }

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json(updatedJob);
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Employer
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to delete this job");
  }

  await job.remove();

  res.json({ success: true, message: "Job deleted" });
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private/JobSeeker
const applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  if (job.applicants.includes(req.user._id)) {
    res.status(400);
    throw new Error("Already applied for this job");
  }

  job.applicants.push(req.user._id);
  await job.save();

  res.json({ success: true, message: "Applied successfully" });
});

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob,
};
