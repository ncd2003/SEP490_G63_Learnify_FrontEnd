import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ImportAssignmentFilePage from "@/pages/assignment/import/import-assignment-file-page";

const ImportQuestionPage = () => {
  const { bankId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const safeBankId = Number(bankId);
  const currentBankId = Number(searchParams.get("bankId"));

  const isReady =
    Number.isFinite(safeBankId) &&
    safeBankId > 0 &&
    currentBankId === safeBankId;

  useEffect(() => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      return;
    }

    const currentBankId = Number(searchParams.get("bankId"));
    if (currentBankId === safeBankId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("bankId", String(safeBankId));
    setSearchParams(nextParams, { replace: true });
  }, [bankId, searchParams, setSearchParams]);

  if (!isReady) {
    return null;
  }

  return <ImportAssignmentFilePage />;
};

export default ImportQuestionPage;
