import { useEffect, useRef, useState } from 'react';
import type { AppUser } from '../lib/firebase';
import { signOut } from '../lib/firebase';

interface Props {
  user: AppUser;
  listingCount: number;
  onOpenListings: () => void;
  onOpenConnections: () => void;
}

export function UserMenu({ user, listingCount, onOpenListings, onOpenConnections }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const initial = (user.name ?? user.email ?? 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="avatar-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar-fallback">{initial}</span>
        )}
      </button>

      {open && (
        <div className="user-popover" role="menu">
          <div className="user-popover-head">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar-fallback large">{initial}</span>
            )}
            <div className="user-popover-id">
              {user.name && <div className="user-name">{user.name}</div>}
              {user.email && <div className="user-email">{user.email}</div>}
            </div>
          </div>

          <button
            className="popover-item"
            onClick={() => {
              setOpen(false);
              onOpenListings();
            }}
          >
            <span>My listings</span>
            <span className="count">{listingCount}</span>
          </button>

          <button
            className="popover-item"
            onClick={() => {
              setOpen(false);
              onOpenConnections();
            }}
          >
            <span>Connections</span>
            <span className="count">⚡</span>
          </button>

          <button
            className="popover-item danger"
            onClick={() => {
              setOpen(false);
              signOut().catch(() => undefined);
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
