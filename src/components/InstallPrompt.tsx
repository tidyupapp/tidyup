import { useEffect, useState } from 'react';
import { detectPlatform, isStandalone, isInWebView, isSafariOnIOS } from '../lib/platform';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'tidyup.installPromptDismissedAt';
const SHOW_AFTER_KEY = 'tidyup.firstSuccessAt';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // re-ask after 7 days

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    function onBefore(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', onBefore);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissed && Date.now() - dismissed < DISMISS_TTL) return;

    const firstSuccess = localStorage.getItem(SHOW_AFTER_KEY);
    if (!firstSuccess) return;

    const platform = detectPlatform();
    if (platform === 'ios' || platform === 'ipad') {
      if (isInWebView()) return; // Can't install from inside FB/IG browser
      setVisible(true);
    } else if (deferred) {
      setVisible(true);
    }
  }, [deferred]);

  if (isStandalone() || !visible) return null;

  const platform = detectPlatform();
  const isIos = platform === 'ios' || platform === 'ipad';

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setIosGuideOpen(false);
  }

  async function handleInstall() {
    if (isIos) {
      setIosGuideOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
    } else {
      handleDismiss();
    }
  }

  return (
    <>
      <div className="install-bar">
        <div className="install-bar-text">
          <strong>Add Tidyup to your home screen</strong>
          <span>Faster, full-screen, works offline.</span>
        </div>
        <div className="install-actions">
          <button className="text-button" onClick={handleDismiss}>Not now</button>
          <button className="primary-button small" onClick={handleInstall}>
            {isIos ? 'How to install' : 'Install'}
          </button>
        </div>
      </div>

      {iosGuideOpen && <IosInstallGuide onClose={() => setIosGuideOpen(false)} onDismiss={handleDismiss} />}
    </>
  );
}

function IosInstallGuide({ onClose, onDismiss }: { onClose: () => void; onDismiss: () => void }) {
  const safari = isSafariOnIOS();

  return (
    <div className="ios-guide-backdrop" onClick={onClose}>
      <div className="ios-guide" onClick={(e) => e.stopPropagation()}>
        <div className="ios-guide-head">
          <h2>Add Tidyup to your home screen</h2>
          <button className="text-button" onClick={onClose}>Close</button>
        </div>

        {!safari && (
          <div className="ios-guide-warning">
            On iPhone, "Add to Home Screen" only works in <strong>Safari</strong>. Tap the share button to copy this page's link, then open it in Safari.
          </div>
        )}

        <ol className="ios-steps">
          <li>
            <div className="ios-step-icon" aria-hidden>
              <ShareIcon />
            </div>
            <div className="ios-step-body">
              <div className="ios-step-title">Tap the Share button</div>
              <div className="ios-step-hint">It's at the bottom of Safari (the square with an up-arrow).</div>
            </div>
          </li>
          <li>
            <div className="ios-step-icon" aria-hidden>
              <PlusIcon />
            </div>
            <div className="ios-step-body">
              <div className="ios-step-title">Pick "Add to Home Screen"</div>
              <div className="ios-step-hint">Scroll the share sheet if you don't see it — sometimes it's a few rows down.</div>
            </div>
          </li>
          <li>
            <div className="ios-step-icon" aria-hidden>
              <CheckIcon />
            </div>
            <div className="ios-step-body">
              <div className="ios-step-title">Tap "Add" in the top right</div>
              <div className="ios-step-hint">Tidyup will appear on your home screen like any other app. Tap to launch.</div>
            </div>
          </li>
        </ol>

        <button className="primary-button" onClick={onDismiss}>
          Got it, don't show again
        </button>
      </div>
    </div>
  );
}

export function markFirstSuccess() {
  if (!localStorage.getItem(SHOW_AFTER_KEY)) {
    localStorage.setItem(SHOW_AFTER_KEY, String(Date.now()));
  }
}

function ShareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v8a2 2 0 002 2h10a2 2 0 002-2v-8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}
