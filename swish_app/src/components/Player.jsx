// src/components/Player.jsx
import { useState } from "react";
import Modal from "./Modal";
import lebron from "/lebron.avif";
import PLAYERS from "../data/players.json";

const DEFAULT_IMG = lebron;

// Adapt a players.json object into the "details" shape
function mapPlayerFromStore(p) {
  if (!p) return null;

  const nbaRef = p.nbaId || p.reference || null;
  const imgUrl = nbaRef
    ? `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${nbaRef}.png`
    : null;

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
    birth_place: p.birth_place,
    rookieYear: p.rookie_year,
    salary: p.salary,

    nbaId: nbaRef,
    imgUrl,

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

function formatHeightInches(h) {
  if (!h) return "-";
  const feet = Math.floor(h / 12);
  const inches = h % 12;
  return `${feet}'${inches}"`;
}

function Player({ player }) {
  const [openModal, setOpenModal] = useState(false);

  const displayId = player.id || player.player_id;
  const displayName = player.full_name || player.name;

  // Look up full record from players.json
  const full = PLAYERS.find((p) => p.id === displayId);
  const details = mapPlayerFromStore(full);

  const displayTeamName =
    player.team_name ||
    player.team?.name ||
    (details ? `${details.teamMarket} ${details.teamName}` : "") ||
    "Free Agent";

  const handleFavorite = (e) => {
    e.stopPropagation();
    alert("YOU LIKED ME");
  };

  const open = () => setOpenModal(true);
  const close = () => setOpenModal(false);

  const imgSrc = details?.imgUrl || player.img || DEFAULT_IMG;

  return (
    <>
      {/* CARD */}
      <div
        role="button"
        onClick={!openModal ? open : undefined}
        className="cursor-pointer rounded-3xl border border-slate-500/60 bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-4 shadow-lg hover:shadow-xl transition-shadow duration-200 mb-4"
      >
        <div className="flex items-start gap-4">
          {/* Headshot */}
          <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-600 shrink-0">
            <img
              src={imgSrc}
              alt={`Photo of ${displayName}`}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Name + team */}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-50">
                  {displayName}
                </h2>
                <p className="text-sm text-slate-300">{displayTeamName}</p>
              </div>

              {/* Favorite button */}
              <button
                className="rounded-full bg-black/40 px-3 py-2 text-lg hover:bg-black/60 transition-colors"
                onClick={handleFavorite}
              >
                ❤️
              </button>
            </div>

            {/* Quick meta row */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="rounded-full bg-slate-900/70 px-3 py-1">
                {details?.position || player.position || "–"}
              </span>
              {details?.jersey && (
                <span className="rounded-full bg-slate-900/70 px-3 py-1">
                  #{details.jersey}
                </span>
              )}
              {details?.status && (
                <span className="rounded-full bg-slate-900/70 px-3 py-1">
                  {details.status === "ACT" ? "Active" : details.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal open={openModal} onClose={close}>
        <div className="w-full max-w-md">
          {!details && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-200">
              <div className="mb-3 text-sm text-slate-400">
                Player details not available.
              </div>
            </div>
          )}

          {details && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-700">
                  <img
                    src={imgSrc}
                    alt={`Photo of ${details.name}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-50">
                    {details.name}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {details.teamMarket} {details.teamName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    #{details.jersey} · {details.position} ·{" "}
                    {details.status === "ACT" ? "Active" : details.status}
                  </p>
                </div>
              </div>

              {/* Main stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-900/80 p-3">
                  <div className="text-xs text-slate-400">PPG</div>
                  <div className="text-lg font-semibold text-slate-50">
                    {details.ppg ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3">
                  <div className="text-xs text-slate-400">RPG</div>
                  <div className="text-lg font-semibold text-slate-50">
                    {details.rpg ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3">
                  <div className="text-xs text-slate-400">APG</div>
                  <div className="text-lg font-semibold text-slate-50">
                    {details.apg ?? "-"}
                  </div>
                </div>
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-2xl bg-slate-900/60 p-2">
                  <div className="text-slate-400">MPG</div>
                  <div className="mt-1 text-slate-100">
                    {details.mpg ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900/60 p-2">
                  <div className="text-slate-400">SPG</div>
                  <div className="mt-1 text-slate-100">
                    {details.spg ?? "-"}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-900/60 p-2">
                  <div className="text-slate-400">BPG</div>
                  <div className="mt-1 text-slate-100">
                    {details.bpg ?? "-"}
                  </div>
                </div>
              </div>

              {/* Bio / vitals */}
              <div className="rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Height</span>
                  <span>{formatHeightInches(details.heightIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weight</span>
                  <span>
                    {details.weightLb ? `${details.weightLb} lb` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Born</span>
                  <span>
                    {details.birthdate || "-"}
                    {details.birth_place ? ` · ${details.birth_place}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rookie Year</span>
                  <span>{details.rookieYear || "-"}</span>
                </div>
                {details.ts && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">TS%</span>
                    <span>{(details.ts * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  className="rounded-md px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm text-slate-50"
                  onClick={close}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export default Player;
