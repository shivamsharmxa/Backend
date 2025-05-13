const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed", error);
    process.exit(1);
  }
};
const migrateJobs = async () => {
  const jobs = await Job.find({});
  for (const job of jobs) {
    // Set default values for new fields
    job.area = job.area || job.location.split(',')[0];
    job.employmentType = job.employmentType || 'Permanent';
    job.jobCategory = job.jobCategory || 'Doctor';
    job.department = job.department || 'General';
    job.shift = job.shift || 'Morning Shift (9am - 3pm)';
    job.languages = job.languages || ['English', 'Hindi'];
    
    await job.save();
  }
};

module.exports = connectDB
