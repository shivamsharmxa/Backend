const Job = require('../models/Job');
const asyncHandler = require('express-async-handler');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private/Employer
const createJob = asyncHandler(async (req, res) => {
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
    hospitalDetails
  } = req.body;

  if (!title || !company || !location || !area || !description || !requirements || !jobCategory || !department || !shift) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

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
    postedBy: req.user._id
  });

  res.status(201).json(job);
});

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  const {
    search,
    location,
    jobType,
    experience,
    salaryMin,
    salaryMax,
    page = 1,
    limit = 10
  } = req.query;

  const query = { status: 'Active' };

  if (search) {
    query.$text = { $search: search };
  }

  if (location) {
    query.location = new RegExp(location, 'i');
  }

  if (jobType) {
    query.jobType = jobType;
  }

  if (experience) {
    query['experience.min'] = { $lte: experience };
    query['experience.max'] = { $gte: experience };
  }

  if (salaryMin || salaryMax) {
    query['salary.min'] = { $gte: salaryMin || 0 };
    query['salary.max'] = { $lte: salaryMax || Number.MAX_SAFE_INTEGER };
  }

  const jobs = await Job.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('postedBy', 'name email');

  const count = await Job.countDocuments(query);

  res.json({
    jobs,
    totalPages: Math.ceil(count / limit),
    currentPage: Number(page)
  });
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
  if (!job) {
    res.status(404);
    throw new Error('Job not found');
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
    throw new Error('Job not found');
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this job');
  }

  const updatedJob = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json(updatedJob);
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Employer
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  if (job.postedBy.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this job');
  }

  await job.remove();

  res.json({ success: true, message: 'Job deleted' });
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private/JobSeeker
const applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error('Job not found');
  }

  if (job.applicants.includes(req.user._id)) {
    res.status(400);
    throw new Error('Already applied for this job');
  }

  job.applicants.push(req.user._id);
  await job.save();

  res.json({ success: true, message: 'Applied successfully' });
});

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob
};
