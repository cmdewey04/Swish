// src/pages/PlayerDetail.jsx
import React, { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import playersData from "../data/players.json";
import "../css/PlayerDetail.css";
import { TEAM_COLORS } from "../constants/teamColors";

function inchesToFeet(inches) {
  if (!inches) return "-";
  const ft = Math.floor(inches / 12);
  const rem = inches % 12;
  return `${ft}'${rem}"`;
}

// Take the players.json object and adapt it to the old shape
function mapPlayerFromJson(p) {
  if (!p) return null;

  const nbaRef = p.nbaId || p.reference || null;

  return {
    id: p.id,
    name: p.full_name,
    firstName: p.first_name,
    lastName: p.last_name,

    teamName: p.team_name,
    teamMarket: p.team_market,
    teamAlias: p.team_alias,

    status: p.status,
    position: p.position,
    jersey: p.jersey_number,
    heightIn: p.height,
    weightLb: p.weight,
    birthdate: p.birthdate,
    birthPlace: p.birth_place,
    rookieYear: p.rookie_year,
    salary: p.salary,

    nbaId: nbaRef,
    imgUrl: nbaRef
      ? `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${nbaRef}.png`
      : null,

    ppg: p.ppg,
    rpg: p.rpg,
    apg: p.apg,
    mpg: p.mpg,
    spg: p.spg,
    bpg: p.bpg,
    topg: p.topg,
    ts: p.ts,
    usage: p.usage,
    eff: p.eff,
  };
}

/* The Stat Component would look something like this: */
const Stat = ({ label, value, pct, size }) => (
  <div className="flex flex-col">
    {/* Label: Smaller and dimmer */}
    <span className="text-neutral-400 text-xs uppercase tracking-wider order-2 mt-1">
      {label}
    </span>
    {/* Value: Conditional sizing */}
    <span
      className={`order-1 ${
        size === "large"
          ? "text-4xl font-extrabold text-white"
          : "text-xl font-semibold text-neutral-200"
      }`}
    >
      {value || "-"}
      {pct && "%"}
    </span>
  </div>
);

export default function PlayerDetail() {
  const { id } = useParams();

  // scroll to top when you hit a player page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const player = useMemo(() => {
    const raw = playersData.find((p) => p.id === id);
    return mapPlayerFromJson(raw);
  }, [id]);

  const color = TEAM_COLORS[player.teamAlias] || "#111827";

  if (!player) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
        <p className="mb-4">Player not found.</p>
        <Link to={-1} className="underline text-purple-400">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div
      className="player-detail-page"
      style={{
        // STRONGER GRADIENT: Increased opacity and wider spread for the team color
        background: `radial-gradient(circle at top, ${color}C0 0, #050509 60%)`, // C0 is ~75% opacity
      }}
    >
      <div className="min-h-screen text-neutral-100 px-4 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link to={-1} className="text-sm text-neutral-400 hover:text-white">
            ← Back
          </Link>

          <div className="mt-6 flex flex-col sm:flex-row gap-8 items-start">
            {/* Headshot */}
            <div
              className={`p-1 rounded-full border-4 shadow-xl`}
              style={{ borderColor: `${color}4D` }}
            >
              {player.imgUrl ? (
                <img
                  src={player.imgUrl}
                  alt={player.name}
                  className="w-[140px] h-[140px] object-cover rounded-full"
                />
              ) : (
                <div className="w-[140px] h-[140px] flex items-center justify-center text-neutral-500 rounded-full bg-neutral-800 text-sm">
                  No image
                </div>
              )}
            </div>

            {/* Basic info */}
            <div className="flex-1">
              <h1 className="text-5xl font-extrabold mb-1 tracking-tight">
                {player.name}
              </h1>

              <p className="text-neutral-300 mb-2 text-lg">
                {player.teamMarket} {player.teamName} ·{" "}
                <span className="font-bold" style={{ color: color }}>
                  {player.position}
                </span>{" "}
                {player.jersey && (
                  <span style={{ color: color }}>· #{player.jersey}</span>
                )}
              </p>

              <div
                className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-widest font-semibold"
                style={{ background: `${color}20`, color: color }}
              >
                {player.status || "N/A"}
              </div>

              {/* Biographical Info */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-y-3 text-sm text-neutral-300">
                {/* ... (Existing bio divs) ... */}
                <div>
                  <span className="text-neutral-500">Height</span>
                  <div>{inchesToFeet(player.heightIn)}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Weight</span>
                  <div>{player.weightLb ? `${player.weightLb} lb` : "-"}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Born</span>
                  <div>
                    {player.birthdate || "-"}
                    {player.birthPlace && ` · ${player.birthPlace}`}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Rookie Year</span>
                  <div>{player.rookieYear || "-"}</div>
                </div>
                <div>
                  <span className="text-neutral-500">Salary</span>
                  <div>
                    {player.salary ? `$${player.salary.toLocaleString()}` : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats card: Add subtle colored shadow */}
          <div
            className="mt-12 bg-neutral-900/80 rounded-xl p-4 sm:p-8 shadow-2xl border border-neutral-700/50"
            style={{ boxShadow: `0 10px 40px -8px ${color}80` }} // Team color glow
          >
            <h2 className="text-2xl font-bold mb-6 text-neutral-100">
              Season Averages
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 text-center">
              <Stat label="PPG" value={player.ppg} size="large" />
              <Stat label="RPG" value={player.rpg} size="large" />
              <Stat label="APG" value={player.apg} size="large" />
              <Stat label="SPG" value={player.spg} size="large" />
              <Stat label="BPG" value={player.bpg} size="large" />
              <Stat label="MPG" value={player.mpg} size="large" />
            </div>

            <hr className="my-8 border-neutral-700/50" />

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 text-center text-sm">
              <Stat label="TS%" value={player.ts} pct />
              <Stat label="USG%" value={player.usage} pct />
              <Stat label="TOV" value={player.topg} />
              <Stat label="EFF" value={player.eff} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
