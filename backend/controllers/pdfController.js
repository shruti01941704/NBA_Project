const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { createCanvas } = require('canvas');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);
const Evaluation = require('../models/Evaluation');
const StudentSubmission = require('../models/StudentSubmission');
const Criteria = require('../models/Criteria');

// Helper function to generate a bar chart
async function generateBarChart(labels, data, title) {
    const width = 600;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create gradient for the chart
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(54, 162, 235, 0.7)');
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0.7)');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: gradient,
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Marks (%)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    return canvas.toBuffer('image/png');
}

// Helper function to add a header to each page
function addHeader(doc, pageNumber, totalPages) {
    const originalY = doc.y;
    doc.fontSize(10)
       .text('Evaluation Summary Report', 50, 40)
       .text(`Page ${pageNumber} of ${totalPages}`, 500, 40, { align: 'right' });
    doc.moveTo(50, 55).lineTo(550, 55).stroke('#e0e0e0');
    doc.y = originalY;
}

// Helper function to add a footer to each page
function addFooter(doc) {
    const bottomY = 780; // Adjust based on your page size
    doc.fontSize(8)
       .text('Confidential - For internal use only', 50, bottomY, {
           align: 'center',
           width: 500
       });
}

// Generate evaluation summary PDF
exports.generateEvaluationSummary = async (evaluatorId) => {
    console.log(`[PDF Generation] Starting PDF generation for evaluator: ${evaluatorId}`);
    
    try {
        // Get all evaluations for the evaluator with detailed population
        console.log(`[PDF Generation] Fetching evaluations for evaluator: ${evaluatorId}`);
        
        const evaluations = await Evaluation.find({ evaluator: evaluatorId })
            .populate('criteria', 'code name description')
            .populate('submission', 'title student')
            .populate('submission.student', 'name email')
            .sort({ 'criteria.code': 1, 'evaluationDate': -1 });

        console.log(`[PDF Generation] Found ${evaluations.length} evaluations`);
        
        if (evaluations.length === 0) {
            const error = new Error('No evaluations found for this evaluator');
            console.error('[PDF Generation] Error:', error.message);
            throw error;
        }

        // Group evaluations by criteria
        const byCriteria = {};
        evaluations.forEach(evalItem => {
            const criteriaId = evalItem.criteria._id.toString();
            if (!byCriteria[criteriaId]) {
                byCriteria[criteriaId] = {
                    criteria: evalItem.criteria,
                    evaluations: []
                };
            }
            byCriteria[criteriaId].evaluations.push(evalItem);
        });

        // Calculate overall statistics
        const allMarks = evaluations.map(e => e.marks).filter(m => m !== undefined);
        const overallStats = {
            totalEvaluations: evaluations.length,
            totalCriteria: Object.keys(byCriteria).length,
            avgMarks: allMarks.length > 0 ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(2) : 0,
            maxMarks: allMarks.length > 0 ? Math.max(...allMarks) : 0,
            minMarks: allMarks.length > 0 ? Math.min(...allMarks) : 0
        };

        // Create a new PDF document with better defaults
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            bufferPages: true  // Required for page numbers
        });
        
        // Generate a unique filename with date
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const filename = `evaluation-summary-${formattedDate}.pdf`;
        const filePath = path.join(__dirname, '../reports', filename);
        
        // Ensure reports directory exists
        const reportsDir = path.join(__dirname, '../reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Create a write stream
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Track page numbers
        let pageNumber = 1;
        const totalPages = 1; // Will be updated later
        
        // Function to add a new page with header/footer
        const addNewPage = () => {
            doc.addPage();
            pageNumber++;
            addHeader(doc, pageNumber, totalPages);
            doc.moveDown(2);
        };

        // Cover Page
        doc.fontSize(24).text('EVALUATION SUMMARY REPORT', {
            align: 'center',
            underline: true,
            lineGap: 10
        });
        
        doc.moveDown(3);
        doc.fontSize(16).text('Comprehensive Evaluation Report', { align: 'center' });
        doc.moveDown(2);
        doc.fontSize(12).text(`Generated on: ${now.toLocaleDateString()}`, { align: 'center' });
        doc.text(`Total Evaluations: ${overallStats.totalEvaluations}`, { align: 'center' });
        doc.text(`Total Criteria: ${overallStats.totalCriteria}`, { align: 'center' });
        doc.text(`Overall Average: ${overallStats.avgMarks}%`, { align: 'center' });
        
        doc.moveDown(5);
        doc.fontSize(10).text('Confidential - For internal use only', { align: 'center' });

        // Table of Contents
        addNewPage();
        doc.fontSize(18).text('TABLE OF CONTENTS', { align: 'center', underline: true });
        doc.moveDown(2);
        
        // Add TOC items
        doc.fontSize(12).text('1. Executive Summary', { indent: 20 });
        doc.text('2. Criteria-wise Analysis', { indent: 20 });
        
        let tocIndex = 3;
        Object.entries(byCriteria).forEach(([_, { criteria }], idx) => {
            doc.text(`${tocIndex++}. ${criteria.code} - ${criteria.name}`, { indent: 30 });
        });
        
        // Executive Summary
        addNewPage();
        doc.fontSize(18).text('1. EXECUTIVE SUMMARY', { underline: true });
        doc.moveDown();
        
        // Summary statistics
        doc.fontSize(14).text('Overall Statistics', { underline: true });
        doc.moveDown(0.5);
        
        // Create a summary table
        const summaryTable = {
            headers: ['Metric', 'Value'],
            rows: [
                ['Total Evaluations', overallStats.totalEvaluations],
                ['Total Criteria Evaluated', overallStats.totalCriteria],
                ['Average Marks', `${overallStats.avgMarks}%`],
                ['Highest Score', `${overallStats.maxMarks}%`],
                ['Lowest Score', `${overallStats.minMarks}%`]
            ]
        };
        
        // Draw the summary table
        const startY = doc.y;
        const cellPadding = 5;
        const col1Width = 200;
        const col2Width = 100;
        
        // Draw headers
        doc.rect(50, startY, col1Width, 20).fillAndStroke('#f0f0f0', '#000000');
        doc.rect(50 + col1Width, startY, col2Width, 20).fillAndStroke('#f0f0f0', '#000000');
        
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text(summaryTable.headers[0], 55, startY + 5);
        doc.text(summaryTable.headers[1], 55 + col1Width, startY + 5, { width: col2Width - 10, align: 'right' });
        
        // Draw rows
        doc.font('Helvetica').fontSize(10);
        summaryTable.rows.forEach((row, i) => {
            const y = startY + 20 + (i * 20);
            doc.rect(50, y, col1Width, 20).stroke();
            doc.rect(50 + col1Width, y, col2Width, 20).stroke();
            
            doc.text(row[0], 55, y + 5);
            doc.text(row[1], 55 + col1Width, y + 5, { width: col2Width - 10, align: 'right' });
        });
        
        doc.moveDown(2);
        
        // Criteria-wise Analysis
        doc.addPage();
        doc.fontSize(18).text('2. CRITERIA-WISE ANALYSIS', { underline: true });
        doc.moveDown();
        
        // Process each criteria
        for (const [criteriaId, data] of Object.entries(byCriteria)) {
            const { criteria, evaluations } = data;
            const marks = evaluations.map(e => e.marks).filter(m => m !== undefined);
            const avgMarks = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2) : 'N/A';
            const maxMarks = marks.length > 0 ? Math.max(...marks) : 'N/A';
            const minMarks = marks.length > 0 ? Math.min(...marks) : 'N/A';
            
            // Check if we need a new page
            if (doc.y > 650) {
                addNewPage();
            } else {
                doc.moveDown();
            }
            
            // Criteria header
            doc.fontSize(14).text(`${criteria.code} - ${criteria.name}`, {
                underline: true,
                paragraphGap: 5
            });
            
            if (criteria.description) {
                doc.fontSize(10).text(criteria.description, {
                    paragraphGap: 5
                });
            }
            
            // Criteria stats
            doc.fontSize(10).text(`• Total Evaluations: ${evaluations.length}`, {
                indent: 20,
                paragraphGap: 2
            });
            doc.text(`• Average Marks: ${avgMarks}%`, { indent: 20, paragraphGap: 2 });
            doc.text(`• Highest Marks: ${maxMarks}%`, { indent: 20, paragraphGap: 2 });
            doc.text(`• Lowest Marks: ${minMarks}%`, { indent: 20, paragraphGap: 2 });
            
            // Add a chart if we have enough data
            if (marks.length > 1) {
                try {
                    const chartData = evaluations.map(e => ({
                        label: e.submission ? e.submission.student?.name || 'Unknown' : 'General',
                        value: e.marks || 0,
                        date: e.evaluationDate
                    }));
                    
                    // Sort by date
                    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    const chartImage = await generateBarChart(
                        chartData.map((d, i) => `Eval ${i + 1}`),
                        chartData.map(d => d.value),
                        `Marks Distribution - ${criteria.code}`
                    );
                    
                    // Add chart to PDF
                    const chartY = doc.y + 10;
                    doc.image(chartImage, 50, chartY, { width: 500 });
                    doc.y = chartY + 200; // Adjust based on chart height
                } catch (error) {
                    console.error('Error generating chart:', error);
                    doc.text('Chart generation skipped for this criteria', { indent: 20 });
                }
            }
            
            // Add a divider
            doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke('#e0e0e0');
            doc.moveDown(0.5);
        }
        
        // Add detailed evaluations section
        addNewPage();
        doc.fontSize(18).text('3. DETAILED EVALUATIONS', { underline: true });
        doc.moveDown();
        
        // Add each evaluation
        evaluations.forEach((evaluation, index) => {
            // Check for page break
            if (doc.y > 700) {
                addNewPage();
            } else if (index > 0) {
                doc.moveDown();
            }
            
            doc.fontSize(10);
            doc.font('Helvetica-Bold').text(`Evaluation ${index + 1}:`);
            doc.font('Helvetica');
            
            const details = [
                `Criteria: ${evaluation.criteria.code} - ${evaluation.criteria.name}`,
                evaluation.submission 
                    ? `Submission: ${evaluation.submission.title}`
                    : 'Type: General Criteria Evaluation',
                evaluation.submission?.student 
                    ? `Student: ${evaluation.submission.student.name} (${evaluation.submission.student.email})`
                    : null,
                `Marks: ${evaluation.marks || 'N/A'}%`,
                evaluation.comments ? `Comments: ${evaluation.comments}` : null,
                `Date: ${new Date(evaluation.evaluationDate).toLocaleDateString()}`
            ].filter(Boolean);
            
            details.forEach((detail, i) => {
                doc.text(`• ${detail}`, { indent: 20, paragraphGap: 2 });
            });
            
            // Add a thin divider
            doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#f0f0f0');
        });
        
        // Add final page with summary
        addNewPage();
        doc.fontSize(18).text('REPORT SUMMARY', { align: 'center', underline: true });
        doc.moveDown(2);
        
        doc.fontSize(12).text('This report contains a comprehensive analysis of all evaluations conducted.', {
            align: 'center',
            width: 500
        });
        
        doc.moveDown();
        doc.text(`Total Evaluations: ${overallStats.totalEvaluations}`, { align: 'center' });
        doc.text(`Average Score: ${overallStats.avgMarks}%`, { align: 'center' });
        
        doc.moveDown(3);
        doc.text('--- End of Report ---', { align: 'center' });
        
        // Finalize the PDF
        doc.end();

        // Return a promise that resolves when the PDF is fully written
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve({
                filename,
                path: filePath
            }));
            writeStream.on('error', reject);
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

// Route handler for generating evaluation summary
exports.getEvaluationSummaryPDF = async (req, res) => {
    let filePath;
    
    try {
        console.log('PDF Generation - Starting...');
        
        if (!req.user || !req.user._id) {
            console.error('PDF Generation - Unauthorized: No user or user ID found');
            return res.status(401).json({ message: 'Authentication required' });
        }

        console.log(`PDF Generation - User ID: ${req.user._id}`);
        
        // Generate the PDF
        const result = await exports.generateEvaluationSummary(req.user._id);
        
        if (!result || !result.filename || !result.path) {
            throw new Error('Failed to generate PDF: Invalid result from generateEvaluationSummary');
        }
        
        filePath = result.path;
        const filename = result.filename;
        
        console.log(`PDF Generation - PDF generated at: ${filePath}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`Generated PDF file not found at: ${filePath}`);
        }
        
        // Get file stats
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
            throw new Error('Generated PDF file is empty');
        }
        
        console.log(`PDF Generation - File size: ${stats.size} bytes`);
        
        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (error) => {
            console.error('Error reading PDF file:', error);
            if (!res.headersSent) {
                res.status(500).json({ 
                    message: 'Error reading generated PDF', 
                    error: error.message 
                });
            }
        });
        
        fileStream.pipe(res);
        
        // Delete the file after streaming
        fileStream.on('end', () => {
            console.log('PDF Generation - File sent successfully, cleaning up...');
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting temporary PDF file:', err);
                } else {
                    console.log('PDF Generation - Temporary file deleted');
                }
            });
        });
        
    } catch (error) {
        console.error('Error in getEvaluationSummaryPDF:', error);
        
        // Clean up the file if it was created
        if (filePath && fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error cleaning up failed PDF file:', err);
            });
        }
        
        if (!res.headersSent) {
            res.status(500).json({ 
                message: 'Error generating evaluation summary', 
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};
