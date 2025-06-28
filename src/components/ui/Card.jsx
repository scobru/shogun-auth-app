import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  className = '',
  bordered = true,
  compact = false,
  bgColor = 'bg-base-100',
  ...props 
}) => {
  const cardClasses = [
    'card',
    bordered ? 'card-bordered' : '',
    compact ? 'card-compact' : '',
    bgColor,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle) && (
        <div className="card-body">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="text-base-content/70">{subtitle}</p>}
          {children}
        </div>
      )}
      {!title && !subtitle && children}
    </div>
  );
};

// Card subcomponents
Card.Body = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h2 className={`card-title ${className}`} {...props}>
    {children}
  </h2>
);

Card.Actions = ({ children, className = '', ...props }) => (
  <div className={`card-actions ${className}`} {...props}>
    {children}
  </div>
);

Card.Image = ({ src, alt = '', className = '', ...props }) => (
  <figure className={className}>
    <img src={src} alt={alt} {...props} />
  </figure>
);

export default Card; 