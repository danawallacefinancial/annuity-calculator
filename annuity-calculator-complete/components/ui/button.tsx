
import * as React from "react";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", ...props }, ref
) {
  return <button ref={ref} className={`px-3 py-2 rounded-md border ${className}`} {...props} />;
});
