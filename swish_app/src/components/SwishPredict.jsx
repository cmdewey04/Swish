// src/components/SwishPredict.jsx
import React, { useState, useEffect, useMemo } from "react";
import { TEAM_COLORS } from "../constants/teamColors";
import "../css/SwishPredict.css";

// Team abbreviation to full name mapping for matching predictions.json
const ABBR_TO_FULL = {
  ATL: "Atlanta Hawks",
  BOS: "Boston Celtics",
  BKN: "Brooklyn Nets",
  CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls",
  CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks",
  DEN: "Denver Nuggets",
  DET: "Detroit Pistons",
  GSW: "Golden State Warriors",
  HOU: "Houston Rockets",
  IND: "Indiana Pacers",
  LAC: "LA Clippers",
  LAL: "Los Angeles Lakers",
  MEM: "Memphis Grizzlies",
  MIA: "Miami Heat",
  MIL: "Milwaukee Bucks",
  MIN: "Minnesota Timberwolves",
  NOP: "New Orleans Pelicans",
  NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic",
  PHI: "Philadelphia 76ers",
  PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers",
  SAC: "Sacramento Kings",
  SAS: "San Antonio Spurs",
  TOR: "Toronto Raptors",
  UTA: "Utah Jazz",
  WAS: "Washington Wizards",
};

// Clean doubled player names from CBS scrape: "C. FlaggCooper Flagg" → "Cooper Flagg"
function cleanPlayerName(raw) {
  if (!raw) return "Unknown";
  // Pattern: abbreviated name immediately followed by full name
  // e.g. "S. Gilgeous-AlexanderShai Gilgeous-Alexander"
  const match = raw.match(/^[A-Z]\.\s*[\w'-]+(.+)$/);
  if (match) {
    // Try to find where the full name starts (capital letter after the abbreviated part)
    const idx = raw.search(/[a-z][A-Z]/);
    if (idx > 0) {
      return raw.slice(idx + 1);
    }
  }
  return raw;
}

// Format status from CBS dates to readable status
function formatStatus(status) {
  if (!status) return "Out";
  const lower = status.toLowerCase();
  if (lower.includes("out")) return "Out";
  if (lower.includes("expected")) return "Out";
  if (lower.includes("game")) return "GTD";
  //if (lower.includes("doubtful")) return "Doubtful";
  //if (lower.includes("questionable")) return "Questionable";
  //if (lower.includes("probable")) return "Probable";
  //if (lower.includes("day-to-day")) return "Day-to-Day";
  //   // CBS returns dates like "Thu, Feb 12" — means game-time decision / day-to-day
  //   if (/^(mon|tue|wed|thu|fri|sat|sun)/i.test(status)) {
  //     // If the date is today or very recent, likely GTD
  //     return "GTD";
  //   }
  return status;
}

// SVG Donut Chart
function PredictionDonut({
  homeProb,
  awayProb,
  homeColor,
  awayColor,
  homeLogo,
  awayLogo,
}) {
  const size = 220;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const homeArc = circumference * homeProb;
  const awayArc = circumference * awayProb;
  const gapSize = 4;

  return (
    <div className="predict-donut-container">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="predict-donut-svg"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Home team arc (right side, clockwise from top) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={homeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${homeArc - gapSize} ${circumference - homeArc + gapSize}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          className="predict-arc predict-arc-home"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
        {/* Away team arc (left side) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={awayColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${awayArc - gapSize} ${circumference - awayArc + gapSize}`}
          strokeDashoffset={-(homeArc + gapSize)}
          strokeLinecap="round"
          className="predict-arc predict-arc-away"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </svg>
      {/* Team logos in center */}
      <div className="predict-donut-center">
        <img
          src={awayLogo}
          alt="Away"
          className="predict-center-logo predict-center-away"
        />
        <div className="predict-center-divider" />
        <img
          src={homeLogo}
          alt="Home"
          className="predict-center-logo predict-center-home"
        />
      </div>
    </div>
  );
}

export default function SwishPredict({ homeAbbr, awayAbbr }) {
  const [prediction, setPrediction] = useState(null);
  const [allPredictions, setAllPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const homeColor = TEAM_COLORS[homeAbbr] || "#38bdf8";
  const awayColor = TEAM_COLORS[awayAbbr] || "#f472b6";

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const res = await fetch(`/data/predict.json?t=${timestamp}`);
        if (!res.ok) throw new Error("Predictions not available");
        const data = await res.json();
        setAllPredictions(data);

        // Find matching game
        const game = data.games?.find(
          (g) => g.home_abbr === homeAbbr && g.away_abbr === awayAbbr,
        );

        if (!game) {
          // Try matching by full team name
          const homeFull = ABBR_TO_FULL[homeAbbr];
          const awayFull = ABBR_TO_FULL[awayAbbr];
          const gameByName = data.games?.find(
            (g) => g.home_team === homeFull && g.away_team === awayFull,
          );
          setPrediction(gameByName || null);
        } else {
          setPrediction(game);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load predictions:", err);
        setError("Prediction data not available");
        setLoading(false);
      }
    };

    loadPredictions();
  }, [homeAbbr, awayAbbr]);

  // Separate injuries by team
  const { homeInjuries, awayInjuries } = useMemo(() => {
    if (!prediction?.injuries) return { homeInjuries: [], awayInjuries: [] };
    return {
      homeInjuries: prediction.injuries
        .filter((inj) => inj.team === homeAbbr)
        .sort((a, b) => b.importance - a.importance),
      awayInjuries: prediction.injuries
        .filter((inj) => inj.team === awayAbbr)
        .sort((a, b) => b.importance - a.importance),
    };
  }, [prediction, homeAbbr, awayAbbr]);

  if (loading) {
    return (
      <div className="predict-section">
        <div className="predict-loading">
          <div className="predict-loading-pulse" />
          <span>Loading prediction model...</span>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="predict-section">
        <div className="predict-unavailable">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#475569"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p>No prediction available for this matchup</p>
          <span className="predict-unavailable-sub">
            Predictions are generated daily for scheduled games
          </span>
        </div>
      </div>
    );
  }

  const homeProb = prediction.home_win_prob;
  const awayProb = prediction.away_win_prob;
  const homePct = (homeProb * 100).toFixed(1);
  const awayPct = (awayProb * 100).toFixed(1);
  const homeFavored = homeProb >= awayProb;

  // Use simpler ESPN-style CDN URLs that work with abbreviations
  const getLogoByAbbr = (abbr) => {
    if (!abbr) return "";

    // You need to RETURN the result of the ternary operator
    return abbr.toUpperCase() === "UTA"
      ? `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/utah.png&h=100&w=100`
      : `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nba/500/${abbr.toLowerCase()}.png&h=100&w=100`;
  };

  const injuryAdj = prediction.injury_adjustment;
  const hasInjuryImpact = Math.abs(injuryAdj) > 0.001;

  return (
    <div className="predict-section">
      {/* Main Predictor Card */}
      <div className="predict-card">
        <div className="predict-header">
          <div className="predict-title-row">
            <svg
              className="predict-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <h3 className="predict-title">Swish Predictor</h3>
          </div>
          <span className="predict-badge">AI Model</span>
        </div>

        {/* Donut + Percentages */}
        <div className="predict-visual">
          {/* Away percentage */}
          <div className="predict-team-pct predict-team-pct-left">
            <span
              className={`predict-pct-value ${!homeFavored ? "predict-pct-favored" : ""}`}
              style={{ color: awayColor }}
            >
              {awayPct}%
            </span>
            <div className="predict-pct-team">
              <span className="predict-pct-abbr" style={{ color: awayColor }}>
                {awayAbbr}
              </span>
              <div
                className="predict-pct-swatch"
                style={{ backgroundColor: awayColor, opacity: 0.6 }}
              />
            </div>
          </div>

          {/* Donut */}
          <PredictionDonut
            homeProb={homeProb}
            awayProb={awayProb}
            homeColor={homeColor}
            awayColor={awayColor}
            homeLogo={getLogoByAbbr(homeAbbr)}
            awayLogo={getLogoByAbbr(awayAbbr)}
          />

          {/* Home percentage */}
          <div className="predict-team-pct predict-team-pct-right">
            <span
              className={`predict-pct-value ${homeFavored ? "predict-pct-favored" : ""}`}
              style={{ color: homeColor }}
            >
              {homePct}%
            </span>
            <div className="predict-pct-team">
              <span className="predict-pct-abbr" style={{ color: homeColor }}>
                {homeAbbr}
              </span>
              <div
                className="predict-pct-swatch"
                style={{ backgroundColor: homeColor }}
              />
            </div>
          </div>
        </div>

        <p className="predict-source">According to Swish Analytics</p>

        {/* Model factors */}
        <div className="predict-factors">
          <div className="predict-factor">
            <span className="predict-factor-label">Rest</span>
            <span className="predict-factor-value">
              {prediction.home_rest}d / {prediction.away_rest}d
            </span>
          </div>
          {hasInjuryImpact && (
            <div className="predict-factor">
              <span className="predict-factor-label">Injury Impact</span>
              <span
                className="predict-factor-value"
                style={{
                  color:
                    injuryAdj > 0
                      ? homeColor
                      : injuryAdj < 0
                        ? awayColor
                        : "#94a3b8",
                }}
              >
                {injuryAdj > 0 ? "+" : ""}
                {(injuryAdj * 100).toFixed(1)}%{" "}
                {injuryAdj > 0 ? homeAbbr : awayAbbr}
              </span>
            </div>
          )}
          <div className="predict-factor">
            <span className="predict-factor-label">Model Accuracy</span>
            <span className="predict-factor-value">
              {allPredictions?.model_accuracy || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Injury Report */}
      {(homeInjuries.length > 0 || awayInjuries.length > 0) && (
        <div className="predict-injuries-card">
          <h4 className="predict-injuries-title">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v8m0 4v8M8 6h8M8 18h8" />
            </svg>
            Injury Report
          </h4>

          {awayInjuries.length > 0 && (
            <div className="predict-injury-team">
              <div
                className="predict-injury-team-header"
                style={{ borderColor: awayColor }}
              >
                <span style={{ color: awayColor }}>{awayAbbr}</span>
                <span className="predict-injury-score">
                  Impact: {prediction.away_injury_score?.toFixed(1)}
                </span>
              </div>
              <div className="predict-injury-list">
                {awayInjuries.map((inj, i) => (
                  <div key={i} className="predict-injury-row">
                    <span className="predict-injury-name">
                      {cleanPlayerName(inj.player)}
                    </span>
                    <span
                      className={`predict-injury-status predict-status-${formatStatus(
                        inj.status,
                      )
                        .toLowerCase()
                        .replace(/[^a-z]/g, "")}`}
                    >
                      {formatStatus(inj.status)}
                    </span>
                    <span className="predict-injury-importance">
                      {inj.importance?.toFixed(0)} IMP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {homeInjuries.length > 0 && (
            <div className="predict-injury-team">
              <div
                className="predict-injury-team-header"
                style={{ borderColor: homeColor }}
              >
                <span style={{ color: homeColor }}>{homeAbbr}</span>
                <span className="predict-injury-score">
                  Impact: {prediction.home_injury_score?.toFixed(1)}
                </span>
              </div>
              <div className="predict-injury-list">
                {homeInjuries.map((inj, i) => (
                  <div key={i} className="predict-injury-row">
                    <span className="predict-injury-name">
                      {cleanPlayerName(inj.player)}
                    </span>
                    <span
                      className={`predict-injury-status predict-status-${formatStatus(
                        inj.status,
                      )
                        .toLowerCase()
                        .replace(/[^a-z]/g, "")}`}
                    >
                      {formatStatus(inj.status)}
                    </span>
                    <span className="predict-injury-importance">
                      {inj.importance?.toFixed(0)} IMP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="predict-injury-footnote">
            IMP = Player importance score (PTS + REB + AST per game)
          </p>
        </div>
      )}
    </div>
  );
}
