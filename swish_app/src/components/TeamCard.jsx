// src/components/TeamCard.jsx
import { Link } from "react-router-dom";

const getTeamLogoUrl = (teamId) => {
  if (!teamId) return null;
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
};

export function TeamCard({ team }) {
  const {
    id,
    name,
    full_name,
    city,
    abbreviation,
    conference,
    division,
    wins,
    losses,
  } = team;
  const logo = getTeamLogoUrl(id);

  // Calculate win percentage
  const totalGames = (wins || 0) + (losses || 0);
  const winPct =
    totalGames > 0 ? (((wins || 0) / totalGames) * 100).toFixed(1) : null;

  return (
    <Link
      to={`/teams/${abbreviation}`}
      className="block rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-md hover:shadow-xl hover:border-sky-500/60 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-14 w-14 rounded-2xl bg-slate-900/80 flex items-center justify-center overflow-hidden border border-slate-700 group-hover:border-sky-500/40 transition-colors">
          {logo ? (
            <img
              src={logo}
              alt={`${full_name} logo`}
              className="h-10 object-contain"
            />
          ) : (
            <span className="text-sm text-slate-500">{abbreviation}</span>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-50 group-hover:text-sky-400 transition-colors">
            {full_name}
          </h2>
          <p className="text-xs text-slate-400">
            {conference && division
              ? `${conference} · ${division}`
              : conference || division || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-slate-900/80 px-3 py-1 text-xs">
            <span className="text-slate-400">Record: </span>
            <span className="font-semibold text-slate-200">
              {wins != null && losses != null ? `${wins}-${losses}` : "—"}
            </span>
          </div>

          {winPct && (
            <div className="rounded-2xl bg-sky-950/30 border border-sky-900/50 px-3 py-1 text-xs">
              <span className="font-semibold text-sky-300">{winPct}%</span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-500 group-hover:text-sky-400 transition-colors">
          View roster →
        </span>
      </div>
    </Link>
  );
}
