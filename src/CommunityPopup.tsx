import { useEffect, useRef } from "react";
import { FaTelegram } from "react-icons/fa";

export const COMMUNITY_URL = "https://t.me/+MrLn2ia-mfI5MTI1";
const DISMISSED = "float-community-popup-dismissed";

// Shown on load, once per browser session, so a reload doesn't bring it straight back.
export default function CommunityPopup() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try { if (sessionStorage.getItem(DISMISSED)) return; } catch { /* storage blocked: show anyway */ }
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const close = () => dialog.current?.close();
  const remember = () => { try { sessionStorage.setItem(DISMISSED, "1"); } catch { /* ignore */ } };

  return <dialog ref={dialog} className="waitlist-dialog community-popup" aria-labelledby="community-title" onClose={remember}>
    <div className="dialog-content">
      <button className="close-button" onClick={close} aria-label="Close">×</button>
      <h2 id="community-title">Join the Float community.</h2>
      <p className="dialog-sub">Get early updates, talk to the team and meet other users and providers on Telegram.</p>
      <a className="btn btn-telegram btn-lg btn-block" href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" onClick={close}><FaTelegram aria-hidden="true" /> Join on Telegram</a>
      <button className="text-link cta-link dialog-back" onClick={close}>Maybe later</button>
    </div>
  </dialog>;
}
