// src/pages/Welcome.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getFavoritesFromDB } from "../lib/favoritesService";
import PLAYERS from "../Backend/data/players.json";
import TEAMS from "../Backend/data/teams.json";
import {
  HeartFilledIcon,
  StarFilledIcon,
  MagnifyingGlassIcon,
  BarChartIcon,
  VideoIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";
import "../css/Welcome.css";

const Welcome = () => {
  const { user } = useAuth();
  const [favoritePlayers, setFavoritePlayers] = useState([]);
  const [topPlayer, setTopPlayer] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [relevantGames, setRelevantGames] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Get time of day for greeting
      const hour = new Date().getHours();
      if (hour < 12) setTimeOfDay("Good Morning");
      else if (hour < 17) setTimeOfDay("Good Afternoon");
      else setTimeOfDay("Good Evening");

      // Load favorites based on user
      let favoriteIds = [];
      if (user) {
        favoriteIds = await getFavoritesFromDB(user.email);
      }

      const players = PLAYERS.filter((p) =>
        favoriteIds.includes(String(p.id)),
      ).sort((a, b) => (b.ppg || 0) - (a.ppg || 0));

      setFavoritePlayers(players);
      setTopPlayer(players[0] || null);

      // Load live scores and filter for relevant games
      await loadRelevantGames(players);

      setLoading(false);
    };

    loadData();
    window.addEventListener("favoritesChanged", loadData);
    return () => window.removeEventListener("favoritesChanged", loadData);
  }, [user]);

  const loadRelevantGames = async (players) => {
    try {
      console.log("🏀 Loading relevant games for players:", players.length);

      const timestamp = new Date().getTime();
      const response = await fetch(`/data/live_scores.json?t=${timestamp}`);

      if (!response.ok) {
        throw new Error("Failed to load scores");
      }

      const data = await response.json();
      const games = data.games || [];

      console.log("📊 Total games loaded:", games.length);

      // Get unique team names from favorite players
      const favoriteTeams = [...new Set(players.map((p) => p.team_name))];
      console.log("⭐ Favorite teams (full names):", favoriteTeams);

      // Extract just the team nickname (last word) for matching
      // "New York Knicks" -> "Knicks", "Dallas Mavericks" -> "Mavericks"
      const favoriteTeamNicknames = favoriteTeams.map((team) => {
        const words = team.split(" ");
        return words[words.length - 1]; // Get last word
      });
      console.log("🏷️ Team nicknames to match:", favoriteTeamNicknames);

      // Filter games where home or away team matches a favorite team nickname
      const filtered = games.filter((game) => {
        const homeNickname = game.home_team.team_name; // e.g., "Knicks"
        const awayNickname = game.away_team.team_name; // e.g., "Bucks"

        const matches =
          favoriteTeamNicknames.includes(homeNickname) ||
          favoriteTeamNicknames.includes(awayNickname);

        if (matches) {
          console.log(
            "✅ Match found:",
            `${game.away_team.team_city} ${awayNickname}`,
            "vs",
            `${game.home_team.team_city} ${homeNickname}`,
          );
        }

        return matches;
      });

      console.log("🎯 Relevant games found:", filtered.length);
      setRelevantGames(filtered);
    } catch (error) {
      console.error("Error loading relevant games:", error);
      setRelevantGames([]);
    }
  };

  const formatGameClock = (clockString) => {
    if (!clockString) return "";
    const match = clockString.match(/PT(\d+)M(\d+)/);
    if (!match) return "";
    const minutes = match[1];
    const seconds = match[2].padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getGameStatus = (game) => {
    const status = game.game_status;
    if (status === 1) {
      return { label: "SCHEDULED", class: "status-scheduled" };
    } else if (status === 2) {
      const clock = formatGameClock(game.game_clock);
      return {
        label: `LIVE • Q${game.period} ${clock}`,
        class: "status-live",
      };
    } else if (status === 3) {
      return { label: "FINAL", class: "status-final" };
    }
    return { label: game.game_status_text, class: "status-default" };
  };

  // Quick stats
  const totalPlayers = PLAYERS.length;
  const totalTeams = TEAMS.length;
  const avgPPG =
    favoritePlayers.length > 0
      ? (
          favoritePlayers.reduce((sum, p) => sum + (p.ppg || 0), 0) /
          favoritePlayers.length
        ).toFixed(1)
      : null;

  if (loading) {
    return (
      <div className="welcome-page">
        <div className="loading-state">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      {/* Hero Greeting */}
      <div className="welcome-hero">
        <div className="welcome-hero-content">
          <div className="welcome-avatar-section">
            <img
              src={user?.picture}
              alt={user?.name}
              className="welcome-avatar"
              referrerPolicy="no-referrer"
            />
            <div className="welcome-pulse" />
          </div>

          <div className="welcome-text">
            <p className="welcome-time">{timeOfDay}</p>
            <h1 className="welcome-name">
              Welcome back,{" "}
              <span className="welcome-name-gradient">
                {user?.name?.split(" ")[0]}
              </span>
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening in your NBA world today.
            </p>
          </div>
        </div>
      </div>

      <div className="welcome-content">
        {/* Quick Stats Cards */}
        <div className="welcome-stats-grid">
          <div className="welcome-stat-card">
            <HeartFilledIcon
              className="stat-card-icon"
              width={32}
              height={32}
            />
            <div className="stat-card-info">
              <span className="stat-card-value">{favoritePlayers.length}</span>
              <span className="stat-card-label">Favorite Players</span>
            </div>
          </div>

          <div className="welcome-stat-card">
            <svg
              className="stat-card-icon"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            </svg>
            <div className="stat-card-info">
              <span className="stat-card-value">{totalPlayers}</span>
              <span className="stat-card-label">Total Players</span>
            </div>
          </div>

          <div className="welcome-stat-card">
            <StarFilledIcon className="stat-card-icon" width={32} height={32} />
            <div className="stat-card-info">
              <span className="stat-card-value">{totalTeams}</span>
              <span className="stat-card-label">NBA Teams</span>
            </div>
          </div>

          {avgPPG && (
            <div className="welcome-stat-card">
              <BarChartIcon className="stat-card-icon" width={32} height={32} />
              <div className="stat-card-info">
                <span className="stat-card-value">{avgPPG}</span>
                <span className="stat-card-label">Avg PPG (Favorites)</span>
              </div>
            </div>
          )}
        </div>

        {/* Relevant Games - Always show if user has favorites */}
        {favoritePlayers.length > 0 && (
          <div className="relevant-games-section">
            <div className="section-header">
              <h2 className="section-title">
                <VideoIcon width={20} height={20} />
                Your Teams Playing Tonight
              </h2>
              {relevantGames.length > 0 && (
                <span className="games-count">
                  {relevantGames.length} game
                  {relevantGames.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {relevantGames.length > 0 ? (
              <div className="games-grid">
                {relevantGames.map((game) => {
                  const status = getGameStatus(game);
                  return (
                    <Link
                      to={`/game/${game.game_id}`}
                      key={game.game_id}
                      className="game-card-welcome"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div className={`game-status ${status.class}`}>
                        {status.label}
                      </div>

                      {/* Away Team */}
                      <div className="team-row-welcome away-team">
                        <div className="team-info-welcome">
                          <img
                            src={`https://cdn.nba.com/logos/nba/${game.away_team.team_id}/primary/L/logo.svg`}
                            alt={game.away_team.team_name}
                            className="team-logo-welcome"
                          />
                          <div className="team-details-welcome">
                            <span className="team-name-welcome">
                              {game.away_team.team_city}{" "}
                              {game.away_team.team_name}
                            </span>
                            <span className="team-record-welcome">
                              {game.away_team.wins}-{game.away_team.losses}
                            </span>
                          </div>
                        </div>
                        <div className="team-score-welcome">
                          {game.game_status === 1 ? "-" : game.away_team.score}
                        </div>
                      </div>

                      {/* Home Team */}
                      <div className="team-row-welcome home-team">
                        <div className="team-info-welcome">
                          <img
                            src={`https://cdn.nba.com/logos/nba/${game.home_team.team_id}/primary/L/logo.svg`}
                            alt={game.home_team.team_name}
                            className="team-logo-welcome"
                          />
                          <div className="team-details-welcome">
                            <span className="team-name-welcome">
                              {game.home_team.team_city}{" "}
                              {game.home_team.team_name}
                            </span>
                            <span className="team-record-welcome">
                              {game.home_team.wins}-{game.home_team.losses}
                            </span>
                          </div>
                        </div>
                        <div className="team-score-welcome">
                          {game.game_status === 1 ? "-" : game.home_team.score}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="no-games-message">
                <VideoIcon width={48} height={48} className="no-games-icon" />
                <p>No games scheduled tonight for your favorite teams</p>
              </div>
            )}
          </div>
        )}

        <div className="welcome-grid">
          {/* Top Favorite Player */}
          {topPlayer && (
            <div className="welcome-card">
              <h2 className="welcome-card-title">
                <StarFilledIcon width={18} height={18} />
                Top Favorite
              </h2>
              <Link to={`/players/${topPlayer.id}`} className="top-player-card">
                <img
                  src={`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${topPlayer.id}.png`}
                  alt={topPlayer.full_name}
                  className="top-player-headshot"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="top-player-info">
                  <h3>{topPlayer.full_name}</h3>
                  <p>{topPlayer.team_name}</p>
                  <div className="top-player-stats">
                    <div className="top-player-stat">
                      <span className="top-player-stat-value">
                        {topPlayer.ppg}
                      </span>
                      <span className="top-player-stat-label">PPG</span>
                    </div>
                    <div className="top-player-stat">
                      <span className="top-player-stat-value">
                        {topPlayer.rpg}
                      </span>
                      <span className="top-player-stat-label">RPG</span>
                    </div>
                    <div className="top-player-stat">
                      <span className="top-player-stat-value">
                        {topPlayer.apg}
                      </span>
                      <span className="top-player-stat-label">APG</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Favorite Players List */}
          {favoritePlayers.length > 0 && (
            <div className="welcome-card">
              <div className="welcome-card-header">
                <h2 className="welcome-card-title">
                  <HeartFilledIcon width={18} height={18} />
                  Your Favorites
                </h2>
                <Link to="/favorites" className="welcome-card-link">
                  View All
                  <ArrowRightIcon width={14} height={14} />
                </Link>
              </div>
              <div className="favorites-list">
                {favoritePlayers.slice(0, 5).map((player) => (
                  <Link
                    key={player.id}
                    to={`/players/${player.id}`}
                    className="favorite-list-item"
                  >
                    <img
                      src={`https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.id}.png`}
                      alt={player.full_name}
                      className="favorite-list-avatar"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <div className="favorite-list-info">
                      <span className="favorite-list-name">
                        {player.full_name}
                      </span>
                      <span className="favorite-list-team">
                        {player.team_name}
                      </span>
                    </div>
                    <div className="favorite-list-ppg">
                      <span className="favorite-list-ppg-value">
                        {player.ppg}
                      </span>
                      <span className="favorite-list-ppg-label">PPG</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Favorites State */}
          {favoritePlayers.length === 0 && (
            <div className="welcome-card welcome-empty">
              <svg
                className="empty-icon"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="10" opacity="0.2" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <h3>No favorites yet!</h3>
              <p>Start exploring players and add them to your favorites</p>
              <Link to="/explore" className="welcome-explore-btn">
                Explore Players
              </Link>
            </div>
          )}

          {/* Quick Links */}
          <div className="welcome-card">
            <h2 className="welcome-card-title">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
              </svg>
              Quick Links
            </h2>
            <div className="quick-links">
              <Link to="/explore" className="quick-link">
                <MagnifyingGlassIcon
                  className="quick-link-icon"
                  width={24}
                  height={24}
                />
                <div>
                  <p className="quick-link-title">Explore Players</p>
                  <p className="quick-link-desc">Search all NBA players</p>
                </div>
              </Link>
              <Link to="/teams" className="quick-link">
                <StarFilledIcon
                  className="quick-link-icon"
                  width={24}
                  height={24}
                />
                <div>
                  <p className="quick-link-title">Browse Teams</p>
                  <p className="quick-link-desc">View all 30 NBA teams</p>
                </div>
              </Link>
              <Link to="/favorites" className="quick-link">
                <HeartFilledIcon
                  className="quick-link-icon"
                  width={24}
                  height={24}
                />
                <div>
                  <p className="quick-link-title">My Favorites</p>
                  <p className="quick-link-desc">
                    {favoritePlayers.length} player
                    {favoritePlayers.length !== 1 ? "s" : ""} saved
                  </p>
                </div>
              </Link>
              <Link to="/" className="quick-link">
                <VideoIcon className="quick-link-icon" width={24} height={24} />
                <div>
                  <p className="quick-link-title">Live Scores</p>
                  <p className="quick-link-desc">Today's NBA games</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
