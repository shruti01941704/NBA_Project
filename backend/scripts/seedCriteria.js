/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Criteria = require('../models/Criteria');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    const criteriaItems = [
      { code: 'P.1', name: 'Records of the processes used to define the vision, mission, PEO, PSO and PEO-Dept mission justification', description: '' },
      { code: 'P.2', name: 'Publishing/dissemination of vision, mission, PEO, PO, PSO and stakeholder awareness', description: '' },
      { code: 'P.3', name: 'Program curriculum records, structure, and compliance towards POs/PSOs', description: '' },
      { code: 'P.4', name: 'Quality of curriculum and program-level education policy initiatives', description: '' },
      { code: 'P.5', name: 'COs for all courses; mapping of courses to POs and PSOs', description: '' },
      { code: 'P.6', name: 'Instructional methods and pedagogy (weak/bright) with impact analysis', description: '' },
      { code: 'P.7', name: 'Industry-institute partnerships, internships, summer training with 3-year impact', description: '' },
      { code: 'P.8', name: 'Capstone/mini/micro projects quality and rubrics with outcomes (3 years)', description: '' },
      { code: 'P.9', name: 'Case studies and real-life examples', description: '' },
      { code: 'P.10', name: 'MOOCs certifications (SWAYAM/NPTEL/etc.) counts', description: '' },
      { code: 'P.11', name: 'Complex problems with sustainability and SDG initiatives (3 years)', description: '' },
      { code: 'P.12', name: 'PO/PSO assessment tools, attainment, observations, actions (3 years)', description: '' },
      { code: 'P.13', name: 'Quality assessment in CIE and SEE (papers, assignments, quizzes, etc.)', description: '' },
      { code: 'P.14', name: 'Course file: plan, QPs, scripts, assignments, design projects, lab experiments', description: '' },
      { code: 'P.15', name: 'COs assessment tools, attainment, observations, actions (3 years)', description: '' },
      { code: 'P.16', name: 'Seats filled by quotas; quality of admitted students (rank/percent) (3 years)', description: '' },
      { code: 'P.17', name: 'Program success rates; 1st–3rd year performance and improvements (3 years)', description: '' },
      { code: 'P.18', name: 'Placements, higher studies, entrepreneurship outcomes (3 years)', description: '' },
      { code: 'P.19', name: 'Professional societies and events organized (3 years)', description: '' },
      { code: 'P.20', name: 'Tech magazines/newsletters/journals; inter-institute participation; publications/awards (3 years)', description: '' },
      { code: 'P.21', name: 'Student-faculty ratio; faculty quals/designations/visiting; HR docs; retention; quals improvement (3 years)', description: '' },
      { code: 'P.22', name: 'Faculty FDP/STTP/NPTEL/training participation & organization; MOOCs contributions/certifications (3 years)', description: '' },
      { code: 'P.23', name: 'Faculty support in student innovation; faculty internship/training/industry collaboration (3 years)', description: '' },
      { code: 'P.24', name: 'Faculty publications/books/chapters/patents/models/PhDs; R&D/consultancy approvals; seed money; products (3 years)', description: '' },
      { code: 'P.25', name: 'Program-specific labs, project labs, research labs, CoE, industry-supported labs, computing, additional facilities', description: '' },
      { code: 'P.26', name: 'Lab maintenance and safety measures', description: '' },
      { code: 'P.27', name: 'Non-teaching staff: appointments, degrees, skill upgrades', description: '' },
      { code: 'P.28', name: 'Academic audits, corrective measures, improvement in faculty qualification/contribution (3 years)', description: '' },
    ];

    const ops = criteriaItems.map((it) => ({
      updateOne: {
        filter: { code: it.code },
        update: { $set: it },
        upsert: true,
      },
    }));

    const upsertRes = await Criteria.bulkWrite(ops, { ordered: false });
    console.log('Bulk upsert result:', JSON.stringify(upsertRes, null, 2));

    const assignments = [
      { code: 'P.1', names: ['Dr. N. L. Gavankar', 'Ms. S. S. Rokade', 'Mrs. L. V. Patil'] },
      { code: 'P.2', names: ['Dr. N. L. Gavankar', 'Ms. S. S. Rokade', 'Mrs. L. V. Patil'] },
      { code: 'P.3', names: ['Dr. N. L. Gavankar', 'Ms. S. S. Rokade', 'Mrs. L. V. Patil'] },
      { code: 'P.4', names: ['Dr. N. L. Gavankar', 'Ms. S. S. Rokade', 'Mrs. L. V. Patil'] },
      { code: 'P.5', names: ['Ms. A. S. Pawar', 'Mrs. S. A. Aitwade', 'Mr. Yogesh Mane'] },
      { code: 'P.6', names: ['Mr. S. D. Pujari', 'Ms. M. S. Dabade', 'Mr. Dattawadkar'] },
      { code: 'P.7', names: ['Mr. S. D. Pujari', 'Ms. M. S. Dabade', 'Mr. Dattawadkar'] },
      { code: 'P.8', names: ['Mr. S. D. Pujari', 'Ms. M. S. Dabade', 'Mr. Dattawadkar'] },
      { code: 'P.9', names: ['Mr. S. D. Pujari', 'Ms. M. S. Dabade', 'Mr. Dattawadkar'] },
      { code: 'P.10', names: ['Mr. S. D. Pujari', 'Ms. M. S. Dabade', 'Mr. Dattawadkar'] },
      { code: 'P.11', names: ['Mr. S. D. Pujari', 'Ms. M. S. Dabade', 'Mr. Dattawadkar'] },
      { code: 'P.12', names: ['Dr. B. F. Momin', 'Ms. N. L. Mudegol', 'Mr. K. S. Khandagale', 'Ms. A. S. Pawar', 'Mrs. S. A. Aitwade', 'Mr. Yogesh Mane'] },
      { code: 'P.13', names: ['Ms. A. S. Pawar', 'Mrs. S. A. Aitwade', 'Mr. Yogesh Mane'] },
      { code: 'P.14', names: ['Ms. A. S. Pawar', 'Mrs. S. A. Aitwade', 'Mr. Yogesh Mane'] },
      { code: 'P.15', names: ['Dr. B. F. Momin', 'Ms. N. L. Mudegol', 'Mr. K. S. Khandagale', 'Ms. A. S. Pawar', 'Mrs. S. A. Aitwade', 'Mr. Yogesh Mane'] },
      { code: 'P.16', names: ['Dr. A. M. Chimanna', 'Ms. P. R. Patil', 'Ms. A. Kholkhumbe'] },
      { code: 'P.17', names: ['Dr. A. M. Chimanna', 'Ms. P. R. Patil', 'Ms. A. Kholkhumbe'] },
      { code: 'P.18', names: ['Dr. A. M. Chimanna', 'Ms. P. R. Patil', 'Ms. A. Kholkhumbe'] },
      { code: 'P.19', names: ['Dr. A. M. Chimanna', 'Ms. P. R. Patil', 'Ms. A. Kholkhumbe'] },
      { code: 'P.20', names: ['Dr. A. M. Chimanna', 'Ms. P. R. Patil', 'Ms. A. Kholkhumbe'] },
      { code: 'P.21', names: ['Ms. P. D. Mundada', 'Mr. Chandoba'] },
      { code: 'P.22', names: ['Ms. Sana Shaikh', 'Mr. Ashitosh Karanje'] },
      { code: 'P.23', names: ['Ms. Sana Shaikh', 'Mr. Ashitosh Karanje'] },
      { code: 'P.24', names: ['Ms. Sana Shaikh', 'Mr. Ashitosh Karanje'] },
      { code: 'P.25', names: ['Mr. M. K. Chavan', 'Ms. A. A. Pawde', 'Mr. M. H. Bhide'] },
      { code: 'P.26', names: ['Mr. M. K. Chavan', 'Ms. A. A. Pawde', 'Mr. M. H. Bhide'] },
      { code: 'P.27', names: ['Mr. M. K. Chavan', 'Ms. A. A. Pawde', 'Mr. M. H. Bhide'] },
      { code: 'P.28', names: ['Dr. B. F. Momin', 'Ms. N. L. Mudegol', 'Mr. K. S. Khandagale'] },
    ];

    // Ensure users exist for all names (role: faculty)
    const allNames = Array.from(
      new Set(assignments.flatMap(a => a.names))
    );

    const ensureUser = async (name) => {
      let user = await User.findOne({ name, role: 'faculty' });
      if (!user) {
        const email = `${name.replace(/[^a-zA-Z]/g, '').toLowerCase()}@faculty.local`;
        user = await User.create({ name, email, password: 'TempPass@123!', role: 'faculty' });
        console.log('Created faculty:', name);
      }
      return user;
    };

    for (const a of assignments) {
      const criteria = await Criteria.findOne({ code: a.code });
      if (!criteria) {
        console.warn('Criteria not found for code', a.code);
        continue;
      }
      for (const nm of a.names) {
        const fac = await ensureUser(nm);
        if (!Array.isArray(fac.assignedCriteria)) fac.assignedCriteria = [];
        const already = fac.assignedCriteria.some((id) => id.toString() === criteria._id.toString());
        if (!already) {
          fac.assignedCriteria.push(criteria._id);
          await fac.save();
          console.log(`Assigned ${nm} -> ${a.code}`);
        }
      }
    }

    // Print verification summary
    const criterias = await Criteria.find({}).lean();
    const users = await User.find({ role: 'faculty' }).select('name email assignedCriteria').lean();
    const byId = new Map(criterias.map((c) => [c._id.toString(), { ...c, faculty: [] }]));
    for (const u of users) {
      if (Array.isArray(u.assignedCriteria)) {
        for (const cid of u.assignedCriteria) {
          const bucket = byId.get(cid.toString());
          if (bucket) bucket.faculty.push({ name: u.name, email: u.email });
        }
      }
    }
    const summary = Array.from(byId.values()).map(({ code, name, faculty }) => ({ code, name, facultyCount: faculty.length }));
    console.log('Assignment summary:', JSON.stringify(summary, null, 2));

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
})();
