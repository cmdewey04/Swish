// server/server.js
import "dotenv/config"; // <— make sure .env is loaded
import express from "express";
import fetch from "node-fetch";
import Fuse from "fuse.js";

const app = express();
const PORT = 3000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// IMPORTANT: make sure .env has SR_KEY=your_key (no quotes)
const API_KEY = process.env.SR_KEY;
if (!API_KEY) {
  console.error("Missing SR_KEY. Add SR_KEY to server/.env (no quotes).");
  process.exit(1);
}

// Use the correct access level you actually have: trial | production | sandbox, etc.
const ACCESS = "trial"; // change if your account is different
const BASE = `https://api.sportradar.com/nba/${ACCESS}/v8/en`;

let playersIndex = [];
let fuse;
const playerCache = new Map();

async function fetchJSON(url) {
  const res = await fetch(url, { redirect: "follow" });
  const ct = res.headers.get("content-type") || "";

  if (!res.ok) {
    const text = await res.text(); // log body for debugging (often HTML error)
    throw new Error(
      `Upstream ${res.status} ${res.statusText}\n${text.slice(0, 300)}...`
    );
  }
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got content-type: ${ct}\n${text.slice(0, 300)}...`
    );
  }
  return res.json();
}

async function buildIndex() {
  const teamsURL = `${BASE}/league/hierarchy.json?api_key=${API_KEY}`;
  console.log("GET", teamsURL);

  const { conferences } = await fetchJSON(teamsURL);
  const teams = conferences.flatMap((c) => c.divisions.flatMap((d) => d.teams));

  console.log(`Found ${teams.length} teams`);

  let rosterList = [];

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const url = `${BASE}/teams/${team.id}/profile.json?api_key=${API_KEY}`;

    console.log(`Fetching team ${i + 1}/${teams.length}: ${team.name}`);

    try {
      const data = await fetchJSON(url);
      const players = (data.players || []).map((p) => ({
        player_id: p.id,
        full_name: p.full_name,
        team_id: team.id,
        team_name: team.name,
      }));
      rosterList.push(...players);
    } catch (err) {
      console.error(`Failed fetching ${team.name}:`, err.message);
    }
    await wait(1000);
  }

  playersIndex = rosterList;
  fuse = new Fuse(playersIndex, {
    keys: ["full_name", "team_name"],
    threshold: 0.3,
  });

  console.log(`Indexed ${playersIndex.length} players`);
}

app.get("/api/search/players", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  const results = fuse
    .search(q)
    .slice(0, 10)
    .map((r) => r.item);
  res.json(results);
});

app.get("/api/players/:id", async (req, res) => {
  const { id } = req.params; // ✅ pull id from params

  if (playerCache.has(id)) {
    console.log("   ↳ served from cache");
    return res.json(playerCache.get(id));
  }

  console.log("➡️  /api/players/:id", id, "→ cache MISS, calling upstream");
  const url = `${BASE}/players/${id}/profile.json?api_key=${API_KEY}`;

  try {
    const data = await fetchJSON(url);
    playerCache.set(id, data);
    return res.json(data);
  } catch (err) {
    console.error("❌ Error in /api/players/:id:", err.message);
    return res.status(500).json({
      error: "Failed to fetch player details",
      message: err.message,
    });
  }
});

buildIndex()
  .then(() =>
    app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`))
  )
  .catch((err) => {
    console.error("Failed to build index:", err);
    process.exit(1);
  });
