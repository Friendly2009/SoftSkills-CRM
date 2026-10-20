import type { ButtonHTMLAttributes } from "react";
export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      type="button"
      {...props}
      className={`ui-button ui-button--${variant} ${className}`}
    />
  );
}
