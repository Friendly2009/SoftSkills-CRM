import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
/** Compatibility shell for feature-specific dialog bodies; native dialog manages focus and inert background. */
export function ModalFrame({
  children,
  onClose,
  title = "Диалог",
}: {
  children: ReactNode;
  onClose: () => void;
  title?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = ref.current;
    element?.showModal();
    const heading = element?.querySelector("h2, h3");
    if (heading?.textContent)
      element?.setAttribute("aria-label", heading.textContent);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="ui-modal-frame"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
