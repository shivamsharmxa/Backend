const mongoose = require('mongoose');

// Create hospitalDetails sub-schema
const hospitalDetailsSchema = new mongoose.Schema({
  website: String,
  organizationSize: String,
  type: String,
  founded: Number,
  industry: String,
  addresses: [{
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    isPrimary: Boolean
  }]
}, { _id: false }); // Prevent auto-generating _id inside hospitalDetails

// Main Job Schema
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyLogo: {
    type: String,
    default: 'default-company.png'
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  area: {
    type: String,
    required: [true, 'Area/Neighborhood is required']
  },
  salary: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    period: { type: String, default: 'year', enum: ['hour', 'day', 'month', 'year'] }
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  requirements: {
    type: [String],
    required: [true, 'At least one requirement is needed']
  },
  skills: {
    type: [String],
    default: []
  },
  specializations: {
    type: [String],
    default: []
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    default: 'Full-time'
  },
  experience: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 5 }
  },
  employmentType: {
    type: String,
    enum: ['Permanent', 'Temporary', 'Contract'],
    default: 'Permanent'
  },
  jobCategory: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  shift: {
    type: String,
    required: true
  },
  openings: {
    type: Number,
    default: 1
  },
  languages: {
    type: [String],
    default: ['English']
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Draft'],
    default: 'Active'
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hospitalDetails: {
    type: hospitalDetailsSchema
  }
}, { timestamps: true });

// Text Search Index
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  company: 'text',
  skills: 'text',
  specializations: 'text'
});

module.exports = mongoose.model('Job', jobSchema);
