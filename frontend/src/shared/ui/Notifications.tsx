import { useEffect, useState } from "react";
export function Notifications() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const show = (event: Event) =>
      setMessage(String((event as CustomEvent).detail));
    window.addEventListener("api:error", show);
    return () => window.removeEventListener("api:error", show);
  }, []);
  return message ? (
    <div className="ui-notification" role="alert">
      <span>{message}</span>
      <button
        type="button"
        aria-label="Закрыть уведомление"
        onClick={() => setMessage("")}
      >
        ×
      </button>
    </div>
  ) : null;
}
