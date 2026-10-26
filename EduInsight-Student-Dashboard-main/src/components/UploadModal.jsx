import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError('');
    } else {
      setError('Please choose a valid .csv file.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const res = await api.uploadCSV(file);
      setResult(res);
      onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Error uploading CSV');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Import Student Dataset (CSV)</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '18px' }}>
            <FileSpreadsheet size={40} style={{ color: '#4f46e5', margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1e293b', marginBottom: '4px' }}>
              Choose a CSV file to upload or update student records
            </p>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
              Records with existing Student IDs will be automatically updated; new IDs will be inserted.
            </p>

            <input
              type="file"
              accept=".csv"
              id="csvFileInput"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor="csvFileInput" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <UploadCloud size={16} />
              <span>{file ? file.name : 'Select CSV File'}</span>
            </label>
          </div>

          <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', fontSize: '0.78rem', color: '#334155', marginBottom: '16px' }}>
            <strong>Required Columns:</strong>
            <div style={{ marginTop: '4px', fontFamily: 'monospace', color: '#4338ca' }}>
              student_id, name, study_hours_per_week, attendance_percentage, past_exam_marks, assignment_score, final_marks
            </div>
            <div style={{ marginTop: '4px', color: '#64748b' }}>
              Optional: gender, department, math_marks, science_marks, english_marks
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                <CheckCircle size={18} />
                <span>Upload Processed</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#047857' }}>{result.message}</p>
              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#b45309' }}>
                  <strong>Warnings:</strong>
                  <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Processing...' : 'Upload & Mine Dataset'}
          </button>
        </div>
      </div>
    </div>
  );
}
