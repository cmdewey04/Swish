// src/pages/Teams.jsx
import { useEffect, useState } from "react";
import { TeamCard } from "../components/TeamCard";
import TEAMS from "../data/teams.json";

function Teams() {
  const [teams, setTeams] = useState(TEAMS);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [conference, setConference] = useState("ALL"); // "ALL" | "EASTERN" | "WESTERN"

  // Filtering logic
  useEffect(() => {
    let list = [...teams];

    if (conference !== "ALL") {
      list = list.filter(
        (t) => t.conference?.toUpperCase() === conference.toUpperCase()
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => {
        const fullName = `${t.market || ""} ${t.name || ""}`.toLowerCase();
        const alias = t.alias?.toLowerCase() || "";
        return (
          fullName.includes(q) ||
          alias.includes(q) ||
          (t.market || "").toLowerCase().includes(q)
        );
      });
    }

    setFiltered(list);
  }, [query, conference, teams]);

  if (error) {
    return <div className="px-4 py-10 text-center text-red-400">{error}</div>;
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Teams</h1>
          <p className="text-sm text-slate-400">
            Browse all NBA teams and view their rosters.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search teams…"
            className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={conference}
            onChange={(e) => setConference(e.target.value)}
          >
            <option value="ALL">All Conferences</option>
            <option value="EASTERN">Eastern</option>
            <option value="WESTERN">Western</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-10">No teams found.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <li key={team.id}>
              <TeamCard team={team} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Teams;
