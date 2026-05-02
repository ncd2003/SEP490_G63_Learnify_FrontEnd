import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { isStudentRole } from '@/lib/auth-role';
import { UploadCloud, FileText, Settings, Calendar as CalendarIcon, FileUp, Loader2, Plus, X, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/http';
import scheduleApi from '@/apis/schedule.api';
import '@/assets/css/pages/classroom/classroomSchedule.css';

const STEPS = [
  { id: 1, label: 'Upload file' },
  { id: 2, label: 'Kiểm tra danh sách' },
  { id: 3, label: 'Cài đặt lịch' },
  { id: 4, label: 'Xem trước' }
];

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Thứ Hai', short: 'T2' },
  { value: 'TUESDAY', label: 'Thứ Ba', short: 'T3' },
  { value: 'WEDNESDAY', label: 'Thứ Tư', short: 'T4' },
  { value: 'THURSDAY', label: 'Thứ Năm', short: 'T5' },
  { value: 'FRIDAY', label: 'Thứ Sáu', short: 'T6' },
  { value: 'SATURDAY', label: 'Thứ Bảy', short: 'T7' },
  { value: 'SUNDAY', label: 'Chủ Nhật', short: 'CN' }
];

export default function SyllabusModal({ isOpen, onClose, classroomId, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Upload
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawText, setRawText] = useState('');
  const [expectedSessions, setExpectedSessions] = useState('');
  const [expectedDuration, setExpectedDuration] = useState('');

  // Step 2: Edit
  const [sessions, setSessions] = useState([]);
  const [totalEstimatedMinutes, setTotalEstimatedMinutes] = useState(0);

  // Step 3: Settings
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default tomorrow
    return d.toISOString().split('T')[0];
  });
  const [sessionType, setSessionType] = useState('OFFLINE');
  const [weeklyRules, setWeeklyRules] = useState([
    { id: 1, dayOfWeek: 'MONDAY', startTime: '08:00', enabled: true },
    { id: 2, dayOfWeek: 'WEDNESDAY', startTime: '08:00', enabled: true },
    { id: 3, dayOfWeek: 'FRIDAY', startTime: '08:00', enabled: true }
  ]);

  // Step 4: Preview
  const [previewData, setPreviewData] = useState(null);
  const [previewWeekOffset, setPreviewWeekOffset] = useState(0);

  if (!isOpen) return null;
  if (isStudentRole(user?.role)) return null;

  // --- Handlers ---

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setRawText('');
    setSessions([]);
    setPreviewData(null);
    setWeeklyRules(DAYS_OF_WEEK.map((d, i) => ({
      id: i + 1,
      dayOfWeek: d.value,
      startTime: '08:00',
      enabled: [1, 3, 5].includes(i + 1) // Mon, Wed, Fri by default
    })));
    onClose();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File quá lớn. Vui lòng chọn file dưới 10MB.');
        return;
      }
      setFile(selectedFile);
      setRawText('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('File quá lớn. Vui lòng chọn file dưới 10MB.');
        return;
      }
      setFile(droppedFile);
      setRawText('');
    }
  };

  const handleClearFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    const fileInput = document.getElementById('syl-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const analyzeSyllabus = async () => {
    if (!file && !rawText.trim()) {
      toast.error('Vui lòng upload file hoặc nhập nội dung giáo án.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (rawText.trim()) formData.append('rawText', rawText.trim());
      if (expectedSessions) formData.append('expectedTotalSessions', expectedSessions);
      if (expectedDuration) formData.append('expectedSessionDuration', expectedDuration);

      const res = await apiRequest.post(`/classrooms/${classroomId}/syllabus/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.result) {
        setSessions(res.result.sessions || []);
        setTotalEstimatedMinutes(res.result.totalEstimatedMinutes || 0);
        toast.success(`Đã phân tích thành công ${res.result.totalSessions} tiết học.`);
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi phân tích giáo án. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const addSession = () => {
    setSessions(prev => [
      ...prev,
      {
        sessionNumber: prev.length + 1,
        title: 'Tiết học mới',
        description: '',
        estimatedMinutes: 90
      }
    ]);
  };

  const updateSession = (index, field, value) => {
    setSessions(prev => {
      const newS = [...prev];
      newS[index] = { ...newS[index], [field]: value };
      return newS;
    });
  };

  const removeSession = (index) => {
    setSessions(prev => {
      const newS = prev.filter((_, i) => i !== index);
      // Re-number
      return newS.map((s, i) => ({ ...s, sessionNumber: i + 1 }));
    });
  };

  const handleAddRule = () => {
    setWeeklyRules(prev => [
      ...prev,
      { id: Date.now(), dayOfWeek: 'MONDAY', startTime: '08:00', enabled: true }
    ]);
  };

  const handleUpdateRule = (id, field, value) => {
    setWeeklyRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemoveRule = (id) => {
    setWeeklyRules(prev => prev.filter(r => r.id !== id));
  };

  const generatePreview = async () => {
    const enabledRules = weeklyRules.filter(r => r.enabled);
    if (enabledRules.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 khung giờ trong tuần.');
      return;
    }
    if (sessions.length === 0) {
      toast.error('Không có tiết học nào để xếp lịch.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sessions,
        startDate,
        sessionType,
        weeklySchedules: enabledRules.map(r => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime
        }))
      };

      const res = await apiRequest.post(`/classrooms/${classroomId}/syllabus/preview`, payload);
      if (res.result) {
        setPreviewData(res.result);
        setPreviewWeekOffset(0);
        setStep(4);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo bản xem trước.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSchedule = async () => {
    if (!previewData || !previewData.scheduledSessions) return;
    
    setLoading(true);
    try {
      const payload = {
        sessions: previewData.scheduledSessions.map(s => ({
          title: s.title,
          description: s.description,
          date: s.proposedDate,
          startTime: s.startTime,
          endTime: s.endTime,
          type: s.type
        }))
      };

      await apiRequest.post(`/classrooms/${classroomId}/syllabus/confirm`, payload);
      toast.success('Đã tạo lịch học thành công!');
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xác nhận lịch học.');
    } finally {
      setLoading(false);
    }
  };

  // --- Rendering ---
  
  // Weekly grid rendering for Preview
  // Weekly grid rendering for Preview
  const renderPreviewGrid = () => {
    if (!previewData?.scheduledSessions) return null;
    
    // Determine the start date of the current view week
    const firstDateStr = previewData.scheduledSessions[0]?.proposedDate;
    const baseDate = firstDateStr ? new Date(firstDateStr) : new Date();
    baseDate.setDate(baseDate.getDate() + (previewWeekOffset * 7));
    
    // Get Monday of that week
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(baseDate.setDate(diff));
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const isToday = (date) => {
      const today = new Date();
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    };

    return (
      <div className="syl-preview-content">
        <div className="syl-preview-nav">
          <div className="syl-preview-nav-title">
            <CalendarIcon size={18} /> 
            Bản xem trước lịch học ({previewData.scheduledSessions.length} buổi) - Tuần {startOfWeek.toLocaleDateString('vi-VN')}
          </div>
          <div className="syl-preview-nav-actions">
            <button className="syl-btn-outline btn-sm" onClick={() => setPreviewWeekOffset(p => p - 1)}>❮ Trước</button>
            <button className="syl-btn-outline btn-sm" onClick={() => setPreviewWeekOffset(p => p + 1)}>Sau ❯</button>
            <button className="syl-btn-outline btn-sm" onClick={generatePreview} title="Tính toán lại lịch"><RefreshCw size={14}/></button>
          </div>
        </div>

        <div className="syl-week-grid">
          {weekDays.map((d, i) => {
            const dateStr = d.toISOString().split('T')[0];
            const daySessions = previewData.scheduledSessions.filter(s => s.proposedDate === dateStr);
            const isSkipped = previewData.skippedDates?.some(sk => sk.date === dateStr);
            const todayClass = isToday(d) ? 'today' : '';
            
            return (
              <div className={`syl-week-col ${isSkipped ? 'skipped-day' : ''} ${todayClass}`} key={i}>
                <div className="syl-col-header">
                  <div className="syl-col-day">{DAYS_OF_WEEK[i].label}</div>
                  <div className="syl-col-date" style={{ color: isSkipped ? '#ef4444' : 'inherit' }}>
                    {d.getDate()}/{d.getMonth()+1}
                  </div>
                </div>
                <div className="syl-col-body">
                  {daySessions.map((s, j) => (
                    <div className={`syl-event ${s.note ? 'warn' : ''}`} key={j}>
                      <div className="syl-ev-time">{s.startTime.slice(0,5)} - {s.endTime.slice(0,5)}</div>
                      <div className="syl-ev-title">Tiết {s.sessionNumber}: {s.title}</div>
                      {s.note && <div className="syl-ev-note">⚠ {s.note}</div>}
                    </div>
                  ))}
                  {daySessions.length === 0 && !isSkipped && (
                    <div className="syl-col-empty">Trống</div>
                  )}
                  {isToday(d) && daySessions.length === 0 && (
                    <div className="syl-today-badge">Hôm nay</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {previewData.skippedDates?.length > 0 && (
          <div className="syl-skipped-box">
            <div className="syl-skipped-title"><AlertCircle size={16}/> Có {previewData.skippedDates.length} ngày bị dời do trùng lịch:</div>
            <ul className="syl-skipped-list">
              {previewData.skippedDates.map((sk, idx) => (
                <li key={idx}>- {sk.date}: {sk.reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="syl-modal-overlay">
      <div className="syl-modal">
        <div className="syl-modal-header">
          <h2>✨ Tạo lịch học tự động từ Giáo án</h2>
          <button className="syl-btn-close" onClick={handleClose}><X size={20} /></button>
        </div>

        <div className="syl-stepper">
          {STEPS.map(s => (
            <div key={s.id} className={`syl-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
              <div className="syl-step-icon">{s.id}</div>
              {s.label}
            </div>
          ))}
        </div>

        <div className="syl-modal-body">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="syl-fade-in">
              <label 
                className={`syl-upload-area ${isDragging ? 'drag-active' : ''} ${file ? 'has-file' : ''}`} 
                htmlFor="syl-file-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? <FileText className="syl-upload-icon success" /> : <FileUp className="syl-upload-icon" />}
                <div className="syl-upload-text">
                  {file ? file.name : "Kéo thả file giáo án vào đây hoặc click để chọn"}
                </div>
                <div className="syl-upload-sub">
                  {file ? `Dung lượng: ${(file.size / 1024 / 1024).toFixed(2)} MB` : "Hỗ trợ: PDF, DOCX, TXT - Tối đa 10MB"}
                </div>
                {file && (
                  <button className="syl-btn-clear-file" onClick={handleClearFile}>Xóa file</button>
                )}
                <input id="syl-file-upload" type="file" accept=".pdf,.docx,.txt" className="syl-hidden" onChange={handleFileChange} />
              </label>

              <div className="syl-divider"><span>HOẶC NHẬP TRỰC TIẾP</span></div>

              <textarea 
                className="syl-textarea" 
                placeholder="Dán nội dung giáo án (text) của bạn vào đây..." 
                value={rawText}
                onChange={e => { setRawText(e.target.value); if(e.target.value) setFile(null); }}
              ></textarea>

              <div className="syl-hints-box">
                <div className="syl-hints-title">Gợi ý cho AI (Tuỳ chọn)</div>
                <div className="syl-hints-grid">
                  <div className="syl-form-group">
                    <label>Tổng số tiết học dự kiến</label>
                    <input type="number" placeholder="VD: 10" value={expectedSessions} onChange={e => setExpectedSessions(e.target.value)} />
                  </div>
                  <div className="syl-form-group">
                    <label>Thời lượng 1 tiết (phút)</label>
                    <input type="number" placeholder="VD: 90" value={expectedDuration} onChange={e => setExpectedDuration(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDIT SESSIONS */}
          {step === 2 && (
            <div className="syl-fade-in">
              <div className="syl-edit-header">
                <span className="syl-ai-badge">✓ AI phân tích thành công: {sessions.length} tiết học (~{totalEstimatedMinutes} phút)</span>
                <button className="syl-btn-outline btn-sm" onClick={addSession}><Plus size={14}/> Thêm tiết mới</button>
              </div>
              <p className="syl-help-text">Vui lòng kiểm tra và chỉnh sửa nội dung các tiết học trước khi xếp lịch.</p>
              
              <div className="syl-session-list">
                {sessions.map((s, idx) => (
                  <div className="syl-scard" key={idx}>
                    <div className="syl-scard-num">{s.sessionNumber}</div>
                    <div className="syl-scard-content">
                      <input type="text" value={s.title} onChange={e => updateSession(idx, 'title', e.target.value)} placeholder="Tiêu đề tiết học" className="syl-scard-title-input" />
                      <textarea value={s.description} onChange={e => updateSession(idx, 'description', e.target.value)} rows={2} placeholder="Mô tả nội dung" className="syl-scard-desc-input" />
                      <div className="syl-scard-footer">
                        <div className="syl-dur-wrap">
                          ⏱ Ước tính: <input type="number" value={s.estimatedMinutes} onChange={e => updateSession(idx, 'estimatedMinutes', e.target.value)} className="syl-dur-input"/> phút
                        </div>
                        <button className="syl-btn-text-danger" onClick={() => removeSession(idx)}>Xóa</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SETTINGS */}
          {step === 3 && (
            <div className="syl-fade-in">
              <div className="syl-settings-top">
                <div className="syl-form-group">
                  <label>Ngày bắt đầu dự kiến</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="syl-form-group">
                  <label>Hình thức học mặc định</label>
                  <select value={sessionType} onChange={e => setSessionType(e.target.value)}>
                    <option value="OFFLINE">Trực tiếp (Tại lớp)</option>
                    <option value="ONLINE">Trực tuyến (Online)</option>
                  </select>
                </div>
              </div>

              <div className="syl-rules-box">
                <div className="syl-rules-header">
                  <label>Lịch học trong tuần (Các khung giờ có thể xếp)</label>
                  <button className="syl-btn-text-primary" onClick={handleAddRule}><Plus size={14}/> Thêm ca</button>
                </div>
                
                {weeklyRules.map((rule) => (
                  <div className="syl-rule-row" key={rule.id}>
                    <input type="checkbox" checked={rule.enabled} onChange={e => handleUpdateRule(rule.id, 'enabled', e.target.checked)} className="syl-rule-check"/>
                    <select value={rule.dayOfWeek} onChange={e => handleUpdateRule(rule.id, 'dayOfWeek', e.target.value)} className="syl-rule-select">
                      {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <span className="syl-rule-sep">Bắt đầu lúc:</span>
                    <input type="time" value={rule.startTime} onChange={e => handleUpdateRule(rule.id, 'startTime', e.target.value)} className="syl-rule-time"/>
                    <button className="syl-btn-icon-danger" onClick={() => handleRemoveRule(rule.id)}><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW */}
          {step === 4 && (
            <div className="syl-fade-in">
              {renderPreviewGrid()}
            </div>
          )}
        </div>

        <div className="syl-modal-footer">
          {step === 1 && (
            <>
              <button className="syl-btn syl-btn-outline" onClick={handleClose}>Hủy</button>
              <button className="syl-btn syl-btn-primary" onClick={analyzeSyllabus} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Phân tích AI ✨'}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button className="syl-btn syl-btn-outline" onClick={() => setStep(1)}>← Quay lại</button>
              <button className="syl-btn syl-btn-primary" onClick={() => setStep(3)}>Tiếp tục thiết lập →</button>
            </>
          )}
          {step === 3 && (
            <>
              <button className="syl-btn syl-btn-outline" onClick={() => setStep(2)}>← Chỉnh sửa danh sách</button>
              <button className="syl-btn syl-btn-primary" onClick={generatePreview} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : '🔍 Xem trước Lịch học'}
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <button className="syl-btn syl-btn-outline" onClick={() => setStep(3)}>← Sửa cài đặt lịch</button>
              <button className="syl-btn syl-btn-primary" onClick={confirmSchedule} disabled={loading || !previewData?.scheduledSessions?.length}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : '✅ Xác nhận tạo lịch'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
