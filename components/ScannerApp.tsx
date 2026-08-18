"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ActionButton } from "@/components/ActionButton";
import { AnalyzingStatus } from "@/components/AnalyzingStatus";
import { DeckPreview } from "@/components/DeckPreview";
import { Header } from "@/components/Header";
import { IdentificationResult } from "@/components/IdentificationResult";
import { ScanFrame } from "@/components/ScanFrame";
import { isImageFile } from "@/lib/image";
import { MOCK_IDENTIFICATION } from "@/lib/mock-identification";
import type { AppStep } from "@/lib/types";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.avif";
const ANALYZE_MS = 1000;

export function ScannerApp() {
  const [step, setStep] = useState<AppStep>("home");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [addedToCollection, setAddedToCollection] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<string | null>(null);

  function replaceImageUrl(nextUrl: string | null) {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }
    imageUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
  }

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step !== "analyzing") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setStep("result");
    }, ANALYZE_MS);

    return () => window.clearTimeout(timeout);
  }, [step]);

  function resetToHome() {
    replaceImageUrl(null);
    setStep("home");
    setAddedToCollection(false);
    setFileError(null);

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
      setFileError("Please choose a photo of a deck (JPEG, PNG, WebP, or similar).");
      return;
    }

    replaceImageUrl(URL.createObjectURL(file));
    setFileError(null);
    setAddedToCollection(false);
    setStep("preview");
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

        {step === "preview" && imageUrl ? (
          <>
            <DeckPreview imageUrl={imageUrl} />
            <div className="mt-8 flex flex-col gap-3">
              <ActionButton onClick={() => setStep("analyzing")}>
                Identify Deck
              </ActionButton>
              <ActionButton variant="ghost" onClick={resetToHome}>
                Choose Another
              </ActionButton>
            </div>
          </>
        ) : null}

        {step === "analyzing" && imageUrl ? (
          <>
            <DeckPreview imageUrl={imageUrl} analyzing />
            <AnalyzingStatus />
          </>
        ) : null}

        {step === "result" && imageUrl ? (
          <>
            <DeckPreview imageUrl={imageUrl} />
            <IdentificationResult result={MOCK_IDENTIFICATION} />
            <div className="mt-10 flex flex-col gap-3">
              <ActionButton
                onClick={() => setAddedToCollection(true)}
                disabled={addedToCollection}
                aria-live="polite"
              >
                {addedToCollection ? "Added to Collection" : "Add to Collection"}
              </ActionButton>
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
