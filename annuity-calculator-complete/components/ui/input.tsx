
import * as React from "react";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...props }, ref
) {
  return <input ref={ref} className={`border rounded-md px-3 py-2 ${className}`} {...props} />;
});
