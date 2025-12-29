// src/scripts/buildTeams.js
import { mkdir, writeFile } from "fs/promises";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve("server/.env"),
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const API_KEY = process.env.SR_KEY;
if (!API_KEY) {
  console.error("Missing SR_KEY in environment (server/.env)");
  process.exit(1);
}

const ACCESS = "trial";
const BASE = `https://api.sportradar.com/nba/${ACCESS}/v8/en`;

// tune these if you hit 429s
const TEAM_DELAY_MS = 7000;
const PLAYER_DELAY_MS = 3000;

// -------- helpers --------

async function fetchJSON(url) {
  const res = await fetch(url);
  const ct = res.headers.get("content-type") || "";

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Upstream ${res.status} ${res.statusText}\n${text.slice(0, 300)}...`
    );
  }

  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON but got ${ct}\n${text.slice(0, 200)}...`);
  }

  return res.json();
}

async function saveJSON(filename, data) {
  const outPath = path.join(process.cwd(), "src", "data", filename);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Wrote ${data.length} entries to ${outPath}`);
}

async function fetchTeams() {
  const url = `${BASE}/league/hierarchy.json?api_key=${API_KEY}`;
  console.log("GET", url);

  const { conferences } = await fetchJSON(url);
  if (!conferences) {
    console.log("No conferences in response");
    return [];
  }

  const teams = conferences.flatMap((c) => c.divisions.flatMap((d) => d.teams));
  console.log(`Found ${teams.length} teams`);
  return teams;
}

// extract stats & nbaRef from player profile (like your old mapPlayerDetails)
function extractStatsFromPlayerProfile(api) {
  const season = api?.seasons?.[0];
  const teamStats = season?.teams?.[0];
  const avg = teamStats?.average || teamStats?.total || {};

  const nbaRef =
    api.reference ||
    api.references?.find((r) => r.scope === "NBA" && r.id_type === "external")
      ?.source_id;

  return {
    nbaRef,
    ppg: avg.points ?? null,
    rpg: avg.rebounds ?? null,
    apg: avg.assists ?? null,
    mpg: avg.minutes ?? null,
    spg: avg.steals ?? null,
    bpg: avg.blocks ?? null,
    topg: avg.turnovers ?? null,
    ts: avg.true_shooting_pct ?? null,
    usage: avg.usage_pct ?? null,
    eff: avg.efficiency ?? null,
  };
}

// -------- main builder --------

async function buildTeamsAndPlayers() {
  const teams = await fetchTeams();
  console.log(`Building details for ${teams.length} teams...`);

  const teamResults = [];
  const playersMap = new Map(); // id -> player object (shared with rosters)

  // ---------- PASS 1: teams + base players (no stats) ----------
  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    console.log(
      `\nFetching TEAM profile ${i + 1}/${teams.length}: ${t.market} ${t.name}`
    );

    const profileUrl = `${BASE}/teams/${t.id}/profile.json?api_key=${API_KEY}`;

    let profile;
    try {
      profile = await fetchJSON(profileUrl);
    } catch (err) {
      console.error(`Failed to fetch team ${t.alias}:`, err.message);
      continue;
    }

    // ----- team record from profile -----
    let wins = null;
    let losses = null;

    const season = profile.seasons?.[0];
    const record =
      season?.statistics?.overall?.record ||
      season?.record ||
      season?.teams?.[0]?.record ||
      null;

    if (record) {
      wins = record.wins ?? record.total?.wins ?? null;
      losses = record.losses ?? record.total?.losses ?? null;
    }

    // ----- roster (no stats yet) -----
    const roster = (profile.players || []).map((p) => {
      // reuse existing global player object if we already created one
      let playerObj = playersMap.get(p.id);
      if (!playerObj) {
        playerObj = {
          id: p.id,
          full_name: p.full_name,
          first_name: p.first_name,
          last_name: p.last_name,
          status: p.status,
          position: p.primary_position || p.position,
          jersey_number: p.jersey_number,
          height: p.height,
          weight: p.weight,
          experience: p.experience,
          college: p.college,
          birthdate: p.birthdate,
          birth_place: p.birth_place,
          rookie_year: p.rookie_year,

          team_id: t.id,
          team_name: t.name,
          team_market: t.market,
          team_alias: t.alias,

          injuries: p.injuries || [],
          salary: p.salary,
          reference: p.reference,

          // stats placeholders
          ppg: null,
          rpg: null,
          apg: null,
          mpg: null,
          spg: null,
          bpg: null,
          topg: null,
          ts: null,
          usage: null,
          eff: null,

          nbaId: null,
        };
        playersMap.set(p.id, playerObj);
      }

      return playerObj;
    });

    teamResults.push({
      id: t.id,
      name: t.name,
      market: t.market,
      alias: t.alias,
      sr_id: t.sr_id,
      conference: t.conference || profile.conference?.name || null,
      division: t.division || profile.division?.name || null,
      wins,
      losses,
      roster,
    });

    await wait(TEAM_DELAY_MS);
  }

  // ---------- PASS 2: player profiles -> stats ----------
  const allPlayerIds = Array.from(playersMap.keys());
  console.log(
    `\nFetching PLAYER profiles for ${allPlayerIds.length} players (for stats)...`
  );

  for (let i = 0; i < allPlayerIds.length; i++) {
    const id = allPlayerIds[i];
    const existing = playersMap.get(id);
    if (!existing) continue;

    console.log(
      `Fetching PLAYER profile ${i + 1}/${allPlayerIds.length}: ${
        existing.full_name
      }`
    );

    const url = `${BASE}/players/${id}/profile.json?api_key=${API_KEY}`;

    try {
      const api = await fetchJSON(url);
      const stats = extractStatsFromPlayerProfile(api);

      Object.assign(existing, {
        nbaId: stats.nbaRef || existing.nbaId || existing.reference || null,
        ppg: stats.ppg,
        rpg: stats.rpg,
        apg: stats.apg,
        mpg: stats.mpg,
        spg: stats.spg,
        bpg: stats.bpg,
        topg: stats.topg,
        ts: stats.ts,
        usage: stats.usage,
        eff: stats.eff,
      });
    } catch (err) {
      console.error(`Failed to fetch player ${id}:`, err.message);
    }

    await wait(PLAYER_DELAY_MS);
  }

  const playersArray = Array.from(playersMap.values());

  await saveJSON("teams.json", teamResults);
  await saveJSON("players.json", playersArray);

  console.log("\n✓ Finished building teams.json and players.json");
}

buildTeamsAndPlayers().catch((err) => {
  console.error("❌ buildTeamsAndPlayers failed:", err);
  process.exit(1);
});
