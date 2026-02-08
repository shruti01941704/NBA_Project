const mongoose = require('mongoose');

const CriteriaSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    maxMarks: {
      type: Number,
      default: 10,
      min: 5,
      max: 20, // Range of 5-20 as per requirements
    },
  },
  { timestamps: true }
);

const Criteria = mongoose.model('Criteria', CriteriaSchema);

module.exports = Criteria;
