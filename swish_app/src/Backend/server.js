// Backend/server.js
const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
const path = require("path");

// Fix: Go up two levels from src/Backend to reach the root .env
// path.resolve(__dirname) is src/Backend.
// ../ is src, ../../ is the root where your .env sits.
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = 3001;

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

// Endpoint to fetch box score for a game
app.get("/api/boxscore/:gameId", async (req, res) => {
  const { gameId } = req.params;
  console.log(`🏀 Fetching box score for game ${gameId}...`);

  try {
    const output = await runPython("fetch_box_score.py", [gameId]);

    // Ignore python warnings/logs by finding the first JSON bracket
    const jsonStart = output.indexOf("{");
    if (jsonStart === -1) {
      // No JSON returned — likely a pre-game with no box score data yet
      console.log(
        `⏳ No box score data for game ${gameId} (likely hasn't started)`,
      );
      return res.json({
        success: true,
        data: {
          pre_game: true,
          game_summary: { GAME_STATUS_ID: 1, GAME_ID: gameId },
          line_score: [],
          player_stats: [],
          team_stats: [],
        },
      });
    }

    const cleanOutput = output.substring(jsonStart);

    let parsed;
    try {
      parsed = JSON.parse(cleanOutput);
    } catch (parseErr) {
      // JSON parse failed — also likely pre-game or bad response
      console.log(
        `⚠️ JSON parse failed for game ${gameId}: ${parseErr.message}`,
      );
      return res.json({
        success: true,
        data: {
          pre_game: true,
          game_summary: { GAME_STATUS_ID: 1, GAME_ID: gameId },
          line_score: [],
          player_stats: [],
          team_stats: [],
        },
      });
    }

    res.json(
      parsed.success !== undefined ? parsed : { success: true, data: parsed },
    );
  } catch (err) {
    console.error("❌ Box score failed:", err.message);

    // Check if error suggests game hasn't started
    if (
      err.message.includes("Expecting value") ||
      err.message.includes("No JSON") ||
      err.message.includes("empty")
    ) {
      return res.json({
        success: true,
        data: {
          pre_game: true,
          game_summary: { GAME_STATUS_ID: 1, GAME_ID: gameId },
          line_score: [],
          player_stats: [],
          team_stats: [],
        },
      });
    }

    res.status(500).json({ success: false, error: err.message });
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

// Other endpoints (refresh-scores, refresh-teams)
app.post("/api/refresh-scores", async (req, res) => {
  try {
    const output = await runPython("fetch_live_data.py");
    res.json({ success: true, message: "Scores updated", output });
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
