// src/pages/GameDetail.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { TEAM_COLORS } from "../constants/teamColors";
import SwishPredict from "../components/SwishPredict";
import teamsData from "../Backend/data/teams.json";
import "../css/GameDetail.css";
import { API_BASE } from "../lib/api";

const getTeamLogo = (teamId) =>
  `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;

const getLogoByAbbr = (abbr) =>
  `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr.toLowerCase()}.png&h=100&w=100`;

function formatMinutes(min) {
  if (!min) return "0:00";
  if (typeof min === "string" && min.startsWith("PT")) {
    const match = min.match(/PT(\d+)M([\d.]+)S/);
    if (match) {
      return `${match[1]}:${Math.floor(parseFloat(match[2])).toString().padStart(2, "0")}`;
    }
  }
  return min;
}

function getTeamRecord(teamId) {
  const team = teamsData.find((t) => String(t.id) === String(teamId));
  if (team && team.wins != null && team.losses != null) {
    return `${team.wins}-${team.losses}`;
  }
  return null;
}

export default function GameDetail() {
  const { gameId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("box");
  const [preGameTeams, setPreGameTeams] = useState(null);

  // Highlights state
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [highlightsLoaded, setHighlightsLoaded] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  // Fetch team info from live_scores.json for pre-game fallback
  useEffect(() => {
    fetch("/data/live_scores.json?t=" + Date.now())
      .then((res) => res.json())
      .then((scores) => {
        const games = scores.games || [];
        const match = games.find((g) => g.game_id === gameId);
        if (match) {
          setPreGameTeams({
            homeAbbr: match.home_team?.team_tricode,
            awayAbbr: match.away_team?.team_tricode,
            homeName: match.home_team?.team_name,
            awayName: match.away_team?.team_name,
            homeCity: match.home_team?.team_city,
            awayCity: match.away_team?.team_city,
            homeId: match.home_team?.team_id,
            awayId: match.away_team?.team_id,
            homeWins: match.home_team?.wins,
            homeLosses: match.home_team?.losses,
            awayWins: match.away_team?.wins,
            awayLosses: match.away_team?.losses,
            gameStatusText: match.game_status_text || "",
          });
        }
      })
      .catch(() => {});
  }, [gameId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/boxscore/${gameId}`)
      .then((res) => res.json())
      .then((json) => {
        const gameData = json.data?.data || json.data;
        if (json.success && gameData) {
          setData(gameData);

          // If game hasn't started, default to predict tab
          const summary = gameData.game_summary || {};
          const isPreGame =
            gameData.pre_game ||
            summary.GAME_STATUS_ID === 1 ||
            !gameData.line_score ||
            gameData.line_score.length < 2;
          if (isPreGame) {
            setActiveTab("predict");
          }
        } else {
          setData(json.data || null);
          setError(json.error || "Failed to load box score");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to connect to server.");
        setLoading(false);
      });
  }, [gameId]);

  // Fetch clips
  const fetchHighlights = (awayName, homeName) => {
    if (highlightsLoaded) return;
    setHighlightsLoading(true);

    const query = `${awayName} vs ${homeName}`;
    const gameDate =
      summary.GAME_DATE_EST || new Date().toISOString().split("T")[0];
    fetch(
      `${API_BASE}/api/highlights?q=${encodeURIComponent(query)}&date=${gameDate}`,
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setHighlights(json.videos || []);
          if (json.videos && json.videos.length > 0) {
            setActiveVideo(json.videos[0]);
          }
        }
        setHighlightsLoading(false);
        setHighlightsLoaded(true);
      })
      .catch(() => {
        setHighlightsLoading(false);
        setHighlightsLoaded(true);
      });
  };

  const { awayTeam, homeTeam, awayColor, homeColor } = useMemo(() => {
    if (!data || !data.line_score || data.line_score.length < 2) {
      return {
        awayTeam: null,
        homeTeam: null,
        awayColor: "#38bdf8",
        homeColor: "#f472b6",
      };
    }
    const away = data.line_score[0];
    const home = data.line_score[1];
    return {
      awayTeam: away,
      homeTeam: home,
      awayColor: TEAM_COLORS[away.TEAM_ABBREVIATION] || "#38bdf8",
      homeColor: TEAM_COLORS[home.TEAM_ABBREVIATION] || "#f472b6",
    };
  }, [data]);

  const { awayPlayers, homePlayers } = useMemo(() => {
    if (!data || !data.player_stats || !awayTeam || !homeTeam) {
      return { awayPlayers: [], homePlayers: [] };
    }
    return {
      awayPlayers: data.player_stats.filter(
        (p) => String(p.TEAM_ID) === String(awayTeam.TEAM_ID),
      ),
      homePlayers: data.player_stats.filter(
        (p) => String(p.TEAM_ID) === String(homeTeam.TEAM_ID),
      ),
    };
  }, [data, awayTeam, homeTeam]);

  const { awayTeamStats, homeTeamStats } = useMemo(() => {
    if (!data || !awayTeam || !homeTeam) {
      return { awayTeamStats: null, homeTeamStats: null };
    }

    if (data.team_stats && data.team_stats.length >= 2) {
      return {
        awayTeamStats: data.team_stats.find(
          (t) => String(t.TEAM_ID) === String(awayTeam.TEAM_ID),
        ),
        homeTeamStats: data.team_stats.find(
          (t) => String(t.TEAM_ID) === String(homeTeam.TEAM_ID),
        ),
      };
    }

    const calcTotals = (players) => {
      const active = players.filter(
        (p) =>
          p.MIN &&
          p.MIN !== "PT00M00.00S" &&
          p.MIN !== "0:00" &&
          (!p.COMMENT || !p.COMMENT.toLowerCase().includes("inactive")),
      );
      if (active.length === 0) return null;

      const sum = (key) => active.reduce((s, p) => s + (p[key] || 0), 0);
      const fgm = sum("FGM");
      const fga = sum("FGA");
      const fg3m = sum("FG3M");
      const fg3a = sum("FG3A");
      const ftm = sum("FTM");
      const fta = sum("FTA");

      return {
        PTS: sum("PTS"),
        REB: sum("REB"),
        AST: sum("AST"),
        STL: sum("STL"),
        BLK: sum("BLK"),
        TO: sum("TO"),
        FGM: fgm,
        FGA: fga,
        FG_PCT: fga > 0 ? fgm / fga : 0,
        FG3M: fg3m,
        FG3A: fg3a,
        FG3_PCT: fg3a > 0 ? fg3m / fg3a : 0,
        FTM: ftm,
        FTA: fta,
        FT_PCT: fta > 0 ? ftm / fta : 0,
        OREB: sum("OREB"),
        DREB: sum("DREB"),
        PF: sum("PF"),
      };
    };

    return {
      awayTeamStats: calcTotals(awayPlayers),
      homeTeamStats: calcTotals(homePlayers),
    };
  }, [data, awayTeam, homeTeam, awayPlayers, homePlayers]);

  if (loading) {
    return (
      <div className="game-detail-page">
        <div className="game-loading">
          <div className="loading-spinner" />
          <p>Loading game data...</p>
        </div>
      </div>
    );
  }

  // Determine if this is a pre-game scenario
  const hasLineScore = data && data.line_score && data.line_score.length >= 2;
  const isPreGame =
    data?.pre_game || data?.game_summary?.GAME_STATUS_ID === 1 || !hasLineScore;

  // ─── PRE-GAME VIEW ───
  if (isPreGame && !hasLineScore && preGameTeams) {
    const homeAbbr = preGameTeams.homeAbbr;
    const awayAbbr = preGameTeams.awayAbbr;
    const pHomeColor = TEAM_COLORS[homeAbbr] || "#f472b6";
    const pAwayColor = TEAM_COLORS[awayAbbr] || "#38bdf8";
    const homeRecord =
      preGameTeams.homeWins != null
        ? `${preGameTeams.homeWins}-${preGameTeams.homeLosses}`
        : "";
    const awayRecord =
      preGameTeams.awayWins != null
        ? `${preGameTeams.awayWins}-${preGameTeams.awayLosses}`
        : "";

    return (
      <div className="game-detail-page">
        <div
          className="game-hero"
          style={{
            background: `linear-gradient(135deg, ${pAwayColor}18 0%, #0f172a 50%, ${pHomeColor}18 100%)`,
          }}
        >
          <Link to="/" className="back-link">
            ← Back to Scores
          </Link>

          <div className="scoreboard">
            <div className="scoreboard-team">
              <img
                src={getTeamLogo(preGameTeams.awayId)}
                alt={awayAbbr}
                className="scoreboard-logo"
              />
              <div className="scoreboard-team-info">
                <span className="scoreboard-city">{preGameTeams.awayCity}</span>
                <span className="scoreboard-name" style={{ color: pAwayColor }}>
                  {preGameTeams.awayName}
                </span>
                {awayRecord && (
                  <span className="scoreboard-record">{awayRecord}</span>
                )}
              </div>
              <span className="scoreboard-score" style={{ color: pAwayColor }}>
                —
              </span>
            </div>

            <div className="scoreboard-status">
              <span className="status-badge status-scheduled">Scheduled</span>
              {preGameTeams.gameStatusText && (
                <span className="game-time-text">
                  {preGameTeams.gameStatusText}
                </span>
              )}
            </div>

            <div className="scoreboard-team scoreboard-team-home">
              <span className="scoreboard-score" style={{ color: pHomeColor }}>
                —
              </span>
              <div className="scoreboard-team-info scoreboard-team-info-right">
                <span className="scoreboard-city">{preGameTeams.homeCity}</span>
                <span className="scoreboard-name" style={{ color: pHomeColor }}>
                  {preGameTeams.homeName}
                </span>
                {homeRecord && (
                  <span className="scoreboard-record">{homeRecord}</span>
                )}
              </div>
              <img
                src={getTeamLogo(preGameTeams.homeId)}
                alt={homeAbbr}
                className="scoreboard-logo"
              />
            </div>
          </div>
        </div>

        {/* Tabs — Predict only for pre-game */}
        <div className="game-tabs">
          <button className="game-tab active">Predict</button>
        </div>

        {/* SwishPredict Content */}
        <div className="game-content">
          <SwishPredict homeAbbr={homeAbbr} awayAbbr={awayAbbr} />
        </div>
      </div>
    );
  }

  // ─── PRE-GAME but no live_scores data yet (fallback) ───
  if (isPreGame && !hasLineScore) {
    return (
      <div className="game-detail-page">
        <div className="game-error">
          <p>Game hasn't started yet. Prediction data loading...</p>
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ─── STANDARD VIEW (live / final) ───
  if (!awayTeam || !homeTeam) {
    return (
      <div className="game-detail-page">
        <div className="game-error">
          <p>{error || "No data available for this game."}</p>
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const summary = data.game_summary || {};
  const gameStatus = summary.GAME_STATUS_ID;
  const statusText =
    gameStatus === 3 ? "Final" : gameStatus === 2 ? "LIVE" : "Scheduled";

  const awayRecord =
    getTeamRecord(awayTeam.TEAM_ID) || awayTeam.TEAM_WINS_LOSSES || "";
  const homeRecord =
    getTeamRecord(homeTeam.TEAM_ID) || homeTeam.TEAM_WINS_LOSSES || "";

  const awayPts = awayTeam.PTS ?? 0;
  const homePts = homeTeam.PTS ?? 0;
  const awayWon = gameStatus === 3 && awayPts > homePts;
  const homeWon = gameStatus === 3 && homePts > awayPts;

  const awayFullName = `${awayTeam.TEAM_CITY_NAME} ${awayTeam.TEAM_NICKNAME}`;
  const homeFullName = `${homeTeam.TEAM_CITY_NAME} ${homeTeam.TEAM_NICKNAME}`;

  return (
    <div className="game-detail-page">
      <div
        className="game-hero"
        style={{
          background: `linear-gradient(135deg, ${awayColor}18 0%, #0f172a 50%, ${homeColor}18 100%)`,
        }}
      >
        <Link to="/" className="back-link">
          ← Back to Scores
        </Link>

        <div className="scoreboard">
          <div className={`scoreboard-team ${awayWon ? "winner" : ""}`}>
            <img
              src={getTeamLogo(awayTeam.TEAM_ID)}
              alt={awayTeam.TEAM_ABBREVIATION}
              className="scoreboard-logo"
            />
            <div className="scoreboard-team-info">
              <span className="scoreboard-city">{awayTeam.TEAM_CITY_NAME}</span>
              <span className="scoreboard-name" style={{ color: awayColor }}>
                {awayTeam.TEAM_NICKNAME}
              </span>
              <span className="scoreboard-record">{awayRecord}</span>
            </div>
            <span
              className="scoreboard-score"
              style={{
                color: awayWon
                  ? awayColor
                  : gameStatus === 3
                    ? "#64748b"
                    : awayColor,
              }}
            >
              {awayTeam.PTS ?? "-"}
            </span>
          </div>

          <div className="scoreboard-status">
            <span
              className={`status-badge ${gameStatus === 2 ? "status-live" : gameStatus === 3 ? "status-final" : "status-scheduled"}`}
            >
              {statusText}
            </span>
          </div>

          <div
            className={`scoreboard-team scoreboard-team-home ${homeWon ? "winner" : ""}`}
          >
            <span
              className="scoreboard-score"
              style={{
                color: homeWon
                  ? homeColor
                  : gameStatus === 3
                    ? "#64748b"
                    : homeColor,
              }}
            >
              {homeTeam.PTS ?? "-"}
            </span>
            <div className="scoreboard-team-info scoreboard-team-info-right">
              <span className="scoreboard-city">{homeTeam.TEAM_CITY_NAME}</span>
              <span className="scoreboard-name" style={{ color: homeColor }}>
                {homeTeam.TEAM_NICKNAME}
              </span>
              <span className="scoreboard-record">{homeRecord}</span>
            </div>
            <img
              src={getTeamLogo(homeTeam.TEAM_ID)}
              alt={homeTeam.TEAM_ABBREVIATION}
              className="scoreboard-logo"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="game-tabs">
        <button
          className={`game-tab ${activeTab === "box" ? "active" : ""}`}
          onClick={() => setActiveTab("box")}
        >
          Box Score
        </button>
        <button
          className={`game-tab ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          Comparison
        </button>
        <button
          className={`game-tab ${activeTab === "highlights" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("highlights");
            fetchHighlights(awayTeam.TEAM_NICKNAME, homeTeam.TEAM_NICKNAME);
          }}
        >
          Top Plays
        </button>
      </div>

      {/* Content */}
      <div className="game-content">
        {activeTab === "box" && (
          <div className="box-score-section">
            <TeamBoxScore
              teamName={awayFullName}
              teamAbbr={awayTeam.TEAM_ABBREVIATION}
              teamColor={awayColor}
              players={awayPlayers}
              teamStats={awayTeamStats}
            />
            <TeamBoxScore
              teamName={homeFullName}
              teamAbbr={homeTeam.TEAM_ABBREVIATION}
              teamColor={homeColor}
              players={homePlayers}
              teamStats={homeTeamStats}
            />
          </div>
        )}

        {activeTab === "summary" && awayTeamStats && homeTeamStats && (
          <div className="game-summary-section">
            <div className="team-comparison">
              <div className="comparison-header">
                <span
                  className="comparison-team-label"
                  style={{ color: awayColor }}
                >
                  {awayTeam.TEAM_ABBREVIATION}
                </span>
                <h3>Team Comparison</h3>
                <span
                  className="comparison-team-label"
                  style={{ color: homeColor }}
                >
                  {homeTeam.TEAM_ABBREVIATION}
                </span>
              </div>
              <ComparisonBar
                label="Points"
                awayVal={awayTeamStats.PTS}
                homeVal={homeTeamStats.PTS}
                awayColor={awayColor}
                homeColor={homeColor}
              />
              <ComparisonBar
                label="Rebounds"
                awayVal={awayTeamStats.REB}
                homeVal={homeTeamStats.REB}
                awayColor={awayColor}
                homeColor={homeColor}
              />
              <ComparisonBar
                label="Assists"
                awayVal={awayTeamStats.AST}
                homeVal={homeTeamStats.AST}
                awayColor={awayColor}
                homeColor={homeColor}
              />
              <ComparisonBar
                label="Steals"
                awayVal={awayTeamStats.STL}
                homeVal={homeTeamStats.STL}
                awayColor={awayColor}
                homeColor={homeColor}
              />
              <ComparisonBar
                label="Blocks"
                awayVal={awayTeamStats.BLK}
                homeVal={homeTeamStats.BLK}
                awayColor={awayColor}
                homeColor={homeColor}
              />
              <ComparisonBar
                label="Turnovers"
                awayVal={awayTeamStats.TO}
                homeVal={homeTeamStats.TO}
                awayColor={awayColor}
                homeColor={homeColor}
                lowerIsBetter
              />
              <ComparisonBar
                label="FG%"
                awayVal={(awayTeamStats.FG_PCT * 100).toFixed(1)}
                homeVal={(homeTeamStats.FG_PCT * 100).toFixed(1)}
                awayColor={awayColor}
                homeColor={homeColor}
                suffix="%"
              />
              <ComparisonBar
                label="3P%"
                awayVal={(awayTeamStats.FG3_PCT * 100).toFixed(1)}
                homeVal={(homeTeamStats.FG3_PCT * 100).toFixed(1)}
                awayColor={awayColor}
                homeColor={homeColor}
                suffix="%"
              />
              <ComparisonBar
                label="FT%"
                awayVal={(awayTeamStats.FT_PCT * 100).toFixed(1)}
                homeVal={(homeTeamStats.FT_PCT * 100).toFixed(1)}
                awayColor={awayColor}
                homeColor={homeColor}
                suffix="%"
              />
            </div>
          </div>
        )}

        {activeTab === "highlights" && (
          <div className="highlights-section">
            <h3 className="section-title">Game Clips & Top Plays</h3>

            {activeVideo && (
              <div className="video-player">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className="video-player-info">
                  <h3>{decodeHTML(activeVideo.title)}</h3>
                  <span className="video-channel">{activeVideo.channel}</span>
                </div>
              </div>
            )}

            {highlightsLoading ? (
              <div className="highlights-loading">
                <div className="loading-spinner" />
                <p>Searching for best plays...</p>
              </div>
            ) : highlights.length > 0 ? (
              <div className="highlights-grid">
                {highlights.map((video) => (
                  <button
                    key={video.id}
                    className={`highlight-card ${activeVideo?.id === video.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveVideo(video);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                  >
                    <div className="highlight-thumb-wrapper">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="highlight-thumb"
                      />
                      <div className="highlight-play-icon">▶</div>
                    </div>
                    <div className="highlight-info">
                      <span className="highlight-title">
                        {decodeHTML(video.title)}
                      </span>
                      <span className="highlight-channel">{video.channel}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="no-highlights">
                <p>No clips found for this game.</p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${awayTeam.TEAM_NICKNAME} vs ${homeTeam.TEAM_NICKNAME} best plays clips`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-search-link"
                >
                  Search Clips on YouTube →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Decode HTML entities from YouTube titles
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function TeamBoxScore({ teamName, teamAbbr, teamColor, players, teamStats }) {
  const activePlayers = players.filter(
    (p) =>
      p.MIN &&
      p.MIN !== "PT00M00.00S" &&
      p.MIN !== "0:00" &&
      (!p.COMMENT || !p.COMMENT.toLowerCase().includes("inactive")),
  );
  const inactivePlayers = players.filter(
    (p) =>
      !p.MIN ||
      p.MIN === "PT00M00.00S" ||
      p.MIN === "0:00" ||
      (p.COMMENT && p.COMMENT.toLowerCase().includes("inactive")),
  );

  const starters = activePlayers.filter((p) => p.START_POSITION);
  const bench = activePlayers.filter((p) => !p.START_POSITION);

  const statCols = [
    { key: "MIN", label: "MIN", format: "minutes" },
    { key: "PTS", label: "PTS", highlight: true },
    { key: "REB", label: "REB" },
    { key: "AST", label: "AST" },
    { key: "STL", label: "STL" },
    { key: "BLK", label: "BLK" },
    { key: "FGM", label: "FG", combined: "FGA", format: "made-att" },
    { key: "FG_PCT", label: "FG%", format: "pct" },
    { key: "FG3M", label: "3P", combined: "FG3A", format: "made-att" },
    { key: "FG3_PCT", label: "3P%", format: "pct" },
    { key: "FTM", label: "FT", combined: "FTA", format: "made-att" },
    { key: "FT_PCT", label: "FT%", format: "pct" },
    { key: "OREB", label: "OR" },
    { key: "DREB", label: "DR" },
    { key: "TO", label: "TO" },
    { key: "PF", label: "PF" },
    { key: "PLUS_MINUS", label: "+/-", format: "plusminus" },
  ];

  const formatVal = (player, col) => {
    if (col.format === "minutes") return formatMinutes(player[col.key]);
    if (col.format === "made-att")
      return `${player[col.key] ?? 0}-${player[col.combined] ?? 0}`;
    if (col.format === "pct") {
      const val = player[col.key];
      if (val == null) return "-";
      const pct = val > 1 ? val : val * 100;
      return pct.toFixed(1);
    }
    if (col.format === "plusminus") {
      const val = player[col.key];
      if (val == null) return "-";
      return val > 0 ? `+${val}` : `${val}`;
    }
    return player[col.key] ?? "-";
  };

  const renderPlayerRow = (p) => (
    <tr key={p.PLAYER_ID}>
      <td className="player-name-cell">
        <Link to={`/players/${p.PLAYER_ID}`} className="player-link">
          {p.PLAYER_NAME}
        </Link>
        {p.START_POSITION && (
          <span className="position-tag">{p.START_POSITION}</span>
        )}
      </td>
      {statCols.map((col) => (
        <td
          key={col.key}
          className={`${col.format === "plusminus" ? "plusminus-cell" : ""} ${col.highlight ? "highlight-cell" : ""}`}
        >
          {formatVal(p, col)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="team-box-score">
      <div className="team-box-header" style={{ borderLeftColor: teamColor }}>
        <h3 style={{ color: teamColor }}>{teamName}</h3>
        <span className="team-box-abbr">{teamAbbr}</span>
      </div>
      <div className="box-table-wrapper">
        <table className="box-score-table">
          <thead>
            <tr>
              <th className="player-col">Player</th>
              {statCols.map((col) => (
                <th
                  key={col.key}
                  className={col.highlight ? "highlight-col" : ""}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starters.length > 0 && (
              <>
                <tr className="section-header-row">
                  <td colSpan={statCols.length + 1}>Starters</td>
                </tr>
                {starters.map(renderPlayerRow)}
              </>
            )}
            {bench.length > 0 && (
              <>
                <tr className="section-header-row">
                  <td colSpan={statCols.length + 1}>Bench</td>
                </tr>
                {bench.map(renderPlayerRow)}
              </>
            )}
            {teamStats && (
              <tr className="totals-row">
                <td className="player-name-cell totals-label">Totals</td>
                {statCols.map((col) => {
                  if (col.key === "MIN" || col.key === "PLUS_MINUS") {
                    return <td key={col.key}>-</td>;
                  }
                  return (
                    <td key={col.key}>
                      <strong>{formatVal(teamStats, col)}</strong>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {inactivePlayers.length > 0 && (
        <div className="inactive-list">
          <span className="inactive-label">Inactive: </span>
          {inactivePlayers.map((p, i) => (
            <span key={p.PLAYER_ID} className="inactive-name">
              {p.PLAYER_NAME}
              {i < inactivePlayers.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ComparisonBar({
  label,
  awayVal,
  homeVal,
  awayColor,
  homeColor,
  suffix = "",
  lowerIsBetter = false,
}) {
  const aNum = parseFloat(awayVal) || 0;
  const hNum = parseFloat(homeVal) || 0;
  const max = Math.max(aNum, hNum, 1);
  const awayPct = (aNum / max) * 100;
  const homePct = (hNum / max) * 100;

  const awayWins = lowerIsBetter ? aNum < hNum : aNum > hNum;
  const homeWins = lowerIsBetter ? hNum < aNum : hNum > aNum;

  return (
    <div className="comparison-row">
      <span
        className={`comp-val comp-val-left ${awayWins ? "comp-winner" : ""}`}
        style={{ color: awayWins ? awayColor : "#475569" }}
      >
        {awayVal}
        {suffix}
      </span>
      <div className="comp-bar-section">
        <div className="comp-bars">
          <div
            className="comp-bar comp-bar-left"
            style={{
              width: `${awayPct}%`,
              backgroundColor: awayWins ? awayColor : `${awayColor}30`,
            }}
          />
        </div>
        <span className="comp-label">{label}</span>
        <div className="comp-bars">
          <div
            className="comp-bar comp-bar-right"
            style={{
              width: `${homePct}%`,
              backgroundColor: homeWins ? homeColor : `${homeColor}30`,
            }}
          />
        </div>
      </div>
      <span
        className={`comp-val comp-val-right ${homeWins ? "comp-winner" : ""}`}
        style={{ color: homeWins ? homeColor : "#475569" }}
      >
        {homeVal}
        {suffix}
      </span>
    </div>
  );
}
