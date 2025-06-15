import React, { useEffect } from 'react';

const ThemeToggle = () => {
  // List of available themes
  const themes = ["light", "dark"];
  
  // Get theme from localStorage or default to "light"
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && themes.includes(savedTheme) ? savedTheme : "light";
  };

  // Update theme in localStorage and apply to document
  const setTheme = (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  // Initialize theme on component mount
  useEffect(() => {
    const theme = getInitialTheme();
    setTheme(theme);
  }, []);

  // Handle theme change
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn m-1">
        Theme
        <svg width="12px" height="12px" className="h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52">
        {themes.map((theme) => (
          <li key={theme}>
            <input
              type="radio"
              name="theme-dropdown"
              className="theme-controller btn btn-sm btn-block btn-ghost justify-start"
              aria-label={theme}
              value={theme}
              onChange={handleThemeChange}
              checked={localStorage.getItem('theme') === theme}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeToggle; 