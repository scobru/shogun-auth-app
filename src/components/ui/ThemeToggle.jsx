import React, { useState, useEffect } from 'react';

export const ThemeToggle = () => {
  // List of available themes
  const themes = ["light", "dark"];
  
  // Initialize theme state from localStorage
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && themes.includes(savedTheme) ? savedTheme : "light";
  });

  // Update theme in localStorage and apply to document
  const setTheme = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(theme);
  };

  // Initialize theme on component mount
  useEffect(() => {
    setTheme(currentTheme);
  }, []);

  // Handle theme change
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn-custom m-1">
        {currentTheme === 'dark' ? '🌙' : '☀️'} Theme
        <svg width="12px" height="12px" className="h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52">
        {themes.map((theme) => (
          <li key={theme} className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text capitalize">
                {theme === 'dark' ? '🌙' : '☀️'} {theme}
              </span>
              <input
                type="radio"
                name="theme-dropdown"
                className="radio theme-controller"
                value={theme}
                checked={currentTheme === theme}
                onChange={handleThemeChange}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ThemeToggle; 