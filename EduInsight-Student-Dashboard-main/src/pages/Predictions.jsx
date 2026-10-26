import React, { useState, useEffect } from 'react';
import {
  Brain,
  Calculator,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

// ----- Default form values (empty so user must fill in) -----
const EMPTY_INPUTS = {
  study_hours_per_week: '',
  attendance_percentage: '',
  past_exam_marks: '',
  assignment_score: '',
};

// ----- Example presets for the three quick-fill buttons -----
const PRESETS = {
  good: {
    label: '🟢 Good Performance',
    values: { study_hours_per_week: 25, attendance_percentage: 95, past_exam_marks: 85, assignment_score: 90 },
  },
  average: {
    label: '🟡 Average Performance',
    values: { study_hours_per_week: 14, attendance_percentage: 78, past_exam_marks: 62, assignment_score: 65 },
  },
  poor: {
    label: '🔴 Needs Improvement',
    values: { study_hours_per_week: 5, attendance_percentage: 58, past_exam_marks: 32, assignment_score: 38 },
  },
};

// ----- Human-readable labels for each input field -----
const FIELD_LABELS = {
  study_hours_per_week: 'Study Hours per Week',
  attendance_percentage: 'Attendance Percentage (%)',
  past_exam_marks: 'Past Exam Marks (out of 100)',
  assignment_score: 'Assignment Score (out of 100)',
};

const FIELD_RANGE = {
  study_hours_per_week: { min: 0, max: 40, step: 0.5, unit: 'hrs' },
  attendance_percentage: { min: 0, max: 100, step: 1, unit: '%' },
  past_exam_marks: { min: 0, max: 100, step: 1, unit: '%' },
  assignment_score: { min: 0, max: 100, step: 1, unit: '%' },
};

export default function Predictions() {
  // Model metadata from backend (coefficients, R², MAE, etc.)
  const [modelInfo, setModelInfo] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelError, setModelError] = useState('');

  // Form inputs
  const [inputs, setInputs] = useState(EMPTY_INPUTS);
  const [formError, setFormError] = useState(''); // validation error

  // Prediction result
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');

  // Load model info on page open (just coefficients + metrics, NOT auto-predict)
  useEffect(() => {
    fetchModelInfo();
  }, []);

  // Fetch model coefficients and metrics from FastAPI backend
  const fetchModelInfo = async () => {
    try {
      setLoadingModel(true);
      setModelError('');
      const data = await api.getModelInfo();
      setModelInfo(data);
    } catch (err) {
      setModelError('Could not load model info. Backend may be offline.');
    } finally {
      setLoadingModel(false);
    }
  };

  // Handle number input changes
  const handleChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setFormError(''); // clear validation error when user types
    setPrediction(null); // clear old prediction when inputs change
  };

  // Fill form with a preset example (values are still editable after)
  const applyPreset = (presetKey) => {
    setInputs(PRESETS[presetKey].values);
    setFormError('');
    setPrediction(null);
    setPredictError('');
  };

  // Clear all inputs and results
  const handleClear = () => {
    setInputs(EMPTY_INPUTS);
    setPrediction(null);
    setPredictError('');
    setFormError('');
  };

  // Validate inputs before sending to backend
  const validateInputs = () => {
    for (const field of Object.keys(FIELD_LABELS)) {
      const val = parseFloat(inputs[field]);
      const { min, max } = FIELD_RANGE[field];
      if (inputs[field] === '' || isNaN(val)) {
        return `Please enter a value for "${FIELD_LABELS[field]}".`;
      }
      if (val < min || val > max) {
        return `"${FIELD_LABELS[field]}" must be between ${min} and ${max}.`;
      }
    }
    return null; // no error
  };

  // Send inputs to FastAPI → get prediction from real Linear Regression model
  const handlePredict = async () => {
    const error = validateInputs();
    if (error) {
      setFormError(error);
      return;
    }
    try {
      setPredicting(true);
      setPredictError('');
      setPrediction(null);
      // Convert all values to floats before sending
      const payload = {
        study_hours_per_week: parseFloat(inputs.study_hours_per_week),
        attendance_percentage: parseFloat(inputs.attendance_percentage),
        past_exam_marks: parseFloat(inputs.past_exam_marks),
        assignment_score: parseFloat(inputs.assignment_score),
      };
      const result = await api.predictMarks(payload);
      setPrediction(result);
    } catch (err) {
      setPredictError(err.message || 'Prediction failed. Please check the backend is running.');
    } finally {
      setPredicting(false);
    }
  };

  // Determine color for predicted marks (red = fail, orange = borderline, green = pass)
  const getMarkColor = (marks) => {
    if (marks < 40) return '#e11d48'; // red — at risk
    if (marks < 60) return '#d97706'; // orange — borderline
    return '#059669';                  // green — good
  };

  return (
    <div>

      {/* ── Page Title ── */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={24} color="#4f46e5" />
          Marks Prediction
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
          Enter a student's details below. The system uses a <strong>Linear Regression</strong> model
          (trained with Scikit-learn) to estimate their final exam marks.
        </p>
      </div>

      {/* ── How It Works — simple explanation ── */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.9rem', marginBottom: '6px' }}>
          📚 How This Works (for your viva)
        </div>
        <p style={{ fontSize: '0.82rem', color: '#1e3a5f', lineHeight: '1.7' }}>
          <strong>Linear Regression</strong> finds the best straight line through the data.
          It learns how much each factor — study hours, attendance, past marks, and assignments —
          contributes to the final score. The formula is:<br />
          <code style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '6px' }}>
            Final Marks = (Intercept) + (coefficient × StudyHours) + (coefficient × Attendance) + ...
          </code>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ── LEFT: Input Form ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Calculator size={18} color="#4f46e5" />
                <span>Enter Student Details</span>
              </div>
              <div className="card-subtitle">Fill in all four fields, then click Predict</div>
            </div>
          </div>

          {/* Quick-fill Example Buttons */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Examples (editable after filling):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className="btn btn-secondary btn-sm"
                  onClick={() => applyPreset(key)}
                  style={{ fontSize: '0.78rem' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Fields — each has a number box + slider together */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.keys(FIELD_LABELS).map(field => {
              const { min, max, step, unit } = FIELD_RANGE[field];
              const val = inputs[field];
              const numVal = parseFloat(val);
              return (
                <div key={field}>
                  {/* Label + current value */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>
                      {FIELD_LABELS[field]}
                    </label>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#4f46e5' }}>
                      {val !== '' ? `${val} ${unit}` : '—'}
                    </span>
                  </div>
                  {/* Number text box (type=number for precision) */}
                  <input
                    type="number"
                    className="form-control"
                    min={min}
                    max={max}
                    step={step}
                    value={val}
                    placeholder={`Enter ${min}–${max}`}
                    onChange={e => handleChange(field, e.target.value === '' ? '' : e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  {/* Slider for easy adjustment */}
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={val === '' ? min : numVal}
                    onChange={e => handleChange(field, e.target.value)}
                    style={{ width: '100%', accentColor: '#4f46e5' }}
                  />
                </div>
              );
            })}
          </div>

          {/* Validation Error */}
          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginTop: '16px', fontSize: '0.84rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handlePredict}
              disabled={predicting}
            >
              <Zap size={16} />
              <span>{predicting ? 'Predicting…' : 'Predict Final Marks'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={predicting}
              title="Clear all inputs"
            >
              <RotateCcw size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Result Panel ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="#059669" />
                <span>Prediction Result</span>
              </div>
              <div className="card-subtitle">Computed by Scikit-learn Linear Regression</div>
            </div>
          </div>

          {/* Loading state */}
          {predicting && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ marginTop: '12px', fontSize: '0.88rem' }}>Sending to FastAPI backend…</p>
            </div>
          )}

          {/* API error */}
          {!predicting && predictError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fee2e2', color: '#991b1b', padding: '14px', borderRadius: '10px', margin: '16px 0' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>Prediction Failed</strong>
                <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>{predictError}</p>
              </div>
            </div>
          )}

          {/* No result yet */}
          {!predicting && !predictError && !prediction && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
              <Calculator size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.88rem' }}>Fill the form and click <strong>Predict Final Marks</strong></p>
            </div>
          )}

          {/* ── Prediction Result ── */}
          {!predicting && prediction && (
            <div>
              {/* Big score display */}
              <div style={{ textAlign: 'center', padding: '24px 0 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Predicted Final Marks
                </div>
                <div style={{ fontSize: '4rem', fontWeight: 800, color: getMarkColor(prediction.predicted_marks), letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {prediction.predicted_marks}%
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span className={`badge ${prediction.predicted_marks < 40 ? 'badge-high' : 'badge-low'}`} style={{ fontSize: '0.85rem', padding: '5px 14px' }}>
                    {prediction.predicted_grade}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                  Likely range: <strong>{prediction.confidence_interval.lower}% – {prediction.confidence_interval.upper}%</strong>
                  <span style={{ color: '#94a3b8' }}> (±{prediction.confidence_interval.margin_of_error_mae} marks MAE)</span>
                </div>
              </div>

              {/* Feature contributions — simple breakdown */}
              <div style={{ padding: '16px 0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                  How each factor contributed:
                </div>
                {Object.entries(prediction.feature_contributions).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#475569' }}>{label}</span>
                    <span style={{ fontWeight: 700, color: value >= 0 ? '#059669' : '#e11d48' }}>
                      {value >= 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Formula breakdown */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  The actual formula used:
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#1e293b', lineHeight: '1.5', wordBreak: 'break-all' }}>
                  {prediction.formula_explanation}
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ display: 'flex', gap: '8px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', marginTop: '14px' }}>
                <Info size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.76rem', color: '#92400e', lineHeight: '1.5' }}>
                  This is an <strong>estimate</strong>, not a guaranteed score.
                  Actual results depend on exam difficulty, student health, and other factors.
                  {' '}The model accuracy is MAE ≈ ±{prediction.confidence_interval.margin_of_error_mae} marks.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Model Info — coefficients and metrics ── */}
      {loadingModel && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.85rem', marginTop: '24px' }}>
          Loading model information…
        </div>
      )}

      {modelError && (
        <div style={{ display: 'flex', gap: '8px', background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginTop: '24px', fontSize: '0.84rem' }}>
          <AlertCircle size={16} />
          <span>{modelError}</span>
        </div>
      )}

      {!loadingModel && modelInfo && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <CheckCircle size={18} color="#059669" />
                <span>Linear Regression Model Details</span>
              </div>
              <div className="card-subtitle">
                Trained on {modelInfo.sample_size} student records —
                {' '}{modelInfo.train_size} for training, {modelInfo.test_size} for testing
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="kpi-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="kpi-label" style={{ color: '#166534' }}>R² Score</div>
              <div className="kpi-value" style={{ color: '#15803d' }}>{modelInfo.r2_score}</div>
              <div className="kpi-sub">
                {(modelInfo.r2_score * 100).toFixed(1)}% of variance explained
              </div>
            </div>
            <div className="kpi-card" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <div className="kpi-label" style={{ color: '#1e40af' }}>MAE (Avg. Error)</div>
              <div className="kpi-value" style={{ color: '#1d4ed8' }}>±{modelInfo.mae}</div>
              <div className="kpi-sub">Average marks off from actual</div>
            </div>
            <div className="kpi-card" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
              <div className="kpi-label" style={{ color: '#6b21a8' }}>Intercept (β₀)</div>
              <div className="kpi-value" style={{ color: '#7e22ce' }}>{modelInfo.intercept}</div>
              <div className="kpi-sub">Base score when all inputs are 0</div>
            </div>
          </div>

          {/* Feature coefficients */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
              Feature Coefficients — "How much does each factor increase the predicted score?"
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {Object.entries(modelInfo.coefficients || {}).map(([feat, coef]) => (
                <div key={feat} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>
                    {FIELD_LABELS[feat] || feat}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    +{coef.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '2px' }}>
                    Each +1 unit adds ~{coef.toFixed(2)} marks
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
