const Job = require('../models/JobFilter');

const filterJobs = async (req, res) => {
  try {
    const {
      search,
      skills,
      specialization,
      experience,
      jobType,
      languages,
      compensation,
      location
    } = req.body;

    const query = {};

    // Title or description search
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (skills?.length) {
      query.skills = { $all: skills };
    }

    if (specialization) {
      query.specialization = specialization;
    }

    // Experience filter with range overlap
    if (experience && typeof experience === "object") {
      query["experience.min"] = { $lte: experience.max };
      query["experience.max"] = { $gte: experience.min };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (languages?.length) {
      query.languages = { $all: languages };
    }

    // Compensation/salary filter
    if (compensation && compensation.min !== undefined && compensation.max !== undefined) {
      query["salary.min"] = { $lte: compensation.max };
      query["salary.max"] = { $gte: compensation.min };
    }
    if (location) {
        query.location = { $regex: location, $options: 'i' }; // Case-insensitive regex search for location
      }

    // Debug logs
    console.log("Final Query ===>", query);
    console.log("Final query being sent to MongoDB:", JSON.stringify(query, null, 2));
    const jobs = await Job.find(query);
    console.log("Matched Jobs ===>", jobs);

    res.status(200).json(jobs);
  } catch (err) {
    console.error("Error filtering jobs:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { filterJobs };
