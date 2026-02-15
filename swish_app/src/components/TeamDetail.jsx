// src/pages/TeamDetail.jsx
import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import teamsData from "../Backend/data/teams.json";
import playersData from "../Backend/data/players.json";
import { TEAM_COLORS } from "../constants/teamColors";
import "../css/teamDetail.css";

const teams = teamsData;

const getTeamLogoUrl = (teamId) => {
  if (!teamId) return null;
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
};

function formatHeight(height) {
  if (!height) return "-";
  return height;
}

export default function TeamDetail() {
  const { abbreviation } = useParams();

  const team = teams.find(
    (t) => t.abbreviation.toLowerCase() === (abbreviation || "").toLowerCase(),
  );

  // Get player stats from players.json for this team's roster
  const roster = useMemo(() => {
    if (!team) return [];
    return playersData.filter((p) => p.team_id === team.id);
  }, [team]);

  if (!team) return <div className="team-detail-page">Team not found.</div>;

  const record =
    team.wins != null && team.losses != null
      ? `${team.wins}-${team.losses}`
      : "N/A";

  const logo = getTeamLogoUrl(team.id);
  const teamColor = TEAM_COLORS[team.abbreviation] || "#38bdf8";

  return (
    <div className="team-detail-page">
      {/* Hero */}
      <div className="team-hero">
        <img
          className="team-hero-img"
          src={`/images/bg/${team.city.toLowerCase().replace(/ /g, "-")}1920.jpg`}
          srcSet={`
  /images/bg/${team.city.toLowerCase().replace(/ /g, "-")}1920.jpg 1920w,
  /images/bg/${team.city.toLowerCase().replace(/ /g, "-")}4k.jpg 3840w
`}
          sizes="100vw"
          alt=""
        />
        <div className="team-hero-overlay" />

        <div className="team-hero-content">
          {logo && (
            <div
              className="team-logo-wrapper"
              style={{
                borderColor: `${teamColor}60`,
              }}
            >
              <img className="team-logo" src={logo} alt={`${team.name} logo`} />
            </div>
          )}

          <div className="team-hero-text">
            <h1>{team.full_name}</h1>
            <p className="team-meta">
              {team.conference} · {team.division}
            </p>
            <p
              className="team-record"
              style={{
                backgroundColor: `${teamColor}15`,
                borderColor: `${teamColor}50`,
                color: teamColor,
              }}
            >
              Record: {record}
            </p>
          </div>
        </div>
      </div>

      {/* Main layout: left roster / right team leaders */}
      <div className="team-main">
        {/* Roster */}
        <section className="team-roster-section">
          <h2>Roster</h2>
          <div
            className="table-wrapper"
            style={{
              borderColor: `${teamColor}30`,
            }}
          >
            <table className="roster-table">
              <thead
                style={{
                  borderBottomColor: `${teamColor}50`,
                }}
              >
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Pos</th>
                  <th>Ht</th>
                  <th>Wt</th>
                  <th>School</th>
                  <th>Draft</th>
                  <th>PPG</th>
                  <th>RPG</th>
                  <th>APG</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td className="num" style={{ color: teamColor }}>
                        {p.jersey_number || "-"}
                      </td>
                      <td className="player-name">
                        <Link
                          to={`/players/${p.id}`}
                          onMouseEnter={(e) =>
                            (e.target.style.color = teamColor)
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = "#f1f5f9")
                          }
                        >
                          {p.full_name}
                        </Link>
                      </td>
                      <td>{p.position || "-"}</td>
                      <td>{formatHeight(p.height)}</td>
                      <td>{p.weight || "-"}</td>
                      <td>{p.school || "-"}</td>
                      <td className="draft-info">
                        {p.draft_year ? (
                          <>
                            {p.draft_year}
                            {p.draft_round && p.draft_number && (
                              <>
                                {" "}
                                · R{p.draft_round} #{p.draft_number}
                              </>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{p.ppg ?? "-"}</td>
                      <td>{p.rpg ?? "-"}</td>
                      <td>{p.apg ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Team Leaders sidebar */}
        <aside className="team-injuries-section">
          <h3>Team Leaders</h3>
          {roster.length > 0 && (
            <div className="team-leaders">
              {/* PPG Leader */}
              {(() => {
                const ppgLeader = [...roster]
                  .filter((p) => p.ppg != null)
                  .sort((a, b) => b.ppg - a.ppg)[0];

                return ppgLeader ? (
                  <div
                    className="leader-card"
                    style={{
                      borderColor: `${teamColor}40`,
                    }}
                  >
                    <div className="leader-stat">Points</div>
                    <Link
                      to={`/players/${ppgLeader.id}`}
                      className="leader-name"
                      onMouseEnter={(e) => (e.target.style.color = teamColor)}
                      onMouseLeave={(e) => (e.target.style.color = "#f1f5f9")}
                    >
                      {ppgLeader.full_name}
                    </Link>
                    <div
                      className="leader-value"
                      style={{
                        background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}CC 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {ppgLeader.ppg} PPG
                    </div>
                  </div>
                ) : null;
              })()}

              {/* RPG Leader */}
              {(() => {
                const rpgLeader = [...roster]
                  .filter((p) => p.rpg != null)
                  .sort((a, b) => b.rpg - a.rpg)[0];

                return rpgLeader ? (
                  <div
                    className="leader-card"
                    style={{
                      borderColor: `${teamColor}40`,
                    }}
                  >
                    <div className="leader-stat">Rebounds</div>
                    <Link
                      to={`/players/${rpgLeader.id}`}
                      className="leader-name"
                      onMouseEnter={(e) => (e.target.style.color = teamColor)}
                      onMouseLeave={(e) => (e.target.style.color = "#f1f5f9")}
                    >
                      {rpgLeader.full_name}
                    </Link>
                    <div
                      className="leader-value"
                      style={{
                        background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}CC 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {rpgLeader.rpg} RPG
                    </div>
                  </div>
                ) : null;
              })()}

              {/* APG Leader */}
              {(() => {
                const apgLeader = [...roster]
                  .filter((p) => p.apg != null)
                  .sort((a, b) => b.apg - a.apg)[0];

                return apgLeader ? (
                  <div
                    className="leader-card"
                    style={{
                      borderColor: `${teamColor}40`,
                    }}
                  >
                    <div className="leader-stat">Assists</div>
                    <Link
                      to={`/players/${apgLeader.id}`}
                      className="leader-name"
                      onMouseEnter={(e) => (e.target.style.color = teamColor)}
                      onMouseLeave={(e) => (e.target.style.color = "#f1f5f9")}
                    >
                      {apgLeader.full_name}
                    </Link>
                    <div
                      className="leader-value"
                      style={{
                        background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}CC 100%)`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {apgLeader.apg} APG
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
