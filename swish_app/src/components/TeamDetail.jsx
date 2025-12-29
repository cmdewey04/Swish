// src/pages/TeamDetail.jsx
import React from "react";
import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import teamsData from "../data/teams.json";
import "../css/teamDetail.css";

const teams = teamsData;

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

function inchesToFeet(inches) {
  if (!inches) return "-";
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

export default function TeamDetail() {
  const { alias } = useParams();

  const team = teams.find(
    (t) => t.alias.toLowerCase() === (alias || "").toLowerCase()
  );

  if (!team) return <div className="team-detail-page">Team not found.</div>;

  const record =
    team.wins != null && team.losses != null
      ? `${team.wins}-${team.losses}`
      : "N/A";

  const logo = getTeamLogoUrl(alias);

  const injuredPlayers =
    team.roster.filter((p) => p.injuries && p.injuries.length > 0) || [];

  return (
    <div className="team-detail-page">
      {/* Hero */}
      <div className="team-hero">
        <img
          className="team-hero-img"
          src={`/images/bg/${team.market.toLowerCase()}1920.jpg`}
          srcSet={`
  /images/bg/${team.market.toLowerCase().replace(/ /g, "-")}1920.jpg 1920w,
  /images/bg/${team.market.toLowerCase().replace(/ /g, "-")}4k.jpg 3840w
`}
          sizes="100vw"
          alt=""
        />
        <div className="team-hero-overlay" />

        <div className="team-hero-content">
          {logo && (
            <div className="team-logo-wrapper">
              <img className="team-logo" src={logo} alt={`${team.name} logo`} />
            </div>
          )}

          <div className="team-hero-text">
            <h1>
              {team.market} {team.name}
            </h1>
            <p className="team-meta">
              {team.conference} · {team.division}
            </p>
            <p className="team-record">Record: {record}</p>
          </div>
        </div>
      </div>

      {/* Main layout: left roster / right injuries */}
      <div className="team-main">
        {/* Roster */}
        <section className="team-roster-section">
          <h2>Roster</h2>
          <div className="table-wrapper">
            <table className="roster-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Ht</th>
                  <th>Wt</th>
                  <th>Exp</th>
                  <th>College</th>
                  <th>Injury</th>
                </tr>
              </thead>
              <tbody>
                {team.roster.map((p) => {
                  const injury = p.injuries && p.injuries[0];
                  const injuryText = injury
                    ? `${injury.desc} (${injury.status})`
                    : "-";

                  return (
                    <tr key={p.id}>
                      <td className="num">{p.jersey_number}</td>
                      <td className="player-name">
                        <Link to={`/players/${p.id}`}>{p.full_name}</Link>
                      </td>
                      <td>{p.primary_position || p.position}</td>
                      <td>{inchesToFeet(p.height)}</td>
                      <td>{p.weight || "-"}</td>
                      <td>{p.experience}</td>
                      <td>{p.college || "-"}</td>
                      <td className={injury ? "injury" : ""}>{injuryText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Injuries sidebar */}
        <aside className="team-injuries-section">
          <h3>Injuries</h3>
          {injuredPlayers.length === 0 && <p>No reported injuries.</p>}
          {injuredPlayers.map((p) =>
            p.injuries.map((inj) => (
              <div key={inj.id} className="injury-card">
                <div className="injury-player">
                  <Link to={`/players/${p.id}`}>{p.full_name}</Link>
                  <span className="injury-pos">
                    {p.primary_position || p.position}
                  </span>
                </div>
                <div className="injury-body">
                  <span className="injury-type">{inj.desc}</span>
                  <span className="injury-status">{inj.status}</span>
                </div>
                <p className="injury-comment">{inj.comment}</p>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
