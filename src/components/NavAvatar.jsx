/**
 * NavAvatar — shows the user's uploaded profile photo, or their initials as fallback.
 * Used in TopNavbar and Sidebar so both update consistently.
 *
 * Listens to a custom "avatar-updated" event so ALL instances refresh instantly
 * when the user uploads a new photo on the profile page.
 */
import React, { useEffect, useState } from "react";
import { API_BASE } from "../services/api";

/** Call this after a successful photo upload/delete to refresh all NavAvatars instantly */
export function notifyAvatarUpdated() {
  window.dispatchEvent(new Event("avatar-updated"));
}

export default function NavAvatar({ userId, initials = "U", size = 7 }) {
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());

  useEffect(() => {
    function refresh() { setPhotoKey(Date.now()); setPhotoLoaded(false); }
    window.addEventListener("avatar-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("avatar-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (!userId) {
    return <InitialsBubble initials={initials} size={size} />;
  }

  const src = `${API_BASE}/profile/photo/${userId}?t=${photoKey}`;

  return (
    <span
      className={`inline-flex items-center justify-center w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 text-[0.72rem] font-extrabold text-white`}
      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
    >
      {/* Always render the img so onLoad/onError can fire.
          When photo loads successfully → hide initials, show image.
          When photo fails (404 = no photo) → show initials, hide image. */}
      <img
        src={src}
        alt={initials}
        className="w-full h-full object-cover"
        onLoad={() => setPhotoLoaded(true)}
        onError={() => setPhotoLoaded(false)}
        style={{ display: photoLoaded ? "block" : "none" }}
      />
      {!photoLoaded && <span>{initials}</span>}
    </span>
  );
}

function InitialsBubble({ initials, size }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-${size} h-${size} rounded-full flex-shrink-0 text-[0.72rem] font-extrabold text-white`}
      style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
    >
      {initials}
    </span>
  );
}
