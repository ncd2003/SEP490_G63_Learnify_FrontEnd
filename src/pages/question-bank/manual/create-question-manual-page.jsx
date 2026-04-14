import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ManualAssignmentCreatorPage from "@/pages/assignment/create/manual-assignment-creator-page";

const CreateQuestionManualPage = () => {
  const { bankId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const safeBankId = Number(bankId);
  const currentBankId = Number(searchParams.get("bankId"));
  const hasFormat = Boolean(searchParams.get("format"));

  const isReady =
    Number.isFinite(safeBankId) &&
    safeBankId > 0 &&
    currentBankId === safeBankId &&
    hasFormat;

  useEffect(() => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    let shouldUpdate = false;

    if (Number(nextParams.get("bankId")) !== safeBankId) {
      nextParams.set("bankId", String(safeBankId));
      shouldUpdate = true;
    }

    if (!nextParams.get("format")) {
      nextParams.set("format", "mixed");
      shouldUpdate = true;
    }

    if (!shouldUpdate) {
      return;
    }

    setSearchParams(nextParams, { replace: true });
  }, [bankId, searchParams, setSearchParams]);

  if (!isReady) {
    return null;
  }

  return <ManualAssignmentCreatorPage />;
};

export default CreateQuestionManualPage;
