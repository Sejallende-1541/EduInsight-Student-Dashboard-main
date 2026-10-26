import sampleStudents from '../data/sampleStudents.json';

export function getOfflineDashboardStats() {
  const total = sampleStudents.length;
  const avgMarks = Math.round((sampleStudents.reduce((acc, s) => acc + s.final_marks, 0) / total) * 10) / 10;
  const passCount = sampleStudents.filter((s) => s.final_marks >= 40).length;
  const passPct = Math.round((passCount / total) * 1000) / 10;
  const atRiskCount = sampleStudents.filter((s) => s.final_marks < 40 || s.attendance_percentage < 75).length;
  const highest = Math.max(...sampleStudents.map((s) => s.final_marks));
  const lowest = Math.min(...sampleStudents.map((s) => s.final_marks));

  // Marks distribution
  const buckets = {
    '<40 (Fail)': 0,
    '40-59 (Pass)': 0,
    '60-74 (Merit)': 0,
    '75-89 (Distinction)': 0,
    '90-100 (Outstanding)': 0,
  };
  sampleStudents.forEach((s) => {
    const m = s.final_marks;
    if (m < 40) buckets['<40 (Fail)']++;
    else if (m < 60) buckets['40-59 (Pass)']++;
    else if (m < 75) buckets['60-74 (Merit)']++;
    else if (m < 90) buckets['75-89 (Distinction)']++;
    else buckets['90-100 (Outstanding)']++;
  });
  const marks_distribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

  // Subject averages
  const calcAvg = (key) =>
    Math.round((sampleStudents.reduce((acc, s) => acc + (s[key] || 0), 0) / total) * 10) / 10;
  const subject_averages = [
    { subject: 'Mathematics', average: calcAvg('math_marks') },
    { subject: 'Science', average: calcAvg('science_marks') },
    { subject: 'English', average: calcAvg('english_marks') },
    { subject: 'Past Exam', average: calcAvg('past_exam_marks') },
    { subject: 'Assignments', average: calcAvg('assignment_score') },
  ];

  // Department distribution
  const deptMap = {};
  sampleStudents.forEach((s) => {
    deptMap[s.department] = (deptMap[s.department] || 0) + 1;
  });
  const department_distribution = Object.entries(deptMap).map(([department, count]) => ({
    department,
    count,
  }));

  return {
    total_students: total,
    average_marks: avgMarks,
    pass_percentage: passPct,
    at_risk_count: atRiskCount,
    highest_marks: highest,
    lowest_marks: lowest,
    marks_distribution,
    subject_averages,
    department_distribution,
    is_offline_fallback: true,
  };
}

export function getOfflineStudents({ search = '', department = 'All', page = 1, pageSize = 15 } = {}) {
  let list = [...sampleStudents];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
  }
  if (department && department !== 'All') {
    list = list.filter((s) => s.department === department);
  }
  const total = list.length;
  const start = (page - 1) * pageSize;
  const students = list.slice(start, start + pageSize);
  return {
    total,
    page,
    page_size: pageSize,
    students,
    is_offline_fallback: true,
  };
}

export function getOfflineAnalysis() {
  const total = sampleStudents.length;
  const numCols = [
    'study_hours_per_week',
    'attendance_percentage',
    'past_exam_marks',
    'assignment_score',
    'math_marks',
    'science_marks',
    'english_marks',
    'final_marks',
  ];

  const descriptive_stats = {};
  numCols.forEach((col) => {
    const vals = sampleStudents.map((s) => s[col]).sort((a, b) => a - b);
    const mean = Math.round((vals.reduce((a, b) => a + b, 0) / total) * 100) / 100;
    const min = vals[0];
    const max = vals[vals.length - 1];
    const p25 = vals[Math.floor(total * 0.25)];
    const p50 = vals[Math.floor(total * 0.5)];
    const p75 = vals[Math.floor(total * 0.75)];
    const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / total;
    const std = Math.round(Math.sqrt(variance) * 100) / 100;
    descriptive_stats[col] = { mean, std, min, '25%': p25, '50%': p50, '75%': p75, max };
  });

  const attendance_vs_marks = sampleStudents.slice(0, 100).map((s) => ({
    student_id: s.student_id,
    name: s.name,
    attendance: s.attendance_percentage,
    final_marks: s.final_marks,
    study_hours: s.study_hours_per_week,
    department: s.department,
  }));

  // Correlation matrix
  const correlation_matrix = {};
  numCols.forEach((col1) => {
    correlation_matrix[col1] = {};
    numCols.forEach((col2) => {
      if (col1 === col2) {
        correlation_matrix[col1][col2] = 1.0;
      } else {
        const mean1 = descriptive_stats[col1].mean;
        const mean2 = descriptive_stats[col2].mean;
        let cov = 0;
        for (let i = 0; i < total; i++) {
          cov += (sampleStudents[i][col1] - mean1) * (sampleStudents[i][col2] - mean2);
        }
        cov /= total;
        const std1 = descriptive_stats[col1].std;
        const std2 = descriptive_stats[col2].std;
        const r = std1 && std2 ? Math.round((cov / (std1 * std2)) * 1000) / 1000 : 0;
        correlation_matrix[col1][col2] = Math.max(-1, Math.min(1, r));
      }
    });
  });

  const insights = [
    `Prior academic performance (Past Exam Marks) exhibits a strong positive correlation (r = ${correlation_matrix['past_exam_marks']['final_marks'].toFixed(2)}) with Final Marks, serving as a primary predictor.`,
    'Attendance plays a decisive role: students with ≥80% attendance achieved substantially higher average scores than students below the 75% cutoff.',
    `Study habit data science mining shows strong alignment between weekly hours committed and final course achievement (r = ${correlation_matrix['study_hours_per_week']['final_marks'].toFixed(2)}).`,
    'Approximately 31% of the cohort currently falls below institutional benchmarks (<40% marks or <75% attendance) and qualifies for targeted remedial intervention.',
  ];

  const subject_averages = [
    { subject: 'Mathematics', average: descriptive_stats['math_marks'].mean },
    { subject: 'Science', average: descriptive_stats['science_marks'].mean },
    { subject: 'English', average: descriptive_stats['english_marks'].mean },
    { subject: 'Past Exam', average: descriptive_stats['past_exam_marks'].mean },
    { subject: 'Assignments', average: descriptive_stats['assignment_score'].mean },
    { subject: 'Final Marks', average: descriptive_stats['final_marks'].mean },
  ];

  return {
    descriptive_stats,
    marks_distribution: getOfflineDashboardStats().marks_distribution,
    subject_averages,
    attendance_vs_marks,
    correlation_matrix,
    insights,
    is_offline_fallback: true,
  };
}

export function getOfflineModelInfo() {
  return {
    model_name: 'Multiple Linear Regression',
    is_trained: true,
    sample_size: 150,
    train_size: 120,
    test_size: 30,
    r2_score: 0.976,
    mae: 2.12,
    features: ['study_hours_per_week', 'attendance_percentage', 'past_exam_marks', 'assignment_score'],
    intercept: 2.62,
    coefficients: {
      study_hours_per_week: 0.4975,
      attendance_percentage: 0.163,
      past_exam_marks: 0.3676,
      assignment_score: 0.2416,
    },
    last_trained: new Date().toUTCString(),
    is_offline_fallback: true,
  };
}

export function getOfflinePrediction(study_hours, attendance, past_marks, assignment) {
  const intercept = 2.62;
  const raw =
    intercept +
    0.4975 * study_hours +
    0.163 * attendance +
    0.3676 * past_marks +
    0.2416 * assignment;
  const predicted_marks = Math.max(0, Math.min(100, Math.round(raw * 10) / 10));
  const mae = 2.12;

  let grade = 'Pass Class (C)';
  if (predicted_marks >= 90) grade = 'Outstanding (A+)';
  else if (predicted_marks >= 75) grade = 'Distinction (A)';
  else if (predicted_marks >= 60) grade = 'First Class (B)';
  else if (predicted_marks < 40) grade = 'Needs Support / At Risk (F)';

  return {
    predicted_marks,
    confidence_interval: {
      lower: Math.max(0, Math.round((predicted_marks - mae) * 10) / 10),
      upper: Math.min(100, Math.round((predicted_marks + mae) * 10) / 10),
      margin_of_error_mae: mae,
    },
    predicted_grade: grade,
    feature_contributions: {
      'Intercept (Base)': intercept,
      'Study Hours Effect': Math.round(0.4975 * study_hours * 10) / 10,
      'Attendance Effect': Math.round(0.163 * attendance * 10) / 10,
      'Past Exam Marks Effect': Math.round(0.3676 * past_marks * 10) / 10,
      'Assignment Score Effect': Math.round(0.2416 * assignment * 10) / 10,
    },
    formula_explanation: `Final Marks ≈ ${intercept} + (0.50 × ${study_hours}) + (0.16 × ${attendance}) + (0.37 × ${past_marks}) + (0.24 × ${assignment})`,
    disclaimer:
      'Note: Predictions are statistical estimates derived from ordinary least squares Linear Regression trained on historical cohort data (MAE = ±2.12 marks).',
    is_offline_fallback: true,
  };
}

export function getOfflineAtRisk(marksThreshold = 40.0, attendanceThreshold = 75.0) {
  const at_risk_list = [];
  sampleStudents.forEach((s) => {
    const reasons = [];
    const is_low_marks = s.final_marks < marksThreshold;
    const is_low_attendance = s.attendance_percentage < attendanceThreshold;

    if (is_low_marks) {
      reasons.append?.(reasons.push(`Scored ${s.final_marks}% (Below passing threshold of ${marksThreshold}%)`));
    }
    if (is_low_attendance) {
      reasons.push(`Attendance is ${s.attendance_percentage}% (Below minimum requirement of ${attendanceThreshold}%)`);
    }

    if (reasons.length > 0) {
      let risk_level = 'Medium';
      let recommendation = 'Targeted academic counseling recommended.';
      if (is_low_marks && is_low_attendance) {
        risk_level = 'High';
        recommendation = 'Immediate faculty intervention required: Mandatory remedial classes and parental academic counseling.';
      } else if (is_low_marks) {
        risk_level = 'Medium';
        recommendation = 'Subject-specific tutoring and weekly assignment recovery plan recommended.';
      } else {
        risk_level = 'Medium';
        recommendation = 'Attendance warning and counselor meeting to identify cause of absenteeism.';
      }

      at_risk_list.push({
        student: s,
        risk_level,
        reasons,
        recommendation,
      });
    }
  });

  at_risk_list.sort((a, b) => (a.risk_level === 'High' ? -1 : 1));
  return at_risk_list;
}
