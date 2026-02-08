const mongoose = require('mongoose');

const ArtifactSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['document', 'image', 'video', 'link', 'slide', 'report', 'code'], required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const StudentSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    criteria: { type: mongoose.Schema.Types.ObjectId, ref: 'Criteria' },
    criteriaCode: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    courseCode: { type: String },
    semester: { type: String },
    tags: [{ type: String }],
    dateFrom: { type: Date },
    dateTo: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
    artifacts: { type: [ArtifactSchema], default: [] },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewerComment: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentSubmission', StudentSubmissionSchema);
