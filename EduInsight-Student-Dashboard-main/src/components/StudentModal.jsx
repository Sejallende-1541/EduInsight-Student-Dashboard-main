import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSave, student = null }) {
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    gender: 'Male',
    department: 'Computer Science',
    study_hours_per_week: 15,
    attendance_percentage: 80,
    past_exam_marks: 65,
    assignment_score: 70,
    math_marks: 65,
    science_marks: 65,
    english_marks: 70,
    final_marks: 68,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      setFormData({
        student_id: student.student_id || '',
        name: student.name || '',
        gender: student.gender || 'Male',
        department: student.department || 'Computer Science',
        study_hours_per_week: student.study_hours_per_week || 0,
        attendance_percentage: student.attendance_percentage || 0,
        past_exam_marks: student.past_exam_marks || 0,
        assignment_score: student.assignment_score || 0,
        math_marks: student.math_marks || 0,
        science_marks: student.science_marks || 0,
        english_marks: student.english_marks || 0,
        final_marks: student.final_marks || 0,
      });
    } else {
      setFormData({
        student_id: `STU${Math.floor(2000 + Math.random() * 7999)}`,
        name: '',
        gender: 'Male',
        department: 'Computer Science',
        study_hours_per_week: 15,
        attendance_percentage: 80,
        past_exam_marks: 65,
        assignment_score: 70,
        math_marks: 65,
        science_marks: 65,
        english_marks: 70,
        final_marks: 68,
      });
    }
    setError('');
  }, [student, isOpen]);

  // ✅ ALL hooks must be before any early return (React Rules of Hooks)
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Student name is required.';
    if (!formData.student_id.trim()) return 'Student ID is required.';
    const numFields = [
      ['study_hours_per_week', 0, 100],
      ['attendance_percentage', 0, 100],
      ['past_exam_marks', 0, 100],
      ['assignment_score', 0, 100],
      ['math_marks', 0, 100],
      ['science_marks', 0, 100],
      ['english_marks', 0, 100],
      ['final_marks', 0, 100],
    ];
    for (const [field, min, max] of numFields) {
      const val = parseFloat(formData[field]);
      if (isNaN(val)) return `"${field.replace(/_/g, ' ')}" must be a number.`;
      if (val < min || val > max)
        return `"${field.replace(/_/g, ' ')}" must be between ${min} and ${max}.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setSaving(true);
      setError('');
      // Coerce all numeric fields to floats before sending to FastAPI
      const payload = {
        ...formData,
        study_hours_per_week: parseFloat(formData.study_hours_per_week),
        attendance_percentage: parseFloat(formData.attendance_percentage),
        past_exam_marks: parseFloat(formData.past_exam_marks),
        assignment_score: parseFloat(formData.assignment_score),
        math_marks: parseFloat(formData.math_marks),
        science_marks: parseFloat(formData.science_marks),
        english_marks: parseFloat(formData.english_marks),
        final_marks: parseFloat(formData.final_marks),
      };
      await onSave(payload);
      // onSave will close the modal on success
    } catch (err) {
      // Keep modal open, show the server's actual error message
      setError(err.message || 'Failed to save student. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{student ? 'Edit Student Record' : 'Add New Student Record'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  name="student_id"
                  className="form-control"
                  value={formData.student_id}
                  onChange={handleChange}
                  disabled={!!student}
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Study Hours/Week (0-100)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="study_hours_per_week"
                  className="form-control"
                  value={formData.study_hours_per_week}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Attendance Percentage (0-100%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="attendance_percentage"
                  className="form-control"
                  value={formData.attendance_percentage}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Past Exam Marks (0-100)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="past_exam_marks"
                  className="form-control"
                  value={formData.past_exam_marks}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assignment Score (0-100)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="assignment_score"
                  className="form-control"
                  value={formData.assignment_score}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Math Marks</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="math_marks"
                  className="form-control"
                  value={formData.math_marks}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Science Marks</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="science_marks"
                  className="form-control"
                  value={formData.science_marks}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>English Marks</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="english_marks"
                  className="form-control"
                  value={formData.english_marks}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '4px' }}>
              <label>Final Exam Marks (0-100) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="final_marks"
                className="form-control"
                value={formData.final_marks}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : (student ? 'Save Changes' : 'Create Record')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
