import { useState, useCallback } from "react";
import { toast } from "sonner";
import { questionBankApi } from "@/apis/question-bank.api";

const MSG39 = "Ngân hàng đề đã được tạo thành công.";
const MSG40 =
  "Tên ngân hàng đề bị trùng trong Khối lớp/Môn học này. Vui lòng đổi tên khác.";
const MSG81 = "Ngân hàng đề đã được cập nhật thành công.";
const MSG83 = "Ngân hàng đề đã được xóa thành công.";
const MSG84 = "Hiện tại không thể xóa Ngân hàng đề. Vui lòng thử lại sau.";

const INITIAL_PAGINATION = {
  pageNumber: 1,
  pageSize: 5,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

const useQuestionBanks = () => {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const fetchBanks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionBankApi.getQuestionBanks(params);
      const result = response?.result ?? {};
      setQuestionBanks(Array.isArray(result.content) ? result.content : []);
      setPagination({
        pageNumber: result.pageNumber ?? params.page ?? 1,
        pageSize: result.pageSize ?? params.size ?? INITIAL_PAGINATION.pageSize,
        totalElements: result.totalElements ?? 0,
        totalPages: result.totalPages ?? 0,
        last: result.last ?? true,
      });
      return result;
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể tải ngân hàng câu hỏi.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBank = useCallback(async (data) => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await questionBankApi.createQuestionBank(data);
      const isSuccessCode = Number(response?.code) === 1000;
      if (!isSuccessCode) {
        const wrappedError = new Error(
          response?.message ?? "Không thể tạo ngân hàng câu hỏi.",
        );
        wrappedError.response = {
          data: {
            message: response?.message ?? "Không thể tạo ngân hàng câu hỏi.",
          },
        };
        throw wrappedError;
      }

      const created = response?.result;
      if (created) {
        setQuestionBanks((prev) => [created, ...prev]);
      }
      toast.success(MSG39);
      return created;
    } catch (err) {
      const backendMessage = err.response?.data?.message ?? "";
      const isDuplicate = /ton tai|tồn tại|duplicate|exist|trung|trùng/i.test(
        backendMessage,
      );
      const message = isDuplicate
        ? MSG40
        : backendMessage || "Không thể tạo ngân hàng câu hỏi.";
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateBank = useCallback(async (bankId, data) => {
    const safeBankId = Number(bankId);
    setActionLoading(true);
    setError(null);
    try {
      const response = await questionBankApi.updateQuestionBank(
        safeBankId,
        data,
      );
      const updated = response?.result;
      setQuestionBanks((prev) =>
        prev.map((bank) => {
          if (bank.id !== safeBankId) return bank;
          // Some backends may omit result on update; keep UI consistent with submitted data.
          return updated ?? { ...bank, ...data };
        }),
      );
      toast.success(MSG81);
      return updated ?? data;
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể cập nhật ngân hàng câu hỏi.";
      setError(message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  const deleteBank = useCallback(async (bankId) => {
    const safeBankId = Number(bankId);
    setActionLoading(true);
    setError(null);
    try {
      await questionBankApi.deleteQuestionBank(safeBankId);
      setQuestionBanks((prev) => prev.filter((bank) => bank.id !== safeBankId));
      toast.success(MSG83);
    } catch (err) {
      const message = MSG84;
      setError(message);
      toast.error(message, { id: `delete-question-bank-error-${Date.now()}` });
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return {
    questionBanks,
    pagination,
    loading,
    actionLoading,
    error,
    setQuestionBanks,
    fetchBanks,
    createBank,
    updateBank,
    deleteBank,
    clearError: () => setError(null),
    setLoading,
  };
};

export default useQuestionBanks;
