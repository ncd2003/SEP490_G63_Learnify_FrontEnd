import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { assignmentApi } from "@/apis/assignment.api";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_TEACHER } from "@/routes/paths";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;
  --pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);
  --gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);
  --bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;
  --t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;
  --gn:#10B981;--gnl:#ECFDF5;--gnd:#065F46;
  --or:#F59E0B;--orl:#FFFBEB;
  --rd:#EF4444;--rdl:#FEF2F2;
  --pu:#8B5CF6;--pul:#F5F3FF;--pud:#4C1D95;
  --sk:#0EA5E9;--skl:#F0F9FF;--skd:#0C4A6E;
  --b:#E2E8F0;--bl:#F1F5F9;
  --ss:0 1px 3px rgba(30,41,59,.04);
  --sm:0 4px 14px rgba(30,41,59,.07);
  --rl:14px;--rxl:18px;
  --f:'Be Vietnam Pro',sans-serif;--fm:'JetBrains Mono',monospace;
  --e:cubic-bezier(.4,0,.2,1);
  --rs:8px;--rm:10px;--rl:14px;--rxl:18px;
}
*{box-sizing:border-box;margin:0;padding:0}

.page{display:flex;flex-direction:column;min-height:100vh;background:var(--bg);color:var(--t);font-family:var(--f)}

.topbar{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:100;flex-shrink:0}
.topbar-l{display:flex;align-items:center;gap:12px}
.bk{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;transition:all .15s var(--e)}
.bk:hover{border-color:var(--p);color:var(--p)}
.sep{width:1px;height:18px;background:var(--b)}
.page-title{font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px;font-family:var(--f)}
.stat-pill{display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:var(--bl);color:var(--t2);font-family:var(--f)}
.add-qs-grp{display:flex;align-items:center;gap:6px;margin-left:8px}
.tb-add-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:1.5px solid var(--b);background:var(--card);color:var(--t2);transition:all .15s var(--e)}
.tb-add-btn:hover:not(:disabled){border-color:var(--p);color:var(--p);background:var(--hov)}
.tb-add-btn:disabled{opacity:.4;cursor:not-allowed}
.tb-add-btn span{font-size:13px}
.topbar-r{display:flex;gap:6px}

.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 16px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}
.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 4px 18px var(--ps)}
.btn-p:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}
.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}

.content-area{padding:24px 32px 100px;width:100%;max-width:1600px;margin:0 auto}

.section-wrap{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:20px;overflow:hidden;box-shadow:var(--ss)}
.section-hdr{padding:14px 20px;border-bottom:1px solid var(--bl);display:flex;align-items:center;justify-content:space-between;background:var(--plr)}
.section-title{font-size:14px;font-weight:800;color:var(--t);font-family:var(--f)}
.section-hdr-right{display:flex;align-items:center;gap:12px}
.section-meta{font-size:12px;color:var(--t3);font-weight:500;font-family:var(--f)}
.sec-type-badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;background:var(--bl);color:var(--t2);font-size:10px;font-weight:800;letter-spacing:.04em;font-family:var(--f)}
.sec-type-badge.OBJECTIVE{background:var(--pl);color:var(--p)}
.sec-type-badge.ESSAY{background:var(--pul);color:var(--pud)}
.sec-type-badge.MIXED{background:var(--gnl);color:var(--gnd)}

.qc{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:14px;transition:all .25s var(--e);overflow:hidden}
.qc:hover{border-color:#CBD5E1;box-shadow:var(--sm)}
.qc.editing{border-color:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.1)}

.qc-main{padding:20px 24px}
.qc-top{display:flex;flex-direction:column;gap:16px;margin-bottom:14px}
.qc-top-meta-row{display:flex;align-items:center;gap:12px}
.qc-num{min-width:28px;height:28px;border-radius:50%;background:var(--p);color:var(--inv);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.qc.editing .qc-num{background:var(--or)}

.qc-body{flex:1;min-width:0}
.qc-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.qc-type-badge{padding:3px 8px;border-radius:10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;display:inline-block}
.qc-type-badge.mc{background:var(--pl);color:var(--p)}
.qc-type-badge.tf{background:var(--gnl);color:var(--gnd)}
.qc-type-badge.fb{background:var(--orl);color:#92400E}
.qc-type-badge.es{background:var(--pul);color:var(--pud)}

.qc-prompt{font-size:14px;font-weight:600;line-height:1.7;white-space:pre-line;color:var(--t)}

.qc-opts{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.qc-opt{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border:1.5px solid var(--bl);border-radius:var(--rs);font-size:13px;line-height:1.5;color:var(--t2);font-weight:500;transition:all .15s var(--e);height:100%}
.qc-opt.correct{border-color:var(--gn);background:var(--gnl);color:var(--gnd);font-weight:700}
.qc-opt-lbl{width:22px;height:22px;border-radius:50%;border:1.5px solid var(--b);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--t3);flex-shrink:0;margin-top:1px}
.qc-opt.correct .qc-opt-lbl{border-color:var(--gn);background:var(--gn);color:var(--inv)}

.qc-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 24px;border-top:1px solid var(--bl);background:var(--bg)}
.qc-bar-l,.qc-bar-r{display:flex;gap:6px;align-items:center}
.ab{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:var(--rs);border:none;background:none;font-size:11px;font-weight:700;font-family:var(--f);color:var(--t3);cursor:pointer;transition:all .15s var(--e)}
.ab:hover{background:var(--hov);color:var(--p)}
.ab.sv{color:var(--gn)}.ab.sv:hover{background:var(--gnl)}
.ab.dng:hover{background:var(--rdl);color:var(--rd)}

.ed-prompt{width:100%;padding:12px 16px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:14px;font-family:var(--f);font-weight:600;color:var(--t);background:#FFFDF7;min-height:80px;resize:vertical;line-height:1.6;outline:none;margin-bottom:16px}
.ed-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:16px}
.ed-fld{display:flex;flex-direction:column;gap:6px}
.ed-lbl{font-size:11px;font-weight:800;color:var(--t2);text-transform:uppercase;letter-spacing:.04em}
.ed-input{padding:10px 14px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:13px;font-family:var(--f);color:var(--t);background:var(--inp);outline:none;transition:border-color .15s var(--e)}
.ed-input:focus{border-color:var(--p)}

.ed-opt-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.ed-opt-row{display:flex;align-items:center;gap:12px}
.ed-opt-input{flex:1;padding:10px 14px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:13px;font-family:var(--f);color:var(--t);background:var(--inp);outline:none}
.ed-opt-radio{width:24px;height:24px;border-radius:50%;border:2.5px solid var(--b);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--e);font-size:11px}
.ed-opt-radio.on{border-color:var(--gn);background:var(--gn);color:var(--inv)}

.q-empty{border:1.5px dashed var(--b);border-radius:var(--rl);padding:40px;text-align:center;color:var(--t3);font-size:14px;font-weight:500;font-family:var(--f)}

.sec-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--b);background:var(--card);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--e)}
.sec-btn:hover{border-color:var(--p);color:var(--p);background:var(--hov)}
.sec-btn.dng:hover{border-color:var(--rd);color:var(--rd);background:var(--rdl)}

.modal-ov{position:fixed;inset:0;background:rgba(30,41,59,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:2000;animation:fin .2s ease}
.modal-box{background:var(--card);border-radius:var(--rxl);padding:28px 32px;max-width:440px;width:92%;box-shadow:var(--sl);animation:msin .25s cubic-bezier(.2,0,.2,1)}
@keyframes fin{from{opacity:0}to{opacity:1}}
@keyframes msin{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-t{font-size:18px;font-weight:800;color:var(--t);margin-bottom:8px}
.modal-tx{font-size:14px;color:var(--t2);line-height:1.6;margin-bottom:24px}
.modal-btns{display:flex;gap:10px;justify-content:flex-end}
`;

const LT = "ABCDEFGH";
const TC = { MULTIPLE_CHOICE: "mc", TRUE_FALSE: "tf", FILL_IN_THE_BLANK: "fb", ESSAY: "es" };
const TL = { MULTIPLE_CHOICE: "Trắc nghiệm", TRUE_FALSE: "Đúng / Sai", FILL_IN_THE_BLANK: "Điền khuyết", ESSAY: "Tự luận" };

const COG_UI = {
  REMEMBERING: { label: "Nhớ", bg: "#ECFDF5", border: "#86EFAC", text: "#047857" },
  UNDERSTANDING: { label: "Hiểu", bg: "#ECFEFF", border: "#67E8F9", text: "#0E7490" },
  APPLYING: { label: "Vận dụng", bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8" },
  ANALYZING: { label: "Phân tích", bg: "#F5F3FF", border: "#C4B5FD", text: "#6D28D9" },
  EVALUATING: { label: "Đánh giá", bg: "#FFFBEB", border: "#FCD34D", text: "#B45309" },
  CREATING: { label: "Sáng tạo", bg: "#FEF2F2", border: "#FCA5A5", text: "#B91C1C" },
};

const toPositiveId = (v) => { const p = Number(v); return Number.isFinite(p) && p > 0 ? p : null; };

const mapWorkspaceQuestion = (q) => {
  const type = String(q?.questionData?.questionType || q?.type || q?.questionType || "MULTIPLE_CHOICE").toUpperCase().replace("FILL_IN_BLANK", "FILL_IN_THE_BLANK");
  const opts = Array.isArray(q?.questionData?.options || q?.opts || q?.options || q?.answers || []) ? (q?.questionData?.options || q?.opts || q?.options || q?.answers).map(o => typeof o === 'object' ? String(o.content || o.text || "") : String(o)) : [];
  const cor = q?.cor ?? q?.correct ?? q?.answer;
  
  const mapped = {
    id: toPositiveId(q?.itemId || q?.id) || Math.random(),
    itemId: toPositiveId(q?.itemId || q?.assignmentQuestionId || q?.id) || null,
    type,
    prompt: String(q?.questionData?.content || q?.prompt || q?.content || ""),
    cognitiveLevel: String(q?.questionData?.cognitiveLevel || q?.cognitiveLevel || "APPLYING").toUpperCase(),
    points: Number(q?.questionData?.defaultPoints ?? q?.points ?? 1) || 1,
    sourceType: String(q?.questionData?.sourceType || q?.sourceType || "MANUAL").toUpperCase(),
    status: q?.status || "SUCCESS",
    errors: Array.isArray(q?.errors) ? q.errors : [],
  };

  const rawOpts = q?.questionData?.options || q?.opts || [];
  const correctIdx = Array.isArray(rawOpts) ? rawOpts.findIndex(o => Boolean(o.correct)) : -1;

  if (type === "MULTIPLE_CHOICE") {
    mapped.opts = opts.length ? opts : ["A", "B", "C", "D"];
    mapped.cor = correctIdx >= 0 ? correctIdx : (typeof cor === 'number' ? cor : 0);
  } else if (type === "TRUE_FALSE") {
    const isTrueCorrect = Array.isArray(rawOpts) && rawOpts.some(o => (o.content === "Đúng" || o.content === "True") && Boolean(o.correct));
    const isFalseCorrect = Array.isArray(rawOpts) && rawOpts.some(o => (o.content === "Sai" || o.content === "False") && Boolean(o.correct));
    if (isTrueCorrect) mapped.cor = true;
    else if (isFalseCorrect) mapped.cor = false;
    else mapped.cor = Boolean(cor === true || cor === "true" || cor === 1);
  } else if (type === "FILL_IN_THE_BLANK") {
    mapped.ans = String(q?.questionData?.options?.[0]?.content || q?.ans || q?.answer || "");
  } else if (type === "ESSAY") {
    mapped.sampleAnswer = String(q?.questionData?.sampleAnswer || q?.sampleAnswer || "");
  }
  return mapped;
};

const I = {
  Send: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
};

export default function AssignmentEditQuestionsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [assignment, setAssignment] = useState(null);
  const [sections, setSections] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [workspaceSessionId, setWorkspaceSessionId] = useState(null);

  // Modals
  const [editSectionModal, setEditSectionModal] = useState(null);
  const [deleteSectionModal, setDeleteSectionModal] = useState(null);
  const [deleteQuestionModal, setDeleteQuestionModal] = useState(null);
  
  const [sectionActionBusy, setSectionActionBusy] = useState(false);
  const [questionActionBusy, setQuestionActionBusy] = useState(false);

  const totalQ = sections.reduce((a, s) => a + s.questions.length, 0);

  const loadWorkspace = async (sessionIdInput = null) => {
    setIsLoadingWorkspace(true);
    try {
      const assignmentId = toPositiveId(id);
      const aResp = await assignmentApi.getAssignment(assignmentId);
      const assignmentData = aResp?.result;
      setAssignment(assignmentData);

      let sid = sessionIdInput || toPositiveId(searchParams.get("sessionId"));
      if (!sid) {
        const initResp = await assignmentApi.initAssignmentWorkspace(assignmentId);
        sid = toPositiveId(initResp?.result?.sessionId || initResp?.result?.id || initResp?.result);
      }
      setWorkspaceSessionId(sid);

      const rawSecs = Array.isArray(assignmentData?.sections) ? assignmentData.sections : [];
      const mapped = rawSecs.map((s, idx) => ({
        id: toPositiveId(s.id) || idx + 1,
        title: s.title || `Phần ${idx + 1}`,
        sectionType: s.sectionType || "OBJECTIVE",
        questions: (s.questions || []).map(q => {
          const qData = q.question || {};
          return mapWorkspaceQuestion({
            ...q,
            questionData: {
              ...qData,
              defaultPoints: q.points ?? qData.defaultPoints
            },
            itemId: qData.id 
          });
        })
      }));
      setSections(mapped);
    } catch (err) {
      toast.error("Không thể tải bài tập.");
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  useEffect(() => { loadWorkspace(); }, [id]);

  const handleBack = () => navigate(PATH_TEACHER.assignmentDetail(id));

  const startEdit = (q, sid, idx) => {
    setEditId(q.id);
    setEditData({ ...q, sectionId: sid, orderIndex: idx });
  };

  const saveEdit = async () => {
    if (!editData) return;
    
    const type = editData.type;
    let options = null;

    if (type === "MULTIPLE_CHOICE") {
      options = (editData.opts || []).map((content, i) => ({
        content,
        correct: i === editData.cor
      }));
    } else if (type === "TRUE_FALSE") {
      options = [
        { content: "Đúng", correct: editData.cor === true },
        { content: "Sai", correct: editData.cor === false }
      ];
    } else if (type === "FILL_IN_THE_BLANK") {
      options = [{ content: editData.ans || "", correct: true }];
    }

    const payload = {
      content: editData.prompt,
      questionType: type,
      cognitiveLevel: editData.cognitiveLevel,
      defaultPoints: Number(editData.points) || 1,
      sampleAnswer: type === "ESSAY" ? editData.sampleAnswer : null,
      options: options,
      sectionId: editData.sectionId
    };

    try {
      const qId = toPositiveId(editData.itemId);
      if (!qId) {
        toast.error("Không tìm thấy ID câu hỏi để cập nhật.");
        return;
      }

      const resp = await assignmentApi.updateAssignmentQuestion(
        id,
        editData.sectionId,
        qId,
        payload
      );

      if (resp?.code === 1000) {
        toast.success("Cập nhật câu hỏi thành công.");
        setSections(prev => prev.map(s => ({
          ...s,
          questions: s.questions.map(q => (toPositiveId(q.itemId) === qId) ? editData : q)
        })));
        setEditId(null);
        setEditData(null);
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.response?.data?.message || "Cập nhật câu hỏi thất bại.");
    }
  };

  const delQ = async () => {
    if (!id || !deleteQuestionModal) return;
    const { sid, q } = deleteQuestionModal;
    setQuestionActionBusy(true);
    try {
      await assignmentApi.deleteAssignmentQuestion(id, sid, q.itemId);
      setSections(prev => prev.map(s => s.id === sid ? { ...s, questions: s.questions.filter(item => item.id !== q.id) } : s));
      toast.success("Đã xóa câu hỏi.");
      setDeleteQuestionModal(null);
    } catch {
      toast.error("Xóa thất bại.");
    } finally {
      setQuestionActionBusy(false);
    }
  };

  const updateSection = async () => {
    if (!editSectionModal || !id) return;
    setSectionActionBusy(true);
    try {
      await assignmentApi.updateSection(id, editSectionModal.id, { title: editSectionModal.title, sectionType: editSectionModal.sectionType });
      setSections(prev => prev.map(s => s.id === editSectionModal.id ? { ...s, title: editSectionModal.title, sectionType: editSectionModal.sectionType } : s));
      setEditSectionModal(null);
      toast.success("Đã cập nhật phần.");
    } catch {
      toast.error("Cập nhật thất bại.");
    } finally {
      setSectionActionBusy(false);
    }
  };

  const deleteSection = async () => {
    if (!deleteSectionModal || !id) return;
    setSectionActionBusy(true);
    try {
      await assignmentApi.deleteSection(id, deleteSectionModal.id);
      setSections(prev => prev.filter(s => s.id !== deleteSectionModal.id));
      setDeleteSectionModal(null);
      toast.success("Đã xóa phần.");
    } catch {
      toast.error("Xóa phần thất bại.");
    } finally {
      setSectionActionBusy(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const payload = {
        title: assignment?.title,
        description: assignment?.description,
        category: assignment?.category,
        format: assignment?.format,
        status: assignment?.status || "PUBLISHED"
      };
      await assignmentApi.updateAssignment(id, payload);
      toast.success("Đã cập nhật bài tập thành công.");
      setPublished(true);
      setTimeout(handleBack, 2000);
    } catch (err) {
      toast.error("Cập nhật thất bại.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="page">
      <style>{CSS}</style>
      <div className="topbar">
        <div className="topbar-l">
          <button className="bk" onClick={handleBack}>← Quay lại</button>
          <div className="sep" />
          <div className="page-title">Chỉnh sửa câu hỏi · {assignment?.title}</div>
          <div className="add-qs-grp">
            <button className="tb-add-btn" onClick={() => navigate(`${PATH_TEACHER.assignmentCreateManualQuestions}?assignmentId=${id}&sessionId=${workspaceSessionId}`)}><span>✎</span> Thủ công</button>
            <button className="tb-add-btn" onClick={() => navigate(`${PATH_TEACHER.assignmentCreateAi}?assignmentId=${id}&sessionId=${workspaceSessionId}`)}><span>✦</span> Với AI</button>
            <button className="tb-add-btn" onClick={() => navigate(`${PATH_TEACHER.assignmentQuestionBankPicker}?assignmentId=${id}&sessionId=${workspaceSessionId}`)}><span>◈</span> Ngân hàng</button>
          </div>
        </div>
        <div className="topbar-r">
          <span className="stat-pill"><b>{totalQ}</b> câu hỏi</span>
          <button className="btn btn-p" onClick={handlePublish} disabled={publishing}>{publishing ? "Đang lưu..." : "✦ Lưu thay đổi"}</button>
        </div>
      </div>

      <div className="content-area">
        {sections.map(s => (
          <div key={s.id} className="section-wrap">
            <div className="section-hdr">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="section-title">{s.title}</div>
                <span className={`sec-type-badge ${s.sectionType}`}>{s.sectionType === 'OBJECTIVE' ? 'Trắc nghiệm' : s.sectionType === 'ESSAY' ? 'Tự luận' : 'Hỗn hợp'}</span>
              </div>
              <div className="section-hdr-right">
                <span className="section-meta">{s.questions.length} câu · {s.questions.reduce((sum, q) => sum + q.points, 0)} điểm</span>
                <div className="section-actions">
                  <button className="sec-btn" onClick={(e) => { e.stopPropagation(); setEditSectionModal(s); }}><I.Edit /></button>
                  <button className="sec-btn dng" onClick={(e) => { e.stopPropagation(); setDeleteSectionModal(s); }}><I.Trash /></button>
                </div>
              </div>
            </div>
            <div className="section-body">
              {s.questions.map((q, idx) => {
                const isEd = editId === q.id;
                const d = isEd ? editData : q;
                return (
                  <div key={q.id} className={`qc ${isEd ? 'editing' : ''}`}>
                    <div className="qc-main">
                      <div className="qc-top">
                        <div className="qc-top-meta-row">
                          <div className="qc-num">{idx + 1}</div>
                          <div className="qc-badges"><span className={`qc-type-badge ${TC[d.type]}`}>{TL[d.type]}</span></div>
                        </div>
                        <div className="qc-body">
                          {isEd ? (
                            <>
                              <textarea 
                                className="ed-prompt" 
                                placeholder="Nội dung câu hỏi..."
                                value={d.prompt} 
                                onChange={e => setEditData({ ...d, prompt: e.target.value })} 
                                autoFocus 
                              />
                              
                              <div className="ed-grid">
                                <div className="ed-fld">
                                  <label className="ed-lbl">Mức độ nhận thức</label>
                                  <select 
                                    className="ed-input"
                                    value={d.cognitiveLevel}
                                    onChange={e => setEditData({ ...d, cognitiveLevel: e.target.value })}
                                  >
                                    {Object.entries(COG_UI).map(([key, val]) => (
                                      <option key={key} value={key}>{val.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="ed-fld">
                                  <label className="ed-lbl">Điểm số</label>
                                  <input 
                                    type="number" 
                                    className="ed-input"
                                    value={d.points}
                                    step="0.1"
                                    min="0"
                                    onChange={e => setEditData({ ...d, points: e.target.value })}
                                  />
                                </div>
                              </div>

                              {d.type === 'MULTIPLE_CHOICE' && (
                                <div className="ed-fld" style={{ marginBottom: 14 }}>
                                  <label className="ed-lbl">Các đáp án (Tích vào đáp án đúng)</label>
                                  <div className="ed-opt-grid">
                                    {d.opts.map((o, oi) => (
                                      <div key={oi} className="ed-opt-row">
                                        <div 
                                          className={`ed-opt-radio ${d.cor === oi ? 'on' : ''}`}
                                          onClick={() => setEditData({ ...d, cor: oi })}
                                        >
                                          {d.cor === oi ? <I.Check /> : LT[oi]}
                                        </div>
                                        <input 
                                          className="ed-opt-input"
                                          value={o}
                                          onChange={e => {
                                            const newOpts = [...d.opts];
                                            newOpts[oi] = e.target.value;
                                            setEditData({ ...d, opts: newOpts });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {d.type === 'TRUE_FALSE' && (
                                <div className="ed-fld" style={{ marginBottom: 14 }}>
                                  <label className="ed-lbl">Đáp án đúng</label>
                                  <div style={{ display: 'flex', gap: 10 }}>
                                    <button 
                                      className={`btn ${d.cor === true ? 'btn-p' : 'btn-g'}`}
                                      onClick={() => setEditData({ ...d, cor: true })}
                                      style={{ flex: 1, justifyContent: 'center' }}
                                    >Đúng</button>
                                    <button 
                                      className={`btn ${d.cor === false ? 'btn-p' : 'btn-g'}`}
                                      onClick={() => setEditData({ ...d, cor: false })}
                                      style={{ flex: 1, justifyContent: 'center' }}
                                    >Sai</button>
                                  </div>
                                </div>
                              )}

                              {d.type === 'FILL_IN_THE_BLANK' && (
                                <div className="ed-fld" style={{ marginBottom: 14 }}>
                                  <label className="ed-lbl">Đáp án đúng (Ô trống)</label>
                                  <input 
                                    className="ed-input"
                                    placeholder="Nhập nội dung cần điền..."
                                    value={d.ans}
                                    onChange={e => setEditData({ ...d, ans: e.target.value })}
                                  />
                                </div>
                              )}

                              {d.type === 'ESSAY' && (
                                <div className="ed-fld" style={{ marginBottom: 14 }}>
                                  <label className="ed-lbl">Câu trả lời mẫu / Gợi ý chấm bài</label>
                                  <textarea 
                                    className="ed-input"
                                    style={{ minHeight: 80 }}
                                    placeholder="Nhập đáp án tham khảo cho giáo viên..."
                                    value={d.sampleAnswer}
                                    onChange={e => setEditData({ ...d, sampleAnswer: e.target.value })}
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  borderRadius: 6, 
                                  fontSize: 10, 
                                  fontWeight: 800,
                                  background: COG_UI[d.cognitiveLevel]?.bg,
                                  color: COG_UI[d.cognitiveLevel]?.text,
                                  border: `1px solid ${COG_UI[d.cognitiveLevel]?.border}`
                                }}>
                                  {COG_UI[d.cognitiveLevel]?.label}
                                </span>
                              </div>
                              <div className="qc-prompt" dangerouslySetInnerHTML={{ __html: d.prompt }} />
                              {d.type === 'MULTIPLE_CHOICE' && (
                                <div className="qc-opts">
                                  {d.opts.map((o, oi) => (
                                    <div key={oi} className={`qc-opt ${oi === d.cor ? 'correct' : ''}`}>
                                      <div className="qc-opt-lbl">{oi === d.cor ? <I.Check /> : LT[oi]}</div>
                                      <span dangerouslySetInnerHTML={{ __html: o }} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {d.type === 'TRUE_FALSE' && (
                                <div className="qc-opts">
                                  <div className={`qc-opt ${d.cor === true ? 'correct' : ''}`}>
                                    <div className="qc-opt-lbl">{d.cor === true ? <I.Check /> : ''}</div>
                                    <span>Đúng</span>
                                  </div>
                                  <div className={`qc-opt ${d.cor === false ? 'correct' : ''}`}>
                                    <div className="qc-opt-lbl">{d.cor === false ? <I.Check /> : ''}</div>
                                    <span>Sai</span>
                                  </div>
                                </div>
                              )}
                              {d.type === 'FILL_IN_THE_BLANK' && (
                                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--gnl)', borderRadius: 8, fontSize: 12, color: 'var(--gnd)', fontWeight: 600 }}>
                                  Đáp án: {d.ans}
                                </div>
                              )}
                              {d.type === 'ESSAY' && d.sampleAnswer && (
                                <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bl)', borderRadius: 10, fontSize: 12, color: 'var(--t2)', lineBreak: 'anywhere' }}>
                                  <div style={{ fontWeight: 800, fontSize: 10, textTransform: 'uppercase', marginBottom: 4, color: 'var(--t3)' }}>Đáp án mẫu</div>
                                  {d.sampleAnswer}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="qc-bar">
                      <div className="qc-bar-l">
                        {isEd ? (
                          <><button className="ab sv" onClick={saveEdit}><I.Check /> Lưu thay đổi</button><button className="ab" onClick={() => { setEditId(null); setEditData(null); }}>✕ Hủy</button></>
                        ) : (
                          <button className="ab" onClick={() => startEdit(q, s.id, idx)}>✎ Sửa chi tiết</button>
                        )}
                      </div>
                      <div className="qc-bar-r">
                        <span style={{ fontSize: 11, fontWeight: 700, marginRight: 8 }}>{d.points}đ</span>
                        <button className="ab dng" onClick={() => setDeleteQuestionModal({ sid: s.id, q })}>✕ Xóa</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!s.questions.length && <div className="q-empty">Chưa có câu hỏi trong phần này.</div>}
            </div>
          </div>
        ))}
      </div>

      {editSectionModal && (
        <div className="modal-ov">
          <div className="modal-box">
            <div className="modal-t">Chỉnh sửa phần</div>
            <div className="modal-tx">Thay đổi tiêu đề và loại của phần này.</div>
            <input 
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--b)', borderRadius: '10px', fontSize: '13px', marginBottom: '12px' }} 
              value={editSectionModal.title} 
              onChange={e => setEditSectionModal({ ...editSectionModal, title: e.target.value })} 
            />
            <select 
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--b)', borderRadius: '10px', fontSize: '13px', marginBottom: '20px' }} 
              value={editSectionModal.sectionType} 
              onChange={e => setEditSectionModal({ ...editSectionModal, sectionType: e.target.value })}
            >
              <option value="OBJECTIVE">Trắc nghiệm</option>
              <option value="ESSAY">Tự luận</option>
              <option value="MIXED">Hỗn hợp</option>
            </select>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={() => setEditSectionModal(null)}>Hủy</button>
              <button className="btn btn-p" onClick={updateSection} disabled={sectionActionBusy}>{sectionActionBusy ? "Đang lưu..." : "Lưu thay đổi"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteSectionModal && (
        <div className="modal-ov">
          <div className="modal-box">
            <div className="modal-t">Xóa phần?</div>
            <div className="modal-tx">Bạn có chắc muốn xóa "{deleteSectionModal.title}"? Câu hỏi trong phần này sẽ không bị xóa nhưng sẽ mất liên kết với phần.</div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={() => setDeleteSectionModal(null)}>Hủy</button>
              <button className="btn btn-p" style={{ background: 'var(--rd)' }} onClick={deleteSection} disabled={sectionActionBusy}>{sectionActionBusy ? "Đang xóa..." : "Xóa phần"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteQuestionModal && (
        <div className="modal-ov">
          <div className="modal-box">
            <div className="modal-t">Xóa câu hỏi?</div>
            <div className="modal-tx">
              Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi? 
              Hành động này không thể hoàn tác.
            </div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={() => setDeleteQuestionModal(null)}>Hủy</button>
              <button 
                className="btn btn-p" 
                style={{ background: 'var(--rd)' }} 
                onClick={delQ} 
                disabled={questionActionBusy}
              >
                {questionActionBusy ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {published && (
        <div className="modal-ov">
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: 'var(--gn)', marginBottom: 12 }}>✓</div>
            <div className="modal-t">Thành công!</div>
            <div className="modal-tx">Các thay đổi của bạn đã được lưu và cập nhật cho bài tập.</div>
            <button className="btn btn-p" onClick={handleBack}>Quay lại chi tiết</button>
          </div>
        </div>
      )}
    </div>
  );
}
