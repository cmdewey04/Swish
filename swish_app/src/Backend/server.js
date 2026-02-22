// Backend/server.js
const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Fix: Go up two levels from src/Backend to reach the root .env
// path.resolve(__dirname) is src/Backend.
// ../ is src, ../../ is the root where your .env sits.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Load the YouTube API Key from the resolved .env file
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Verify connection on startup
console.log("-----------------------------------------");
console.log("Current Directory:", __dirname);
console.log(
  "YouTube API Key status:",
  YOUTUBE_API_KEY ? "✅ Found" : "❌ Not Found",
);
console.log("-----------------------------------------");

// Helper: run a python script in the venv
function runPython(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    // Using python3 to ensure compatibility with Mac venv
    const script = spawn("bash", [
      "-c",
      `cd ${__dirname} && source venv/bin/activate && python3 ${scriptName} ${args.join(" ")}`,
    ]);

    let output = "";
    let error = "";

    script.stdout.on("data", (data) => {
      output += data.toString();
    });

    script.stderr.on("data", (data) => {
      error += data.toString();
      console.error("Python Error:", data.toString());
    });

    script.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Script failed with code ${code}`));
      }
    });
  });
}

// Endpoint to fetch box score for a game (direct CDN fetch, no Python needed)
app.get("/api/boxscore/:gameId", async (req, res) => {
  const { gameId } = req.params;
  console.log(`🏀 Fetching box score for game ${gameId}...`);

  const preGameResponse = {
    success: true,
    data: {
      pre_game: true,
      game_summary: { GAME_STATUS_ID: 1, GAME_ID: gameId },
      line_score: [],
      player_stats: [],
      team_stats: [],
    },
  };

  try {
    const cdnRes = await fetch(
      `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`,
    );

    if (!cdnRes.ok) {
      console.log(`⏳ No box score for game ${gameId} (${cdnRes.status})`);
      return res.json(preGameResponse);
    }

    const { game } = await cdnRes.json();

    // Build player_stats array (uppercase keys for React frontend)
    const player_stats = [];
    for (const teamKey of ["homeTeam", "awayTeam"]) {
      const team = game[teamKey];
      for (const p of team.players || []) {
        const s = p.statistics || {};
        player_stats.push({
          PLAYER_ID: p.personId,
          PLAYER_NAME: `${p.firstName} ${p.familyName}`,
          TEAM_ID: team.teamId,
          TEAM_ABBREVIATION: team.teamTricode,
          START_POSITION: p.position || "",
          COMMENT: p.status || "",
          MIN: s.minutes || "PT00M00.00S",
          PTS: s.points || 0,
          REB: s.reboundsTotal || 0,
          AST: s.assists || 0,
          STL: s.steals || 0,
          BLK: s.blocks || 0,
          FGM: s.fieldGoalsMade || 0,
          FGA: s.fieldGoalsAttempted || 0,
          FG_PCT: s.fieldGoalsPercentage || 0,
          FG3M: s.threePointersMade || 0,
          FG3A: s.threePointersAttempted || 0,
          FG3_PCT: s.threePointersPercentage || 0,
          FTM: s.freeThrowsMade || 0,
          FTA: s.freeThrowsAttempted || 0,
          FT_PCT: s.freeThrowsPercentage || 0,
          OREB: s.reboundsOffensive || 0,
          DREB: s.reboundsDefensive || 0,
          TO: s.turnovers || 0,
          PF: s.foulsPersonal || 0,
          PLUS_MINUS: s.plusMinusPoints || 0,
        });
      }
    }

    // Build line_score (away first [0], home second [1])
    const line_score = ["awayTeam", "homeTeam"].map((key) => {
      const t = game[key];
      const ts = t.statistics || {};
      return {
        TEAM_ID: t.teamId,
        TEAM_ABBREVIATION: t.teamTricode,
        TEAM_CITY_NAME: t.teamCity,
        TEAM_NICKNAME: t.teamName,
        PTS: ts.points || t.score || 0,
        TEAM_WINS_LOSSES: `${t.wins || 0}-${t.losses || 0}`,
      };
    });

    const statusId =
      game.gameStatus === 3 ? 3 : game.gameStatus === 2 ? 2 : 1;

    res.json({
      success: true,
      data: {
        player_stats,
        line_score,
        game_summary: { GAME_STATUS_ID: statusId, GAME_ID: gameId },
        team_stats: [],
      },
    });
  } catch (err) {
    console.error("❌ Box score failed:", err.message);
    res.json(preGameResponse);
  }
});

// Endpoint to search YouTube for game highlights
app.get("/api/highlights", async (req, res) => {
  const { q, date } = req.query;

  if (!YOUTUBE_API_KEY) {
    console.log("⚠️ YouTube Search Skipped: No API Key found in .env");
    return res.json({ success: true, videos: [] });
  }

  try {
    // Build a date-specific query for better results
    const gameDate = date || new Date().toISOString().split("T")[0]; // "2026-02-12"
    const dateObj = new Date(gameDate + "T00:00:00Z");

    // publishedAfter: start of game day (catches same-day uploads)
    const publishedAfter = new Date(dateObj);
    publishedAfter.setDate(publishedAfter.getDate() - 1);

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q + " highlights " + gameDate);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "8");
    url.searchParams.set("order", "relevance");
    url.searchParams.set("publishedAfter", publishedAfter.toISOString());
    url.searchParams.set("key", YOUTUBE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      console.error("❌ YouTube API Error:", data.error.message);
      return res
        .status(500)
        .json({ success: false, error: data.error.message });
    }

    // Filter out shorts and irrelevant videos
    const videos = (data.items || [])
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url,
        channel: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }))
      .filter((v) => {
        const title = v.title.toLowerCase();
        // Filter out reaction videos, 2K, shorts-style content
        const junk = [
          "reaction",
          "2k",
          "nba 2k",
          "rating",
          "guessing",
          "scared",
        ];
        return !junk.some((word) => title.includes(word));
      });

    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve player data
app.get("/api/players", (_req, res) => {
  const playersPath = path.join(__dirname, "data/players.json");
  res.sendFile(playersPath);
});

// Serve predictions data
app.get("/api/predictions", (_req, res) => {
  const predictionsPath = path.join(__dirname, "data/predictions.json");
  res.sendFile(predictionsPath, (err) => {
    if (err) {
      res.status(404).json({ success: false, error: "No predictions available yet" });
    }
  });
});

// Proxy for NBA live scores (avoids CORS on client)
app.get("/api/scores", async (req, res) => {
  try {
    const response = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
    );
    const data = await response.json();
    const scoreboard = data.scoreboard;

    // Write to public/data/live_scores.json so GameDetail pre-game view works
    const games = (scoreboard?.games || []).map((game) => ({
      game_id: game.gameId,
      game_status: game.gameStatus,
      game_status_text: game.gameStatusText,
      period: game.period,
      game_clock: game.gameClock,
      home_team: {
        team_id: game.homeTeam?.teamId,
        team_name: game.homeTeam?.teamName,
        team_city: game.homeTeam?.teamCity,
        team_tricode: game.homeTeam?.teamTricode,
        score: game.homeTeam?.score,
        wins: game.homeTeam?.wins,
        losses: game.homeTeam?.losses,
      },
      away_team: {
        team_id: game.awayTeam?.teamId,
        team_name: game.awayTeam?.teamName,
        team_city: game.awayTeam?.teamCity,
        team_tricode: game.awayTeam?.teamTricode,
        score: game.awayTeam?.score,
        wins: game.awayTeam?.wins,
        losses: game.awayTeam?.losses,
      },
    }));

    const liveScores = {
      last_updated: new Date().toISOString(),
      games,
    };

    const publicDataDir = path.resolve(__dirname, "../../public/data");
    fs.mkdirSync(publicDataDir, { recursive: true });
    fs.writeFileSync(
      path.join(publicDataDir, "live_scores.json"),
      JSON.stringify(liveScores, null, 2),
    );

    res.json({ success: true, data: scoreboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/refresh-teams", async (req, res) => {
  try {
    const output = await runPython("buildTeams.py", ["--merge"]);
    res.json({ success: true, message: "Teams updated", output });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
