import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Package,
  X,
} from "lucide-react";
import CenteredConfirmModal from "@/components/CenteredConfirmModal";
import { benefitApi } from "@/apis/benefit.api";
import { planApi } from "@/apis/plan.api";
import {
  BENEFIT_CODE_VALUES,
  BENEFIT_TYPE_VALUES,
  getBenefitCodeLabel,
  getBenefitTypeLabel,
} from "@/schema/benefit.schema";
import { getPlanStatusLabel } from "@/schema/plan.schema";
import { formatCurrency } from "@/lib/utils";
import "@/assets/css/pages/admin/planManagement.css";

const DURATION_UNIT_OPTIONS = [
  { value: "HOUR", label: "Giờ" },
  { value: "DAY", label: "Ngày" },
  { value: "WEEK", label: "Tuần" },
  { value: "MONTH", label: "Tháng" },
  { value: "YEAR", label: "Năm" },
];

const PLAN_STATUS_OPTIONS = [
  { value: "PUBLIC", label: "Công khai" },
  { value: "HIDE", label: "Ẩn" },
];

const DEFAULT_BENEFIT_CODE = BENEFIT_CODE_VALUES[0] || "AI_REQUEST";
const DEFAULT_BENEFIT_TYPE = BENEFIT_TYPE_VALUES[0] || "COUNTER";

const EMPTY_FORM = {
  name: "",
  price: "0",
  description: "",
  durationUnit: "MONTH",
  durationValue: "1",
  planStatus: "PUBLIC",
  benefits: [],
};

const normalizePlanStatusValue = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "PUBLIC";
  }

  if (normalizedStatus === "INACTIVE") {
    return "HIDE";
  }

  if (normalizedStatus === "PUBLIC" || normalizedStatus === "HIDE") {
    return normalizedStatus;
  }

  return "PUBLIC";
};

const formatPrice = (price) => {
  const number = Number(price);
  if (!Number.isFinite(number)) {
    return "-";
  }
  return formatCurrency(number);
};

const formatDuration = (unit, value) => {
  if (!unit || !value || Number(value) <= 0) {
    return "-";
  }

  const found = DURATION_UNIT_OPTIONS.find((item) => item.value === unit);
  return `${value} ${found?.label || unit}`;
};

const buildErrorMessage = (error, fallback) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (Array.isArray(error?.issues) && error.issues.length > 0) {
    return error.issues[0]?.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const normalizeFormFromPlan = (plan) => {
  const mappedBenefits = Array.isArray(plan?.benefits)
    ? plan.benefits
      .map((item) => ({
        id: Number(item?.benefit?.id),
        limit: String(item?.limitValue ?? ""),
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0)
    : [];

  return {
    name: plan?.name || "",
    price: String(plan?.price ?? 0),
    description: plan?.description || "",
    durationUnit: plan?.durationUnit || "MONTH",
    durationValue: String(plan?.durationValue && Number(plan.durationValue) > 0 ? plan.durationValue : 1),
    planStatus: normalizePlanStatusValue(plan?.planStatus),
    benefits: mappedBenefits,
  };
};

const AdminPlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newBenefitCode, setNewBenefitCode] = useState(DEFAULT_BENEFIT_CODE);
  const [newBenefitType, setNewBenefitType] = useState(DEFAULT_BENEFIT_TYPE);
  const [creatingBenefit, setCreatingBenefit] = useState(false);
  const [createBenefitError, setCreateBenefitError] = useState("");
  const [createBenefitSuccess, setCreateBenefitSuccess] = useState("");

  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansResponse, benefitsResponse] = await Promise.all([
        planApi.getPlans(),
        benefitApi.getBenefits(),
      ]);

      const fetchedPlans = Array.isArray(plansResponse?.result)
        ? plansResponse.result
        : [];
      const fetchedBenefits = Array.isArray(benefitsResponse?.result)
        ? benefitsResponse.result
        : [];

      setPlans(fetchedPlans);
      setBenefits(fetchedBenefits);
    } catch (err) {
      setError(buildErrorMessage(err, "Không thể tải dữ liệu gói dịch vụ."));
      setPlans([]);
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return plans;
    }

    return plans.filter((plan) => {
      const name = plan?.name?.toLowerCase() || "";
      const description = plan?.description?.toLowerCase() || "";
      const status = plan?.planStatus?.toLowerCase() || "";
      return (
        name.includes(query)
        || description.includes(query)
        || status.includes(query)
      );
    });
  }, [plans, searchQuery]);

  const resetBenefitCreateState = () => {
    setNewBenefitCode(DEFAULT_BENEFIT_CODE);
    setNewBenefitType(DEFAULT_BENEFIT_TYPE);
    setCreateBenefitError("");
    setCreateBenefitSuccess("");
  };

  const closeForm = () => {
    if (submitting || creatingBenefit) {
      return;
    }
    setIsFormOpen(false);
    setFormMode("create");
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setFormError("");
    resetBenefitCreateState();
  };

  const openCreateForm = () => {
    setFormMode("create");
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setFormError("");
    resetBenefitCreateState();
    setIsFormOpen(true);
  };

  const openEditForm = (plan) => {
    if (!Number.isFinite(Number(plan?.id)) || Number(plan?.id) <= 0) {
      setError("Không thể cập nhật gói do thiếu id từ backend.");
      return;
    }

    setFormMode("edit");
    setEditingPlan(plan);
    setForm(normalizeFormFromPlan(plan));
    setFormError("");
    resetBenefitCreateState();
    setIsFormOpen(true);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isBenefitSelected = (benefitId) =>
    form.benefits.some((item) => Number(item.id) === Number(benefitId));

  const toggleBenefit = (benefitId, checked) => {
    const normalizedId = Number(benefitId);

    setForm((prev) => {
      if (checked) {
        const existed = prev.benefits.some((item) => Number(item.id) === normalizedId);
        if (existed) {
          return prev;
        }
        return {
          ...prev,
          benefits: [...prev.benefits, { id: normalizedId, limit: "1" }],
        };
      }

      return {
        ...prev,
        benefits: prev.benefits.filter((item) => Number(item.id) !== normalizedId),
      };
    });
  };

  const selectBenefitInForm = (benefitId) => {
    const normalizedId = Number(benefitId);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
      return;
    }

    setForm((prev) => {
      const existed = prev.benefits.some((item) => Number(item.id) === normalizedId);
      if (existed) {
        return prev;
      }
      return {
        ...prev,
        benefits: [...prev.benefits, { id: normalizedId, limit: "1" }],
      };
    });
  };

  const changeBenefitLimit = (benefitId, nextLimit) => {
    const normalizedId = Number(benefitId);

    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.map((item) => {
        if (Number(item.id) !== normalizedId) {
          return item;
        }
        return {
          ...item,
          limit: nextLimit,
        };
      }),
    }));
  };

  const handleCreateBenefitInForm = async () => {
    if (creatingBenefit) {
      return;
    }

    setCreateBenefitError("");
    setCreateBenefitSuccess("");

    const existedBenefit = benefits.find(
      (item) => item?.code === newBenefitCode && item?.type === newBenefitType,
    );

    if (existedBenefit) {
      if (!Number.isFinite(Number(existedBenefit.id)) || Number(existedBenefit.id) <= 0) {
        setCreateBenefitError("Benefit đã tồn tại nhưng id không hợp lệ.");
        return;
      }

      selectBenefitInForm(existedBenefit.id);
      setCreateBenefitSuccess(
        `Benefit ${getBenefitCodeLabel(existedBenefit.code)} (${getBenefitTypeLabel(existedBenefit.type)}) đã tồn tại và được thêm vào gói.`,
      );
      return;
    }

    setCreatingBenefit(true);
    try {
      const response = await benefitApi.createBenefit({
        code: newBenefitCode,
        type: newBenefitType,
      });

      const createdBenefit = response?.result;
      const createdId = Number(createdBenefit?.id);

      if (!Number.isFinite(createdId) || createdId <= 0) {
        throw new Error("Tạo benefit thành công nhưng không nhận được id hợp lệ.");
      }

      setBenefits((prev) => {
        const existed = prev.some((item) => Number(item?.id) === createdId);
        if (existed) {
          return prev;
        }
        return [...prev, createdBenefit];
      });

      selectBenefitInForm(createdId);
      setCreateBenefitSuccess(
        `Đã tạo benefit ${getBenefitCodeLabel(createdBenefit?.code)} (${getBenefitTypeLabel(createdBenefit?.type)}) và thêm vào gói.`,
      );
    } catch (err) {
      setCreateBenefitError(buildErrorMessage(err, "Không thể tạo benefit mới."));
    } finally {
      setCreatingBenefit(false);
    }
  };

  const validateForm = () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const durationValue = Number(form.durationValue);

    if (!name) {
      return "Tên gói không được để trống.";
    }
    if (!description) {
      return "Mô tả không được để trống.";
    }
    if (!Number.isFinite(price) || price < 0) {
      return "Giá phải lớn hơn hoặc bằng 0.";
    }
    if (!form.durationUnit) {
      return "Vui lòng chọn đơn vị thời hạn.";
    }
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      return "Thời hạn phải lớn hơn 0.";
    }

    const invalidBenefit = form.benefits.find((item) => {
      const limit = Number(item.limit);
      return !Number.isFinite(limit) || limit <= 0;
    });

    if (invalidBenefit) {
      return "Mỗi benefit phải có giới hạn lớn hơn 0.";
    }

    return "";
  };

  const handleSubmitForm = async () => {
    setFormError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
      durationUnit: form.durationUnit,
      durationValue: Number(form.durationValue),
      planStatus: form.planStatus,
      benefits: form.benefits.map((item) => ({
        id: Number(item.id),
        limit: Number(item.limit),
      })),
    };

    setSubmitting(true);
    try {
      if (formMode === "create") {
        await planApi.createPlan(payload);
      } else {
        if (!Number.isFinite(Number(editingPlan?.id)) || Number(editingPlan?.id) <= 0) {
          throw new Error("Không thể cập nhật gói do thiếu id.");
        }
        await planApi.updatePlan(editingPlan.id, payload);
      }

      await fetchData();
      closeForm();
    } catch (err) {
      setFormError(buildErrorMessage(err, "Không thể lưu dữ liệu gói."));
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (plan) => {
    setPlanToDelete(plan);
  };

  const closeDeleteModal = () => {
    if (!deleteLoading) {
      setPlanToDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (!Number.isFinite(Number(planToDelete?.id)) || Number(planToDelete?.id) <= 0) {
      setError("Không thể xóa gói do thiếu id từ backend.");
      setPlanToDelete(null);
      return;
    }

    setDeleteLoading(true);
    try {
      await planApi.deletePlan(planToDelete.id);
      await fetchData();
      setPlanToDelete(null);
    } catch (err) {
      setError(buildErrorMessage(err, "Không thể xóa gói dịch vụ."));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="admin-plan-page">
      <div className="plan-header-card">
        <div>
          <p className="plan-screen-label">Plan Management</p>
          <h1>Quản lý gói dịch vụ</h1>
          <p className="plan-screen-subtitle">
            Quản lý danh sách gói, trạng thái hoạt động và lợi ích đi kèm cho từng gói.
          </p>
        </div>

        <button type="button" className="plan-create-btn" onClick={openCreateForm}>
          <Plus size={16} />
          Tạo gói
        </button>
      </div>

      <div className="plan-toolbar-card">
        <div className="plan-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên gói, mô tả, trạng thái..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="plan-table-card">
        {error && <div className="plan-error-banner">{error}</div>}

        <div className="plan-table-wrapper">
          <table className="plan-table">
            <thead>
              <tr>
                <th>Tên gói</th>
                <th>Giá</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th>Benefits</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="plan-state-cell">Đang tải dữ liệu gói...</td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="plan-state-cell">Không có gói phù hợp.</td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={`${plan.id ?? "missing"}-${plan.name}`}>
                    <td>
                      <div className="plan-name-cell">
                        <Package size={14} />
                        <span>{plan.name || "-"}</span>
                      </div>
                    </td>
                    <td>{formatPrice(plan.price)}</td>
                    <td>{formatDuration(plan.durationUnit, plan.durationValue)}</td>
                    <td>
                      <span
                        className={`plan-status-pill ${normalizePlanStatusValue(plan.planStatus).toLowerCase()}`}
                      >
                        {getPlanStatusLabel(plan.planStatus)}
                      </span>
                    </td>
                    <td>{Array.isArray(plan.benefits) ? plan.benefits.length : 0}</td>
                    <td className="plan-description-cell">{plan.description || "-"}</td>
                    <td>
                      <div className="plan-row-actions">
                        <button type="button" className="plan-row-btn edit" onClick={() => openEditForm(plan)}>
                          <Pencil size={14} />
                          Sửa
                        </button>
                        <button type="button" className="plan-row-btn delete" onClick={() => openDeleteModal(plan)}>
                          <Trash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="plan-form-overlay" onClick={closeForm}>
          <div className="plan-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="plan-form-header">
              <h2>{formMode === "create" ? "Tạo gói dịch vụ" : "Cập nhật gói dịch vụ"}</h2>
              <button
                type="button"
                className="plan-form-close"
                onClick={closeForm}
                disabled={submitting || creatingBenefit}
              >
                <X size={18} />
              </button>
            </div>

            {formError && <div className="plan-form-error">{formError}</div>}

            <div className="plan-form-body">
              <div className="plan-form-grid">
                <div className="plan-form-item">
                  <label htmlFor="plan-name">Tên gói</label>
                  <input
                    id="plan-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Ví dụ: PRO"
                  />
                </div>

                <div className="plan-form-item">
                  <label htmlFor="plan-price">Giá</label>
                  <input
                    id="plan-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="plan-form-item">
                  <label htmlFor="plan-duration-unit">Đơn vị thời hạn</label>
                  <select
                    id="plan-duration-unit"
                    value={form.durationUnit}
                    onChange={(event) => updateField("durationUnit", event.target.value)}
                  >
                    {DURATION_UNIT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="plan-form-item">
                  <label htmlFor="plan-duration-value">Giá trị thời hạn</label>
                  <input
                    id="plan-duration-value"
                    type="number"
                    min={1}
                    step="1"
                    value={form.durationValue}
                    onChange={(event) => updateField("durationValue", event.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="plan-form-item full-width">
                  <label htmlFor="plan-status">Trạng thái</label>
                  <select
                    id="plan-status"
                    value={form.planStatus}
                    onChange={(event) => updateField("planStatus", event.target.value)}
                  >
                    {PLAN_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="plan-form-item full-width">
                  <label htmlFor="plan-description">Mô tả</label>
                  <textarea
                    id="plan-description"
                    rows={3}
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Mô tả ngắn về gói"
                  />
                </div>
              </div>

              <div className="plan-benefit-box">
                <p className="plan-benefit-title">Lợi ích trong gói</p>

                <div className="plan-benefit-create-wrap">
                  <p className="plan-benefit-create-title">Tạo benefit ngay trong form</p>
                  <div className="plan-benefit-create-controls">
                    <select
                      value={newBenefitCode}
                      onChange={(event) => setNewBenefitCode(event.target.value)}
                      disabled={creatingBenefit || submitting}
                    >
                      {BENEFIT_CODE_VALUES.map((value) => (
                        <option key={value} value={value}>
                          {getBenefitCodeLabel(value)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={newBenefitType}
                      onChange={(event) => setNewBenefitType(event.target.value)}
                      disabled={creatingBenefit || submitting}
                    >
                      {BENEFIT_TYPE_VALUES.map((value) => (
                        <option key={value} value={value}>
                          {getBenefitTypeLabel(value)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="plan-benefit-create-btn"
                      onClick={handleCreateBenefitInForm}
                      disabled={creatingBenefit || submitting}
                    >
                      {creatingBenefit ? "Đang tạo..." : "Tạo benefit"}
                    </button>
                  </div>

                  {createBenefitError && (
                    <div className="plan-benefit-create-message error">{createBenefitError}</div>
                  )}

                  {createBenefitSuccess && (
                    <div className="plan-benefit-create-message success">{createBenefitSuccess}</div>
                  )}
                </div>

                {benefits.length === 0 ? (
                  <div className="plan-benefit-empty">Chưa có benefit để lựa chọn.</div>
                ) : (
                  <div className="plan-benefit-list">
                    {benefits.map((benefit) => {
                      const selected = isBenefitSelected(benefit.id);
                      const selectedBenefit = form.benefits.find(
                        (item) => Number(item.id) === Number(benefit.id),
                      );

                      return (
                        <div key={benefit.id} className="plan-benefit-row">
                          <label className="plan-benefit-checkbox">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => toggleBenefit(benefit.id, event.target.checked)}
                            />
                            <span>
                              {getBenefitCodeLabel(benefit.code)} ({getBenefitTypeLabel(benefit.type)})
                            </span>
                          </label>

                          <input
                            type="number"
                            min={1}
                            step={1}
                            disabled={!selected}
                            value={selected ? selectedBenefit?.limit || "" : ""}
                            onChange={(event) => changeBenefitLimit(benefit.id, event.target.value)}
                            placeholder="Limit"
                            className="plan-benefit-limit-input"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="plan-form-actions">
              <button
                type="button"
                className="plan-btn-secondary"
                onClick={closeForm}
                disabled={submitting || creatingBenefit}
              >
                Hủy
              </button>
              <button
                type="button"
                className="plan-btn-primary"
                onClick={handleSubmitForm}
                disabled={submitting || creatingBenefit}
              >
                {submitting ? "Đang lưu..." : formMode === "create" ? "Tạo gói" : "Cập nhật gói"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CenteredConfirmModal
        isOpen={Boolean(planToDelete)}
        title="Bạn có chắc chắn muốn xóa gói này?"
        description={`Gói ${planToDelete?.name || ""} sẽ bị xóa khỏi hệ thống.`}
        confirmText="Xóa gói"
        cancelText="Hủy"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onClose={closeDeleteModal}
        loading={deleteLoading}
      />
    </div>
  );
};

export default AdminPlanManagementPage;
