import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import StudentModal from '../components/StudentModal';
import UploadModal from '../components/UploadModal';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, department]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getStudents({
        search,
        department,
        page,
        pageSize,
      });
      setStudents(data.students);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Error loading students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student record for ${name}?`)) {
      return;
    }
    try {
      await api.deleteStudent(id);
      fetchStudents();
    } catch (err) {
      alert(`Failed to delete student: ${err.message}`);
    }
  };

  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveStudent = async (formData) => {
    const isEditing = !!editingStudent;
    if (isEditing) {
      await api.updateStudent(editingStudent.id, formData);
    } else {
      await api.createStudent(formData);
    }
    setIsModalOpen(false);
    setEditingStudent(null);
    await fetchStudents();
    setSuccessMsg(isEditing
      ? `Student record updated successfully.`
      : `New student "${formData.name}" added successfully.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div>
      {/* Action Toolbar */}
      <div className="toolbar">
        <form onSubmit={handleSearchSubmit} className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search by ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#64748b" />
            <select
              className="form-control"
              style={{ width: 'auto', padding: '7px 12px' }}
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Tech</option>
              <option value="Data Science">Data Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={fetchStudents} title="Refresh">
            <RefreshCw size={15} />
          </button>

          <a href={api.getExportCsvUrl()} download="eduinsight_students.csv" className="btn btn-secondary">
            <Download size={15} />
            <span>Export CSV</span>
          </a>

          <button className="btn btn-secondary" onClick={() => setIsUploadOpen(true)}>
            <Upload size={15} />
            <span>Import CSV</span>
          </button>

          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Students Data Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Study Hrs/Wk</th>
                <th>Attendance</th>
                <th>Past Marks</th>
                <th>Assignment</th>
                <th>Final Marks</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading records from SQLite database...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No student records found matching the current filters.
                  </td>
                </tr>
              ) : (
                students.map((s) => {
                  const isAtRisk = s.final_marks < 40.0 || s.attendance_percentage < 75.0;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#4338ca' }}>
                        {s.student_id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <span className="badge badge-dept">{s.department}</span>
                      </td>
                      <td>{s.study_hours_per_week} hrs</td>
                      <td>
                        <span style={{ color: s.attendance_percentage < 75 ? '#e11d48' : '#059669', fontWeight: 600 }}>
                          {s.attendance_percentage}%
                        </span>
                      </td>
                      <td>{s.past_exam_marks}%</td>
                      <td>{s.assignment_score}%</td>
                      <td style={{ fontWeight: 700, color: s.final_marks < 40 ? '#e11d48' : '#0f172a' }}>
                        {s.final_marks}%
                      </td>
                      <td>
                        {isAtRisk ? (
                          <span className="badge badge-high">At-Risk</span>
                        ) : (
                          <span className="badge badge-low">Good Standing</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginRight: '6px' }}
                          onClick={() => handleEdit(s)}
                          title="Edit Student"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(s.id, s.name)}
                          title="Delete Student"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing <strong>{students.length}</strong> of <strong>{total}</strong> students (Page {page} of {totalPages})
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
      />

      {/* Upload CSV Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchStudents();
        }}
      />
    </div>
  );
}
