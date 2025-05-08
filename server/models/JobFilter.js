const mongoose = require('mongoose');

const jobFilterSchema = new mongoose.Schema({
  title: String,
  skills: [String],
  specialization: String,
  experience: Number,
  jobType: String,
  languages: [String],
  compensation: {
    min: Number,
    max: Number,
  },
  location: String,
  company: String,
},{ collection: 'jobs' });

module.exports = mongoose.model('JobFilter', jobFilterSchema);
