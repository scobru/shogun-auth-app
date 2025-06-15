/**
 * Creates a safe HTML markup object for dangerouslySetInnerHTML
 * @param {string} html - The HTML content to render
 * @returns {Object} Object with __html property for dangerouslySetInnerHTML
 */
export const createMarkup = (html) => {
  if (!html) return { __html: '' };
  return { __html: html };
};

/**
 * Sanitizes HTML content (basic implementation)
 * In a production app, you should use a proper sanitizer like DOMPurify
 * @param {string} html - The HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // This is a very basic sanitization - in production use DOMPurify or similar
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove potentially dangerous elements/attributes
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  const elements = tempDiv.querySelectorAll('*');
  elements.forEach(el => {
    // Remove on* attributes (event handlers)
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
    
    // Remove javascript: URLs
    if (el.href && el.href.toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('href');
    }
  });
  
  return tempDiv.innerHTML;
};

/**
 * Extracts plain text from HTML content
 * @param {string} html - The HTML content
 * @returns {string} Plain text content
 */
export const stripHtml = (html) => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

/**
 * Truncates text with ellipsis if it exceeds the specified length
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateWithEllipsis = (text = '', length = 100) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}; 