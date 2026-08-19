"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ActionButton } from "@/components/ActionButton";
import { AnalyzingStatus } from "@/components/AnalyzingStatus";
import { DeckPreview } from "@/components/DeckPreview";
import { Header } from "@/components/Header";
import { IdentificationResult } from "@/components/IdentificationResult";
import { PhotoCropper } from "@/components/PhotoCropper";
import { ScanFrame } from "@/components/ScanFrame";
import { getClientUploadError, isImageFile } from "@/lib/image";
import { ERROR_MESSAGES, errorResult } from "@/lib/identification/errors";
import { isResearchEligible } from "@/lib/research/eligibility";
import {
  beginResearch,
  completeResearch,
  createScanView,
  failResearch,
  type ScanResearchView,
} from "@/lib/research/client-state";
import type {
  AppStep,
  DisplayResult,
  IdentifyErrorCode,
  IdentifyResponse,
  ResearchResponse,
} from "@/lib/types";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.avif";

const IDENTIFY_CLIENT_TIMEOUT_MS = 50_000;
const RESEARCH_CLIENT_TIMEOUT_MS = 80_000;

export function ScannerApp() {
  const [step, setStep] = useState<AppStep>("home");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [scanView, setScanView] = useState<ScanResearchView | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const originalUrlRef = useRef<string | null>(null);
  const preparedUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function revokeUrl(url: string | null) {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  function replaceOriginal(file: File | null) {
    revokeUrl(originalUrlRef.current);
    revokeUrl(preparedUrlRef.current);
    preparedUrlRef.current = null;

    const nextUrl = file ? URL.createObjectURL(file) : null;
    originalUrlRef.current = nextUrl;
    setOriginalUrl(nextUrl);
    setPreparedFile(null);
    setPreparedUrl(null);
  }

  function replacePrepared(file: File) {
    revokeUrl(preparedUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    preparedUrlRef.current = nextUrl;
    setPreparedFile(file);
    setPreparedUrl(nextUrl);
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      revokeUrl(originalUrlRef.current);
      revokeUrl(preparedUrlRef.current);
    };
  }, []);

  function resetToHome() {
    abortRef.current?.abort();
    abortRef.current = null;
    replaceOriginal(null);
    setStep("home");
    setFileError(null);
    setResult(null);
    setScanView(null);

    if (scanInputRef.current) {
      scanInputRef.current.value = "";
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isImageFile(file)) {
      setFileError("Please choose a photo of a deck (JPEG, PNG, or WebP).");
      return;
    }

    const uploadError = getClientUploadError(file);
    if (uploadError) {
      setFileError(uploadError);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    replaceOriginal(file);
    setFileError(null);
    setResult(null);
    setScanView(null);
    setStep("preview");
  }

  function handleCropConfirm(file: File) {
    const uploadError = getClientUploadError(file);
    if (uploadError) {
      setFileError(uploadError);
      setStep("crop");
      return;
    }

    replacePrepared(file);
    setFileError(null);
    setStep("prepared");
  }

  async function handleIdentify() {
    if (!preparedFile) {
      setResult(errorResult("missing_image"));
      setStep("result");
      return;
    }

    const uploadError = getClientUploadError(preparedFile);
    if (uploadError) {
      setFileError(uploadError);
      setStep("prepared");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, IDENTIFY_CLIENT_TIMEOUT_MS);

    setResult(null);
    setScanView(null);
    setStep("analyzing");

    try {
      const formData = new FormData();
      formData.append("image", preparedFile);

      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const payload = (await parseIdentifyResponse(response)) ?? {
        ok: false as const,
        result: errorResult("unknown"),
      };

      if (abortRef.current !== controller) {
        return;
      }

      setResult(payload.result);
      if (payload.ok) {
        setScanView(createScanView(payload.result));
      } else {
        setScanView(null);
      }
      setStep("result");
      window.clearTimeout(timeout);

      if (payload.ok && isResearchEligible(payload.result)) {
        await runResearch(payload.result, controller);
      }
      return;
    } catch (error) {
      if (abortRef.current !== controller) {
        return;
      }

      if (timedOut || controller.signal.aborted) {
        setResult(errorResult("timeout"));
        setStep("result");
        return;
      }

      console.error("Identification request failed", {
        name: error instanceof Error ? error.name : "unknown",
      });
      setResult(errorResult("unknown"));
      setStep("result");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function runResearch(
    vision: Exclude<DisplayResult, { status: "error" }>,
    previousController: AbortController,
  ) {
    if (abortRef.current !== previousController) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, RESEARCH_CLIENT_TIMEOUT_MS);

    setScanView((current) => (current ? beginResearch(current) : current));

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vision }),
        signal: controller.signal,
      });

      const payload = await parseResearchResponse(response);

      if (abortRef.current !== controller) {
        return;
      }

      if (!payload || payload.ok === false) {
        setScanView((current) => (current ? failResearch(current) : current));
        return;
      }

      if (payload.research.skipped_reason) {
        setScanView((current) =>
          current
            ? { ...current, researchState: "not_started", researchResult: null }
            : current,
        );
        return;
      }

      if (payload.research.status === "failed") {
        setScanView((current) => (current ? failResearch(current) : current));
        return;
      }

      setScanView((current) =>
        current ? completeResearch(current, payload.research) : current,
      );
    } catch (error) {
      if (abortRef.current !== controller) {
        return;
      }
      if (timedOut || controller.signal.aborted) {
        setScanView((current) => (current ? failResearch(current) : current));
        return;
      }
      console.error("Research request failed", {
        name: error instanceof Error ? error.name : "unknown",
      });
      setScanView((current) => (current ? failResearch(current) : current));
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Header />

      <input
        ref={scanInputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <main className="flex flex-1 flex-col">
        {step === "home" ? (
          <>
            <ScanFrame />
            <div className="mt-10 flex flex-col gap-3">
              <ActionButton onClick={() => scanInputRef.current?.click()}>
                Scan Deck
              </ActionButton>
              <ActionButton
                variant="secondary"
                onClick={() => uploadInputRef.current?.click()}
              >
                Upload Photo
              </ActionButton>
            </div>
            {fileError ? (
              <p className="mt-4 text-center text-[13px] text-neutral-600" role="alert">
                {fileError}
              </p>
            ) : null}
          </>
        ) : null}

        {step === "preview" && originalUrl ? (
          <>
            <DeckPreview imageUrl={originalUrl} />
            <p className="mt-4 text-center text-[14px] leading-relaxed text-neutral-700">
              Prepare the photo so the tuck box fills the frame.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <ActionButton onClick={() => setStep("crop")}>
                Prepare Photo
              </ActionButton>
              <ActionButton variant="ghost" onClick={resetToHome}>
                Choose Another
              </ActionButton>
            </div>
          </>
        ) : null}

        {step === "crop" && originalUrl ? (
          <PhotoCropper
            imageUrl={originalUrl}
            onConfirm={handleCropConfirm}
            onCancel={resetToHome}
          />
        ) : null}

        {step === "prepared" && preparedUrl ? (
          <>
            <DeckPreview imageUrl={preparedUrl} caption="Prepared photo" />
            <div className="mt-8 flex flex-col gap-3">
              <ActionButton onClick={() => void handleIdentify()}>
                Identify Deck
              </ActionButton>
              <ActionButton variant="secondary" onClick={() => setStep("crop")}>
                Prepare Photo
              </ActionButton>
              <ActionButton variant="ghost" onClick={resetToHome}>
                Choose Another
              </ActionButton>
            </div>
            {fileError ? (
              <p className="mt-4 text-center text-[13px] text-neutral-600" role="alert">
                {fileError}
              </p>
            ) : null}
          </>
        ) : null}

        {step === "analyzing" && preparedUrl ? (
          <>
            <DeckPreview imageUrl={preparedUrl} analyzing caption="Prepared photo" />
            <AnalyzingStatus />
          </>
        ) : null}

        {step === "result" && preparedUrl && result ? (
          <>
            <DeckPreview imageUrl={preparedUrl} caption="Prepared photo" />
            <IdentificationResult
              visionResult={scanView?.visionResult ?? result}
              researchState={scanView?.researchState}
              researchResult={scanView?.researchResult}
            />
            <div className="mt-10 flex flex-col gap-3">
              <ActionButton variant="secondary" onClick={resetToHome}>
                Scan Another Deck
              </ActionButton>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

async function parseIdentifyResponse(
  response: Response,
): Promise<IdentifyResponse | null> {
  try {
    const payload: unknown = await response.json();
    if (!isRecord(payload) || typeof payload.ok !== "boolean" || !isRecord(payload.result)) {
      return null;
    }

    const result = payload.result;
    if (payload.ok === true && typeof result.status === "string") {
      return payload as IdentifyResponse;
    }

    if (
      payload.ok === false &&
      result.status === "error" &&
      typeof result.error_code === "string" &&
      typeof result.message === "string"
    ) {
      return {
        ok: false,
        result: {
          status: "error",
          error_code: isIdentifyErrorCode(result.error_code)
            ? result.error_code
            : "unknown",
          message: result.message,
        },
      };
    }

    return null;
  } catch {
    return null;
  }
}

function isIdentifyErrorCode(value: string): value is IdentifyErrorCode {
  return Object.hasOwn(ERROR_MESSAGES, value);
}

async function parseResearchResponse(
  response: Response,
): Promise<ResearchResponse | null> {
  try {
    const payload: unknown = await response.json();
    if (!isRecord(payload) || typeof payload.ok !== "boolean") {
      return null;
    }

    if (payload.ok === false) {
      if (typeof payload.error_code !== "string") {
        return null;
      }
      return {
        ok: false,
        error_code:
          payload.error_code === "missing_vision" ||
          payload.error_code === "research_unconfigured" ||
          payload.error_code === "research_timeout" ||
          payload.error_code === "research_unavailable"
            ? payload.error_code
            : "research_unavailable",
        research_status: "failed",
      };
    }

    if (!isRecord(payload.research) || typeof payload.research.status !== "string") {
      return null;
    }

    return payload as ResearchResponse;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
