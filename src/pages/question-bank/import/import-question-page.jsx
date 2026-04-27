import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { questionBankApi } from "@/apis/question-bank.api";
import ImportAssignmentFilePage from "@/pages/assignment/import/import-assignment-file-page";

const EXCEL_IMPORT_SESSION_TYPE = "EXCEL_IMPORT";
const DRAFT_PAGE_SIZE = 200;

const toPositiveId = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const extractDraftPreviewItems = (result) => {
  const aiExcelItems = result?.aiExcelData?.questions;
  if (Array.isArray(aiExcelItems)) {
    return aiExcelItems;
  }

  if (Array.isArray(result?.questions)) {
    return result.questions;
  }

  return [];
};

const ImportQuestionPage = () => {
  const { bankId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialPreviewItems, setInitialPreviewItems] = useState([]);
  const [isInitializingDraft, setIsInitializingDraft] = useState(false);
  const [hasDraftBootstrapped, setHasDraftBootstrapped] = useState(false);

  const initializedSessionRef = useRef(null);
  const bootstrapKeyRef = useRef(null);

  const safeBankId = toPositiveId(bankId);
  const currentBankId = toPositiveId(searchParams.get("bankId"));
  const currentSessionId = toPositiveId(searchParams.get("sessionId"));
  const searchKey = useMemo(() => searchParams.toString(), [searchParams]);

  const isReady =
    Number.isFinite(safeBankId) &&
    safeBankId > 0 &&
    currentBankId === safeBankId;

  useEffect(() => {
    initializedSessionRef.current = null;
    bootstrapKeyRef.current = null;
    setInitialPreviewItems([]);
    setHasDraftBootstrapped(false);
  }, [safeBankId]);

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
    nextParams.delete("sessionId");
    setSearchParams(nextParams, { replace: true });
  }, [safeBankId, currentBankId, searchKey, searchParams, setSearchParams]);

  useEffect(() => {
    if (!isReady || !safeBankId) {
      return;
    }

    const bootstrapKey = `${safeBankId}:${currentSessionId || "new"}`;
    if (bootstrapKeyRef.current === bootstrapKey) {
      return;
    }

    if (
      currentSessionId &&
      initializedSessionRef.current === currentSessionId
    ) {
      setHasDraftBootstrapped(true);
      return;
    }

    bootstrapKeyRef.current = bootstrapKey;

    let isMounted = true;

    const bootstrapDraftSession = async () => {
      setIsInitializingDraft(true);

      try {
        let sessionId = currentSessionId;

        // If URL contains an expired/invalid session, recover by creating a fresh EXCEL_IMPORT session.
        if (sessionId) {
          try {
            const existingDraftResponse = await questionBankApi.getDraftSession(
              sessionId,
              safeBankId,
              undefined,
              {
                page: 1,
                size: DRAFT_PAGE_SIZE,
              },
            );

            if (!isMounted) {
              return;
            }

            const previewItems = extractDraftPreviewItems(
              existingDraftResponse?.result,
            );
            setInitialPreviewItems(previewItems);
            initializedSessionRef.current = sessionId;
            return;
          } catch {
            sessionId = null;
          }
        }

        if (!sessionId) {
          const initResponse = await questionBankApi.initSession(
            safeBankId,
            undefined,
            EXCEL_IMPORT_SESSION_TYPE,
          );

          sessionId = toPositiveId(initResponse?.result?.sessionId);

          if (sessionId && isMounted) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("bankId", String(safeBankId));
            nextParams.set("sessionId", String(sessionId));
            setSearchParams(nextParams, { replace: true });
          }
        }

        if (!sessionId) {
          initializedSessionRef.current = currentSessionId || -1;
          return;
        }

        const draftResponse = await questionBankApi.getDraftSession(
          sessionId,
          safeBankId,
          undefined,
          {
            page: 1,
            size: DRAFT_PAGE_SIZE,
          },
        );

        if (!isMounted) {
          return;
        }

        const previewItems = extractDraftPreviewItems(draftResponse?.result);
        setInitialPreviewItems(previewItems);
        initializedSessionRef.current = sessionId;
      } catch (error) {
        console.error("Failed to bootstrap import draft session:", error);
        if (isMounted) {
          setInitialPreviewItems([]);
          initializedSessionRef.current = currentSessionId || -1;
        }
      } finally {
        if (isMounted) {
          setIsInitializingDraft(false);
          setHasDraftBootstrapped(true);
        }
      }
    };

    bootstrapDraftSession();

    return () => {
      isMounted = false;
    };
  }, [isReady, safeBankId, currentSessionId, searchParams, setSearchParams]);

  if (!isReady) {
    return null;
  }

  return (
    <ImportAssignmentFilePage
      initialPreviewItems={initialPreviewItems}
      isInitializingDraft={isInitializingDraft}
      hasDraftBootstrapped={hasDraftBootstrapped}
    />
  );
};

export default ImportQuestionPage;
