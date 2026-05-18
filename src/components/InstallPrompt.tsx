import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'tidyup.installPromptDismissedAt';
const SHOW_AFTER_KEY = 'tidyup.firstSuccessAt';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onBefore(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', onBefore);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, []);

  useEffect(() => {
    if (!deferred) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const firstSuccess = localStorage.getItem(SHOW_AFTER_KEY);
    if (dismissed) return;
    if (!firstSuccess) return;
    setVisible(true);
  }, [deferred]);

  if (!visible || !deferred) return null;

  return (
    <div className="install-bar">
      <span>Add Tidyup to your home screen for faster access.</span>
      <div className="install-actions">
        <button
          className="text-button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, String(Date.now()));
            setVisible(false);
          }}
        >
          Not now
        </button>
        <button
          className="primary-button small"
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setVisible(false);
          }}
        >
          Install
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
