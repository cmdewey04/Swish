// src/pages/Explore.jsx
import React, { useState, useEffect } from "react";
import Player from "../components/Player";
import PLAYERS from "../Backend/data/players.json";
import {
  MagnifyingGlassIcon,
  Cross2Icon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import "../css/Explore.css";
import { API_BASE } from "../lib/api";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("ALL");
  const [selectedTeam, setSelectedTeam] = useState("ALL");
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const teams = [...new Set(PLAYERS.map((p) => p.team_name))].sort();

  const matchesPosition = (playerPosition, filterPosition) => {
    if (!playerPosition) return false;
    const pos = playerPosition.toUpperCase();

    switch (filterPosition) {
      case "G":
        return pos.includes("G");
      case "F":
        return pos.includes("F");
      case "C":
        return pos.includes("C");
      default:
        return true;
    }
  };

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q && selectedPosition === "ALL" && selectedTeam === "ALL") {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeout = setTimeout(() => {
      let filtered = PLAYERS;

      if (q) {
        filtered = filtered.filter((p) => {
          const name = (p.full_name || "").toLowerCase();
          const team = (p.team_name || "").toLowerCase();
          return name.includes(q) || team.includes(q);
        });
      }

      if (selectedPosition !== "ALL") {
        filtered = filtered.filter((p) =>
          matchesPosition(p.position, selectedPosition),
        );
      }

      if (selectedTeam !== "ALL") {
        filtered = filtered.filter((p) => p.team_name === selectedTeam);
      }

      filtered.sort((a, b) => (b.ppg || 0) - (a.ppg || 0));
      setResults(filtered.slice(0, 50));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedPosition, selectedTeam]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedPosition("ALL");
    setSelectedTeam("ALL");
    setResults([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      console.log("🔄 Refreshing teams data...");
      const refreshResponse = await fetch(`${API_BASE}/api/refresh-teams`, {
        method: "POST",
      });

      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh teams");
      }

      const data = await refreshResponse.json();
      console.log("✅ Teams refresh complete:", data);
      alert("Teams data refreshed! Please reload the page to see updates.");
    } catch (error) {
      console.error("❌ Error refreshing teams:", error);
      alert(
        "Failed to refresh teams. Make sure the backend server is running on port 3001.",
      );
    }

    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="explore-page">
      {/* Hero Section */}
      <div className="explore-hero">
        <div className="explore-hero-content">
          <h1 className="explore-title">Explore Players</h1>
          <p className="explore-subtitle">
            Search and filter through all NBA players
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="refresh-btn"
            style={{
              padding: "0.625rem 1.25rem",
              background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1,
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ReloadIcon width={16} height={16} />
            {refreshing ? "Refreshing..." : "Refresh Teams Data"}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="explore-controls">
        <div className="controls-container">
          {/* Search Bar */}
          <div className="search-wrapper">
            <MagnifyingGlassIcon
              className="search-icon"
              width={20}
              height={20}
            />
            <input
              type="text"
              placeholder="Search players by name or team..."
              className="search-input-explore"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                <Cross2Icon width={20} height={20} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="filters-row">
            <select
              className="filter-select"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="ALL">All Positions</option>
              <option value="G">Guards (G, G-F, etc.)</option>
              <option value="F">Forwards (F, F-C, G-F, etc.)</option>
              <option value="C">Centers (C, F-C, etc.)</option>
            </select>

            <select
              className="filter-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="ALL">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            {(searchQuery ||
              selectedPosition !== "ALL" ||
              selectedTeam !== "ALL") && (
              <button className="reset-btn" onClick={handleReset}>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="explore-content">
        {!isSearching && results.length === 0 ? (
          <div className="no-search-state">
            <MagnifyingGlassIcon
              className="no-search-icon"
              width={80}
              height={80}
            />
            <h3>Search for NBA Players</h3>
            <p>Use the search bar and filters above to find players</p>
          </div>
        ) : results.length === 0 ? (
          <div className="no-results-explore">
            <MagnifyingGlassIcon
              className="no-results-icon"
              width={80}
              height={80}
            />
            <h3>No players found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <h2>Results</h2>
              <span className="results-count">
                {results.length} player{results.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="players-grid">
              {results.map((player) => (
                <Player key={player.id} player={player} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
