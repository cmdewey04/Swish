// src/pages/Teams.jsx
import { useEffect, useState, useMemo } from "react";
import { TeamCard } from "../components/TeamCard";
import TEAMS from "../Backend/data/teams.json";
import "../css/Teams.css";

function Teams() {
  const [teams] = useState(TEAMS);
  const [query, setQuery] = useState("");
  const [conference, setConference] = useState("ALL");
  const [sortBy, setSortBy] = useState("name"); // "name" | "record" | "winpct"

  // Split teams by conference
  const { eastern, western } = useMemo(() => {
    const east = teams.filter(
      (t) =>
        t.conference?.toUpperCase() === "EASTERN" ||
        t.conference?.toUpperCase() === "EAST",
    );
    const west = teams.filter(
      (t) =>
        t.conference?.toUpperCase() === "WESTERN" ||
        t.conference?.toUpperCase() === "WEST",
    );
    return { eastern: east, western: west };
  }, [teams]);

  // Filter and sort logic
  const filterAndSort = (teamList) => {
    let list = [...teamList];

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => {
        const fullName = t.full_name?.toLowerCase() || "";
        const city = t.city?.toLowerCase() || "";
        const abbr = t.abbreviation?.toLowerCase() || "";
        return fullName.includes(q) || city.includes(q) || abbr.includes(q);
      });
    }

    // Sort
    if (sortBy === "record") {
      list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
    } else if (sortBy === "winpct") {
      list.sort((a, b) => {
        const pctA = (a.wins || 0) / ((a.wins || 0) + (a.losses || 0)) || 0;
        const pctB = (b.wins || 0) / ((b.wins || 0) + (b.losses || 0)) || 0;
        return pctB - pctA;
      });
    } else {
      list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    }

    return list;
  };

  const filteredEast = filterAndSort(eastern);
  const filteredWest = filterAndSort(western);

  const showEast = conference === "ALL" || conference === "EASTERN";
  const showWest = conference === "ALL" || conference === "WESTERN";

  return (
    <div className="teams-page">
      {/* Hero Header */}
      <div className="teams-hero">
        <div className="teams-hero-content">
          <h1 className="teams-title">NBA Teams</h1>
          <p className="teams-subtitle">
            Explore all 30 NBA teams, their rosters, and season statistics
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="teams-controls">
        <div className="controls-wrapper">
          {/* Search */}
          <div className="search-container">
            <svg
              className="search-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search teams..."
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="filter-buttons">
            <button
              className={`filter-btn ${conference === "ALL" ? "active" : ""}`}
              onClick={() => setConference("ALL")}
            >
              All
            </button>
            <button
              className={`filter-btn ${conference === "EASTERN" ? "active" : ""}`}
              onClick={() => setConference("EASTERN")}
            >
              Eastern
            </button>
            <button
              className={`filter-btn ${conference === "WESTERN" ? "active" : ""}`}
              onClick={() => setConference("WESTERN")}
            >
              Western
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="record">Sort by Wins</option>
            <option value="winpct">Sort by Win %</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="teams-content">
        {/* Eastern Conference */}
        {showEast && (
          <section className="conference-section">
            <div className="conference-header">
              <h2 className="conference-title">Eastern Conference</h2>
              <span className="team-count">{filteredEast.length} teams</span>
            </div>

            {filteredEast.length === 0 ? (
              <div className="no-results">
                No teams found in Eastern Conference
              </div>
            ) : (
              <div className="teams-grid">
                {filteredEast.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Western Conference */}
        {showWest && (
          <section className="conference-section">
            <div className="conference-header">
              <h2 className="conference-title">Western Conference</h2>
              <span className="team-count">{filteredWest.length} teams</span>
            </div>

            {filteredWest.length === 0 ? (
              <div className="no-results">
                No teams found in Western Conference
              </div>
            ) : (
              <div className="teams-grid">
                {filteredWest.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* No results at all */}
        {filteredEast.length === 0 && filteredWest.length === 0 && (
          <div className="no-results-main">
            <svg
              className="no-results-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3>No teams found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Teams;
