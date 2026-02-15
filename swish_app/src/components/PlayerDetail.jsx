// src/pages/PlayerDetail.jsx
import React, { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import playersData from "../Backend/data/players.json";
import "../css/PlayerDetail.css";

function formatHeight(height) {
  if (!height) return "-";
  // Height comes as "6-7" format from NBA API
  return height;
}

const Stat = ({ label, value, suffix = "", size = "normal" }) => (
  <div className="stat-item">
    <span className="stat-label">{label}</span>
    <span
      className={`stat-value ${size === "large" ? "stat-value-large" : ""}`}
    >
      {value != null ? `${value}${suffix}` : "-"}
    </span>
  </div>
);

const getTeamLogoUrl = (teamId) => {
  if (!teamId) return null;
  return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
};

export default function PlayerDetail() {
  const { id } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const player = useMemo(() => {
    return playersData.find((p) => String(p.id) === String(id));
  }, [id]);

  if (!player) {
    return (
      <div className="player-not-found">
        <p>Player not found.</p>
        <Link to="/teams" className="back-link">
          ← Back to Teams
        </Link>
      </div>
    );
  }

  const playerImageUrl = `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.id}.png`;
  const teamLogo = getTeamLogoUrl(player.team_id);

  // Calculate age from birthdate
  const age = player.birthdate
    ? Math.floor(
        (new Date() - new Date(player.birthdate)) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <div className="player-detail-page">
      {/* Hero Section */}
      <div className="player-hero">
        <div className="player-hero-content">
          <Link to="/teams" className="back-link">
            ← Back to Teams
          </Link>

          <div className="player-header">
            {/* Player Image */}
            <div className="player-image-wrapper">
              <img
                src={playerImageUrl}
                alt={player.full_name}
                className="player-image"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
              <div className="player-image-placeholder">
                <span>
                  {player.first_name?.[0]}
                  {player.last_name?.[0]}
                </span>
              </div>
            </div>

            {/* Player Info */}
            <div className="player-info">
              <div className="player-title">
                <h1>{player.full_name}</h1>
                {player.jersey_number && (
                  <span className="jersey-badge">#{player.jersey_number}</span>
                )}
              </div>

              <div className="player-team-info">
                {teamLogo && (
                  <img
                    src={teamLogo}
                    alt="Team logo"
                    className="team-logo-small"
                  />
                )}
                <span className="team-name">{player.team_name}</span>
                <span className="position-badge">{player.position}</span>
              </div>

              {/* Quick Stats Grid */}
              <div className="player-quick-stats">
                <div className="quick-stat">
                  <span className="quick-stat-label">Height</span>
                  <span className="quick-stat-value">
                    {formatHeight(player.height)}
                  </span>
                </div>
                <div className="quick-stat">
                  <span className="quick-stat-label">Weight</span>
                  <span className="quick-stat-value">
                    {player.weight ? `${player.weight} lbs` : "-"}
                  </span>
                </div>
                {age && (
                  <div className="quick-stat">
                    <span className="quick-stat-label">Age</span>
                    <span className="quick-stat-value">{age}</span>
                  </div>
                )}
                {player.school && (
                  <div className="quick-stat">
                    <span className="quick-stat-label">College</span>
                    <span className="quick-stat-value">{player.school}</span>
                  </div>
                )}
              </div>

              {/* Draft Info */}
              {player.draft_year && (
                <div className="draft-info">
                  <span className="draft-label">Draft:</span>
                  <span className="draft-value">
                    {player.draft_year} · Round {player.draft_round || "?"} ·
                    Pick #{player.draft_number || "?"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="player-stats-section">
        <div className="stats-container">
          {/* Primary Stats */}
          <div className="stats-card stats-card-primary">
            <h2 className="stats-title">Season Averages</h2>

            <div className="stats-grid stats-grid-main">
              <Stat label="PPG" value={player.ppg} size="large" />
              <Stat label="RPG" value={player.rpg} size="large" />
              <Stat label="APG" value={player.apg} size="large" />
            </div>

            <div className="stats-divider" />

            <div className="stats-grid stats-grid-secondary">
              <Stat label="MPG" value={player.mpg} />
              <Stat label="SPG" value={player.spg} />
              <Stat label="BPG" value={player.bpg} />
              <Stat label="TO" value={player.topg} />
            </div>
          </div>

          {/* Shooting Stats */}
          <div className="stats-card">
            <h3 className="stats-subtitle">Shooting</h3>

            <div className="stats-grid stats-grid-shooting">
              <Stat label="FG%" value={player.fgpct} suffix="%" />
              <Stat label="3P%" value={player.fg3pct} suffix="%" />
              <Stat label="FT%" value={player.ftpct} suffix="%" />
            </div>

            <div className="stats-divider" />

            <div className="stats-grid stats-grid-shooting">
              <Stat label="FGM" value={player.fgm} />
              <Stat label="FGA" value={player.fga} />
              <Stat label="3PM" value={player.fg3m} />
              <Stat label="3PA" value={player.fg3a} />
              <Stat label="FTM" value={player.ftm} />
              <Stat label="FTA" value={player.fta} />
            </div>
          </div>

          {/* Additional Stats */}
          <div className="stats-card">
            <h3 className="stats-subtitle">Advanced Stats</h3>

            <div className="stats-grid stats-grid-advanced">
              <Stat label="OREB" value={player.oreb} />
              <Stat label="DREB" value={player.dreb} />
              <Stat label="PF" value={player.pf} />
            </div>

            {player.gp && (
              <>
                <div className="stats-divider" />
                <div className="games-played">
                  <span className="gp-label">Games Played</span>
                  <span className="gp-value">{player.gp}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
