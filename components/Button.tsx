import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
}

export function Button({ variant = "primary", ...props }: ButtonProps) {
  const baseStyles = "px-2 py-1 border-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 border-blue-500 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300 focus:ring-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 border-red-500 focus:ring-red-500",
    success: "bg-green-500 text-white hover:bg-green-600 border-green-500 focus:ring-green-500",
  };

  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class={`${baseStyles} ${variantStyles[variant]}`}
    />
  );
}
