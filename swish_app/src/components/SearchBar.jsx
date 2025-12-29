// src/components/SearchBar.jsx
import React, { useState, useEffect } from "react";
import Player from "./Player";
import PLAYERS from "../data/players.json";

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      const filtered = PLAYERS.filter((p) => {
        const name = (p.full_name || "").toLowerCase();
        const team = (p.team_name || "").toLowerCase();
        const market = (p.team_market || "").toLowerCase();

        return (
          name.includes(q) ||
          team.includes(q) ||
          `${market} ${team}`.trim().includes(q)
        );
      }).slice(0, 25);

      setResults(filtered);
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <form className="relative" onSubmit={(e) => e.preventDefault()}>
      <div className="relative">
        <input
          type="search"
          placeholder="Look for a player"
          className="w-full p-4 rounded-full bg-slate-800"
          onChange={handleSearch}
          value={searchQuery}
        />
      </div>

      {results.length > 0 && (
        <ul className="absolute left-0 right-0 mt-2 bg-neutral-900 rounded-lg border overflow-y-auto max-h-[calc(100vh-250px)]">
          {results.map((p) => (
            <li key={p.id} className="p-2">
              <Player player={p} />
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default SearchBar;
