import React from "react";

const Card = ({
  children,
  title,
  subtitle,
  className = "",
  bordered = true,
  compact = false,
  bgColor = "bg-base-100",
  responsive = true,
  ...props
}) => {
  const cardClasses = [
    "card",
    bordered ? "card-bordered" : "",
    compact ? "card-compact" : "",
    bgColor,
    responsive ? "p-4 sm:p-6" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle) && (
        <div className="card-body p-4 sm:p-6">
          {title && <h2 className="card-title text-lg sm:text-xl">{title}</h2>}
          {subtitle && (
            <p className="text-base-content/70 text-sm sm:text-base">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      )}
      {!title && !subtitle && children}
    </div>
  );
};

// Card subcomponents
Card.Body = ({ children, className = "", responsive = true, ...props }) => (
  <div
    className={`card-body ${responsive ? "p-4 sm:p-6" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Title = ({ children, className = "", responsive = true, ...props }) => (
  <h2
    className={`card-title ${responsive ? "text-lg sm:text-xl" : ""} ${className}`}
    {...props}
  >
    {children}
  </h2>
);

Card.Actions = ({ children, className = "", responsive = true, ...props }) => (
  <div
    className={`card-actions ${responsive ? "flex-col sm:flex-row gap-2 sm:gap-4" : ""} ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Image = ({
  src,
  alt = "",
  className = "",
  responsive = true,
  ...props
}) => (
  <figure className={`${responsive ? "w-full" : ""} ${className}`}>
    <img
      src={src}
      alt={alt}
      className={`${responsive ? "w-full h-auto" : ""}`}
      {...props}
    />
  </figure>
);

export default Card;
