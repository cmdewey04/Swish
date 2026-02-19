// src/components/LiveScores.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../css/LiveScores.css";
import { API_BASE } from "../lib/api";

const LiveScores = () => {
  const [games, setGames] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  const transformNbaGame = (game) => ({
    game_id: game.gameId,
    game_status: game.gameStatus,
    game_status_text: game.gameStatusText,
    period: game.period,
    game_clock: game.gameClock,
    home_team: {
      team_id: game.homeTeam.teamId,
      team_name: game.homeTeam.teamName,
      team_city: game.homeTeam.teamCity,
      team_tricode: game.homeTeam.teamTricode,
      score: game.homeTeam.score,
      wins: game.homeTeam.wins,
      losses: game.homeTeam.losses,
    },
    away_team: {
      team_id: game.awayTeam.teamId,
      team_name: game.awayTeam.teamName,
      team_city: game.awayTeam.teamCity,
      team_tricode: game.awayTeam.teamTricode,
      score: game.awayTeam.score,
      wins: game.awayTeam.wins,
      losses: game.awayTeam.losses,
    },
  });

  const fetchLiveScores = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scores`);
      if (!response.ok) throw new Error("Scores API failed");

      const json = await response.json();
      const nbaGames = json.data?.games || [];
      const transformed = nbaGames.map(transformNbaGame);

      setGames(transformed);
      setLastUpdated(new Date().toISOString());
      setLoading(false);

      console.log("📊 Loaded games:", transformed.length);
    } catch (error) {
      console.warn(
        "⚠️ API failed, falling back to static file:",
        error.message,
      );

      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/data/live_scores.json?t=${timestamp}`);
        if (!response.ok) throw new Error("Static file also failed");

        const data = await response.json();
        setGames(data.games || []);
        setLastUpdated(data.last_updated);
      } catch (fallbackError) {
        console.error("❌ Both sources failed:", fallbackError);
        setGames([]);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveScores();

    // Auto-refresh every 30 seconds for live games
    const interval = setInterval(() => {
      fetchLiveScores();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatGameClock = (clock, period) => {
    if (!clock || !period) return "";

    const match = clock.match(/PT(\d+)M(\d+(?:\.\d+)?)S/);
    if (!match) return clock;

    const minutes = parseInt(match[1]);
    const seconds = Math.floor(parseFloat(match[2]));

    return `Q${period} ${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getGameStatusBadge = (status, statusText, clock, period) => {
    if (status === 1)
      return {
        text: statusText || "Scheduled",
        className: "status-scheduled",
        showClock: false,
      };
    if (status === 2)
      return {
        text: "LIVE",
        className: "status-live",
        showClock: true,
        clockText: formatGameClock(clock, period),
      };
    if (status === 3)
      return { text: "Final", className: "status-final", showClock: false };
    return { text: statusText, className: "status-default", showClock: false };
  };

  const getTeamLogo = (teamId) => {
    return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
  };

  if (loading) {
    return (
      <div className="live-scores-section">
        <div className="live-scores-header">
          <h2>Today's Games</h2>
        </div>
        <div className="loading-state">Loading games...</div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="live-scores-section">
        <div className="live-scores-header">
          <h2>Today's Games</h2>
        </div>
        <div className="no-games">
          <p>No games scheduled today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-scores-section">
      <div className="live-scores-header">
        <div className="header-left">
          <h2>Today's Games</h2>
          {lastUpdated && (
            <span className="last-updated">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="games-container">
        {games.map((game) => {
          const status = getGameStatusBadge(
            game.game_status,
            game.game_status_text,
            game.game_clock,
            game.period,
          );

          return (
            <Link
              to={`/game/${game.game_id}`}
              key={game.game_id}
              className="game-card-link"
            >
              <div className="game-card">
                {/* Status Badge */}
                <div className={`game-status ${status.className}`}>
                  {status.text}
                  {status.showClock && status.clockText && (
                    <span className="game-clock"> • {status.clockText}</span>
                  )}
                </div>

                {/* Away Team */}
                <div className="team-row away-team">
                  <div className="team-info">
                    <img
                      src={getTeamLogo(game.away_team.team_id)}
                      alt={game.away_team.team_name}
                      className="team-logo"
                    />
                    <div className="team-details">
                      <span className="team-name">
                        {game.away_team.team_city} {game.away_team.team_name}
                      </span>
                      <span className="team-record">
                        {game.away_team.wins}-{game.away_team.losses}
                      </span>
                    </div>
                  </div>
                  <div className="team-score">
                    {game.away_team.score || "-"}
                  </div>
                </div>

                {/* Home Team */}
                <div className="team-row home-team">
                  <div className="team-info">
                    <img
                      src={getTeamLogo(game.home_team.team_id)}
                      alt={game.home_team.team_name}
                      className="team-logo"
                    />
                    <div className="team-details">
                      <span className="team-name">
                        {game.home_team.team_city} {game.home_team.team_name}
                      </span>
                      <span className="team-record">
                        {game.home_team.wins}-{game.home_team.losses}
                      </span>
                    </div>
                  </div>
                  <div className="team-score">
                    {game.home_team.score || "-"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default LiveScores;
