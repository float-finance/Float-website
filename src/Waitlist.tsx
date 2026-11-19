import { useCallback, useEffect, useRef, useState } from "react";
import { FaTelegram } from "react-icons/fa";
import type { Payload } from "./App";
import { COMMUNITY_URL } from "./CommunityPopup";

// The answers are already collected; this saves them and shows the result.
export default function Waitlist({ payload, onClose }: { payload: Payload; onClose: (saved: boolean) => void }) {
  const [status, setStatus] = useState<"saving" | "success" | "error">("saving");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const abort = useRef<AbortController | null>(null);

  const save = useCallback(async () => {
    setStatus("saving"); setError("");
    const request = new AbortController(); abort.current = request;
    const timeout = window.setTimeout(() => request.abort(), 15000);
    try {
      const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: request.signal });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const detail = import.meta.env.DEV && result?.code ? ` (${result.code})` : "";
        throw new Error(result?.code === "INVALID_EMAIL" ? "That email doesn’t look right. Check it and try again." : `Please try again in a moment.${detail}`);
      }
      setStatus("success");
    } catch (cause) {
      if (abort.current !== request) return; // superseded by a newer attempt
      setStatus("error");
      setError(cause instanceof Error && cause.name === "AbortError" ? "That took longer than expected. Please try again." : cause instanceof TypeError ? "Check your connection and try again." : cause instanceof Error ? cause.message : "Please try again.");
    } finally { clearTimeout(timeout); }
  }, [payload]);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    void save();
    return () => { const request = abort.current; abort.current = null; request?.abort(); };
  }, [save]);

  return <dialog ref={dialog} className="waitlist-dialog" aria-labelledby="saver-title" onClose={() => onClose(status === "success")}>
    <div className="dialog-content">
      <button className="close-button" onClick={() => dialog.current?.close()} aria-label="Close">×</button>
      {status === "success" ? <div role="status">
        <div className="success-mark" aria-hidden="true">✓</div>
        <h2 id="saver-title">You’re on the list.</h2>
        <p className="dialog-sub">We’ll be in touch at {payload.email} when it’s your turn to get started.</p>
        <a className="btn btn-telegram btn-lg btn-block" href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer"><FaTelegram aria-hidden="true" /> Join the Float community</a>
        <button className="text-link cta-link dialog-back" onClick={() => dialog.current?.close()}>Back to Float</button>
      </div> : status === "error" ? <div role="alert">
        <h2 id="saver-title">We couldn’t save your place.</h2>
        <p className="dialog-sub">{error}</p>
        <button className="text-link cta-link" onClick={() => void save()}>Try again</button>
      </div> : <div role="status">
        <h2 id="saver-title">Saving your place…</h2>
        <p className="dialog-sub">{payload.email}</p>
      </div>}
    </div>
  </dialog>;
}
