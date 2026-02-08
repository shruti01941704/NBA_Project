const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema(
  {
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    criteria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Criteria',
      required: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentSubmission',
      required: false, // Optional - can evaluate criteria without specific submission
    },
    marks: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
      max: 100, // This will be validated against criteria.maxMarks in the controller
    },
    comments: {
      type: String,
      required: false,
      default: '',
    },
    academicYear: {
      type: String, // e.g., "2024-25"
      required: false,
    },
    evaluationDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure one evaluation per evaluator-criteria-submission combination
EvaluationSchema.index({ evaluator: 1, criteria: 1, submission: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);

