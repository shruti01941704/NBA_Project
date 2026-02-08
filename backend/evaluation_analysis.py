import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os
import webbrowser
from pathlib import Path

# Create output directory
output_dir = 'evaluation_reports'
os.makedirs(output_dir, exist_ok=True)

# Evaluation data
data = {
    'Criteria': [f'P.{i}' for i in range(1, 29)],
    'Marks': [8.0, 12.0, 1.0, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 3.0, 5.0, 3.0, 
              8.0, 6.0, 17.0, 11.0, 20.0, 16.0, 12.0, 10.0, 8.0, 15.0, 13.0, 
              1.0, 11.0, 5.0, 2.0, 10.0],
    'Description': [
        'Records of the processes used to define the vision, mission, PEO, PSO and PEO-Dept mission justification',
        'Publishing/dissemination of vision, mission, PEO, PO, PSO and stakeholder awareness',
        'Complex problems with sustainability and SDG initiatives (3 years)',
        'PO/PSO assessment tools, attainment, observations, actions (3 years)',
        'Quality assessment in CIE and SEE (papers, assignments, quizzes, etc.)',
        'Course file: plan, QPs, scripts, assignments, design projects, lab experiments',
        'COs assessment tools, attainment, observations, actions (3 years)',
        'Seats filled by quotas; quality of admitted students (rank/percent) (3 years)',
        'Program success rates; 1st–3rd year performance and improvements (3 years)',
        'Placements, higher studies, entrepreneurship outcomes (3 years)',
        'Professional societies and events organized (3 years)',
        'Tech magazines/newsletters/journals; inter-institute participation; publications/awards (3 years)',
        'Program curriculum records, structure, and compliance towards POs/PSOs',
        'Student-faculty ratio; faculty quals/designations/visiting; HR docs; retention; quals improvement (3 years)',
        'Faculty FDP/STTP/NPTEL/training participation & organization; MOOCs contributions/certifications (3 years)',
        'Faculty support in student innovation; faculty internship/training/industry collaboration (3 years)',
        'Faculty publications/books/chapters/patents/models/PhDs; R&D/consultancy approvals; seed money; products (3 years)',
        'Program-specific labs, project labs, research labs, CoE, industry-supported labs, computing, additional facilities',
        'Lab maintenance and safety measures',
        'Non-teaching staff: appointments, degrees, skill upgrades',
        'Academic audits, corrective measures, improvement in faculty qualification/contribution (3 years)',
        'Quality of curriculum and program-level education policy initiatives',
        'COs for all courses; mapping of courses to POs and PSOs',
        'Instructional methods and pedagogy (weak/bright) with impact analysis',
        'Industry-institute partnerships, internships, summer training with 3-year impact',
        'Capstone/mini/micro projects quality and rubrics with outcomes (3 years)',
        'Case studies and real-life examples',
        'MOOCs certifications (SWAYAM/NPTEL/etc.) counts'
    ]
}

df = pd.DataFrame(data)
df['Short_Desc'] = df['Description'].apply(lambda x: x[:30] + '...' if len(x) > 30 else x)
df['Performance'] = pd.cut(df['Marks'], 
                         bins=[0, 5, 10, 15, 25],
                         labels=['Needs Improvement', 'Below Average', 'Good', 'Excellent'])

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = [14, 8]
plt.rcParams['font.size'] = 10

# 1. Overall Performance
plt.figure(figsize=(16, 10))
ax = sns.barplot(x='Criteria', y='Marks', data=df.sort_values('Marks', ascending=False), 
                palette='viridis')
plt.axhline(y=7.4, color='r', linestyle='--', label='Average (7.4)')
plt.title('Evaluation Summary by Criteria', fontsize=16, pad=20)
plt.xlabel('Criteria', fontsize=14)
plt.ylabel('Marks', fontsize=14)
plt.xticks(rotation=90)
plt.legend()
plt.tight_layout()
plt.savefig(f'{output_dir}/evaluation_summary.png', dpi=300, bbox_inches='tight')
plt.close()

# 2. Score Distribution
plt.figure(figsize=(12, 6))
sns.histplot(df['Marks'], bins=10, kde=True, color='skyblue')
plt.axvline(x=7.4, color='r', linestyle='--', label='Average (7.4)')
plt.title('Distribution of Evaluation Scores', fontsize=16)
plt.xlabel('Marks', fontsize=14)
plt.ylabel('Frequency', fontsize=14)
plt.legend()
plt.savefig(f'{output_dir}/score_distribution.png', dpi=300, bbox_inches='tight')
plt.close()

# 3. Top and Bottom Performers
top_bottom = pd.concat([df.nlargest(5, 'Marks'), df.nsmallest(5, 'Marks')])
plt.figure(figsize=(14, 8))
ax = sns.barplot(x='Short_Desc', y='Marks', data=top_bottom, 
                palette=['green' if x >= 7.4 else 'red' for x in top_bottom['Marks']])
for i, (_, row) in enumerate(top_bottom.iterrows()):
    ax.text(i, row['Marks'] + 0.5, f"{row['Marks']:.1f}", 
            ha='center', va='bottom', fontsize=10, rotation=45)
plt.axhline(y=7.4, color='black', linestyle='--', label='Average (7.4)')
plt.title('Top 5 and Bottom 5 Performing Criteria', fontsize=16)
plt.xticks(rotation=45, ha='right')
plt.legend()
plt.tight_layout()
plt.savefig(f'{output_dir}/top_bottom_performers.png', dpi=300, bbox_inches='tight')
plt.close()

# 4. Performance Categories
plt.figure(figsize=(12, 6))
performance_counts = df['Performance'].value_counts().sort_index()
ax = sns.barplot(x=performance_counts.index, y=performance_counts.values, 
                palette='viridis')
for i, v in enumerate(performance_counts.values):
    ax.text(i, v + 0.2, str(v), ha='center', fontsize=12)
plt.title('Performance Distribution by Category', fontsize=16)
plt.xlabel('Performance Category', fontsize=14)
plt.ylabel('Number of Criteria', fontsize=14)
plt.tight_layout()
plt.savefig(f'{output_dir}/performance_categories.png', dpi=300, bbox_inches='tight')
plt.close()

# 5. Detailed Report with All Visualizations
html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Evaluation Summary Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .chart {{ margin: 20px 0; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }}
        .chart img {{ max-width: 100%; height: auto; }}
        .insights {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .good {{ color: green; }}
        .needs-improvement {{ color: red; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Evaluation Summary Report</h1>
        <p>Generated on {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="chart">
        <h2>1. Overall Performance by Criteria</h2>
        <img src="evaluation_summary.png" alt="Evaluation Summary">
    </div>
    
    <div class="chart">
        <h2>2. Score Distribution</h2>
        <img src="score_distribution.png" alt="Score Distribution">
    </div>
    
    <div class="chart">
        <h2>3. Top and Bottom Performers</h2>
        <img src="top_bottom_performers.png" alt="Top and Bottom Performers">
    </div>
    
    <div class="chart">
        <h2>4. Performance Categories</h2>
        <img src="performance_categories.png" alt="Performance Categories">
    </div>
    
    <div class="insights">
        <h2>Key Insights</h2>
        <h3>✅ Strengths (Scores ≥ 15):</h3>
        <ul>
            <li>Faculty research output (P.17): 20.0</li>
            <li>Faculty training and development (P.15): 17.0</li>
            <li>Lab facilities (P.18): 16.0</li>
        </ul>
        
        <h3>⚠️ Areas Needing Improvement (Scores ≤ 5):</h3>
        <ul>
            <li>Teaching methods (P.24): 1.0</li>
            <li>Sustainability initiatives (P.3): 1.0</li>
            <li>Program success rates (P.9): 1.0</li>
        </ul>
        
        <h3>📊 Overall Statistics:</h3>
        <ul>
            <li>Average Score: 7.4</li>
            <li>Highest Score: 20.0 (P.17 - Faculty research output)</li>
            <li>Lowest Score: 1.0 (Multiple criteria)</li>
            <li>Number of criteria below average: 15/28</li>
        </ul>
    </div>
</body>
</html>
"""

with open(f'{output_dir}/report.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

# Open the report in default browser
report_path = Path(f'{output_dir}/report.html').absolute()
webbrowser.open(f'file://{report_path}')

print(f"✅ Report and visualizations have been generated in the '{output_dir}' directory.")
print(f"📊 The report has been opened in your default web browser.")
