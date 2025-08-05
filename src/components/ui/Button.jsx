import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  outline = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
  responsive = true,
  ...props
}) => {
  // Map variant to daisyUI button classes
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    info: "btn-info",
    success: "btn-success",
    warning: "btn-warning",
    error: "btn-error",
    ghost: "btn-ghost",
    link: "btn-link",
  };

  // Map size to daisyUI button size classes with responsive variants
  const sizeClasses = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  // Responsive size classes for mobile
  const responsiveSizeClasses = responsive
    ? {
        xs: "btn-xs sm:btn-sm",
        sm: "btn-sm sm:btn-md",
        md: "btn-sm sm:btn-md lg:btn-lg",
        lg: "btn-md sm:btn-lg lg:btn-lg",
      }
    : sizeClasses;

  // Combine all classes
  const buttonClasses = [
    "btn",
    variantClasses[variant] || "btn-primary",
    responsive ? responsiveSizeClasses[size] || "" : sizeClasses[size] || "",
    outline ? "btn-outline" : "",
    fullWidth ? "w-full sm:w-auto" : "",
    "min-h-[44px] sm:min-h-auto", // Ensure touch-friendly size on mobile
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="loading loading-spinner loading-sm sm:loading-md"></span>
      )}
      <span className="text-sm sm:text-base">{children}</span>
    </button>
  );
};

export default Button;
