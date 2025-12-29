// src/components/TeamCard.jsx
import { Link } from "react-router-dom";

export const TEAM_ID_MAP = {
  ATL: "1610612737",
  BOS: "1610612738",
  BKN: "1610612751",
  CHA: "1610612766",
  CHI: "1610612741",
  CLE: "1610612739",
  DAL: "1610612742",
  DEN: "1610612743",
  DET: "1610612765",
  GSW: "1610612744",
  HOU: "1610612745",
  IND: "1610612754",
  LAC: "1610612746",
  LAL: "1610612747",
  MEM: "1610612763",
  MIA: "1610612748",
  MIL: "1610612749",
  MIN: "1610612750",
  NOP: "1610612740",
  NYK: "1610612752",
  OKC: "1610612760",
  ORL: "1610612753",
  PHI: "1610612755",
  PHX: "1610612756",
  POR: "1610612757",
  SAC: "1610612758",
  SAS: "1610612759",
  TOR: "1610612761",
  UTA: "1610612762",
  WAS: "1610612764",
};

const getTeamLogoUrl = (alias) => {
  if (!alias) return null;
  const teamNumericId = TEAM_ID_MAP[alias];
  // adjust this pattern to whatever logo scheme you use
  return `https://cdn.nba.com/logos/nba/${teamNumericId}/global/L/logo.svg`;
};

export function TeamCard({ team }) {
  const { id, name, market, alias, conference, division, wins, losses, ref } =
    team;
  const logo = getTeamLogoUrl(alias);
  const fullName = `${market} ${name}`;

  return (
    <Link
      to={`/teams/${alias}`} // or `/teams/${alias}` if you prefer
      className="block rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4 shadow-md hover:shadow-xl hover:border-sky-500/60 transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-14 w-14 rounded-2xl bg-slate-900/80 flex items-center justify-center overflow-hidden border border-slate-700">
          {logo ? (
            <img
              src={logo}
              alt={`${fullName} logo`}
              className="h-10 object-contain"
            />
          ) : (
            <span className="text-sm text-slate-500">{alias}</span>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-50">{fullName}</h2>
          <p className="text-xs text-slate-400">
            {conference && division
              ? `${conference} · ${division} Division`
              : conference
              ? `${conference}`
              : division
              ? `${division} Division`
              : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
        <div className="rounded-2xl bg-slate-900/80 px-3 py-1">
          Record:{" "}
          <span className="font-semibold">
            {wins != null && losses != null ? `${wins}-${losses}` : "—"}
          </span>
        </div>

        <span className="text-[11px] text-slate-500">View roster →</span>
      </div>
    </Link>
  );
}
