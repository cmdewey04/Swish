import React, { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { Button } from "react-bootstrap";

export const ToggleTheme = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-md mx-5 bg-gradient-to-l from-purple-800 to-purple-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {theme === "light" ? "Dark" : "Light"} Mode
      </button>
    </div>
  );
};

export default ToggleTheme;
