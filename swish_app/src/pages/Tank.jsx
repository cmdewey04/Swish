// src/pages/Tankathon.jsx
import { useState, useEffect } from "react";
import { ReloadIcon, RocketIcon } from "@radix-ui/react-icons";
import TEAMS from "../Backend/data/teams.json";
import "../css/Tank.css";

// NBA Draft Lottery odds (official 2024-25 season format)
// pickOdds[i] = probability of getting the (i+1)th pick
const LOTTERY_ODDS = [
  {
    rank: 1,
    pickOdds: [14.0, 13.4, 12.7, 12.0, 47.9, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    top4: 52.1,
    num1: 14.0,
  },
  {
    rank: 2,
    pickOdds: [14.0, 13.4, 12.7, 12.0, 27.8, 20.0, 0, 0, 0, 0, 0, 0, 0, 0],
    top4: 52.1,
    num1: 14.0,
  },
  {
    rank: 3,
    pickOdds: [14.0, 13.4, 12.7, 12.0, 14.8, 26.0, 7.0, 0, 0, 0, 0, 0, 0, 0],
    top4: 52.1,
    num1: 14.0,
  },
  {
    rank: 4,
    pickOdds: [12.5, 12.2, 11.9, 11.5, 7.2, 25.7, 16.7, 2.2, 0, 0, 0, 0, 0, 0],
    top4: 48.1,
    num1: 12.5,
  },
  {
    rank: 5,
    pickOdds: [
      10.5, 10.5, 10.6, 10.5, 2.2, 19.6, 26.7, 8.7, 0.6, 0, 0, 0, 0, 0,
    ],
    top4: 42.1,
    num1: 10.5,
  },
  {
    rank: 6,
    pickOdds: [9.0, 9.2, 9.4, 9.6, 0, 8.6, 29.8, 20.5, 3.7, 0.1, 0, 0, 0, 0],
    top4: 37.2,
    num1: 9.0,
  },
  {
    rank: 7,
    pickOdds: [7.5, 7.8, 8.1, 8.5, 0, 0, 19.7, 34.1, 12.9, 1.3, 0, 0, 0, 0],
    top4: 31.9,
    num1: 7.5,
  },
  {
    rank: 8,
    pickOdds: [6.0, 6.3, 6.7, 7.2, 0, 0, 0, 34.5, 32.1, 6.7, 0.4, 0, 0, 0],
    top4: 26.2,
    num1: 6.0,
  },
  {
    rank: 9,
    pickOdds: [4.5, 4.8, 5.2, 5.7, 0, 0, 0, 0, 50.7, 25.9, 3.0, 0.1, 0, 0],
    top4: 20.2,
    num1: 4.5,
  },
  {
    rank: 10,
    pickOdds: [3.0, 3.3, 3.6, 4.0, 0, 0, 0, 0, 0, 65.9, 19.0, 1.2, 0, 0],
    top4: 13.9,
    num1: 3.0,
  },
  {
    rank: 11,
    pickOdds: [2.0, 2.2, 2.4, 2.8, 0, 0, 0, 0, 0, 0, 77.6, 12.6, 0.4, 0],
    top4: 9.4,
    num1: 2.0,
  },
  {
    rank: 12,
    pickOdds: [1.5, 1.7, 1.9, 2.1, 0, 0, 0, 0, 0, 0, 0, 86.1, 6.7, 0.1],
    top4: 7.2,
    num1: 1.5,
  },
  {
    rank: 13,
    pickOdds: [1.0, 1.1, 1.2, 1.4, 0, 0, 0, 0, 0, 0, 0, 0, 92.9, 2.3],
    top4: 4.7,
    num1: 1.0,
  },
  {
    rank: 14,
    pickOdds: [0.5, 0.6, 0.6, 0.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97.6],
    top4: 2.4,
    num1: 0.5,
  },
];

const Tankathon = () => {
  const [standings, setStandings] = useState([]);
  const [lotteryResults, setLotteryResults] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadStandings();
  }, []);

  const calculateGamesBack = (teams) => {
    // GB is calculated from the first team (worst record, best odds)
    // We assume teams is already sorted by Win% ascending
    const topTeam = teams[0];

    return teams.map((team, index) => {
      // The "leader" of the tank is 0 Games Back
      if (index === 0) {
        return { ...team, gamesBack: "-" };
      }

      // TANK FORMULA: Calculate how many games "better" this team is than the tanker.
      // We want positive numbers for teams with BETTER records.
      // Formula: ((Team_Wins - Tank_Wins) + (Tank_Losses - Team_Losses)) / 2

      const winDiff = team.wins - topTeam.wins; // Team has MORE wins (positive diff)
      const lossDiff = topTeam.losses - team.losses; // Team has FEWER losses (positive diff)

      const gb = (winDiff + lossDiff) / 2;

      return {
        ...team,
        gamesBack: gb === 0 ? "-" : gb.toFixed(1),
      };
    });
  };

  const loadStandings = () => {
    // Sort teams by wins (ascending) for tank standings
    const sortedTeams = [...TEAMS]
      .filter((team) => team.wins !== undefined && team.losses !== undefined)
      .sort((a, b) => {
        const aWinPct = a.wins / (a.wins + a.losses);
        const bWinPct = b.wins / (b.wins + b.losses);
        if (aWinPct !== bWinPct) return aWinPct - bWinPct;
        return a.wins - b.wins;
      })
      .slice(0, 14);

    const withOdds = sortedTeams.map((team, index) => {
      const odds = LOTTERY_ODDS[index];

      return {
        ...team,
        lotteryRank: index + 1,
        top4Odds: odds.top4,
        num1Odds: odds.num1,
        pickOdds: odds.pickOdds,
      };
    });

    // Calculate GB from the top team
    const withGB = calculateGamesBack(withOdds);

    setStandings(withGB);
  };

  const simulateLottery = () => {
    setSimulating(true);

    setTimeout(() => {
      const results = runLotterySimulation(standings);
      setLotteryResults(results);
      setSimulating(false);
    }, 2000);
  };

  const runLotterySimulation = (teams) => {
    // 1. Create a pool of eligible teams
    let availableTeams = [...teams];
    let finalDraftOrder = [];

    // --- PHASE 1: The Lottery (Picks 1-4) ---
    // We only roll the dice 4 times.
    for (let pickNum = 1; pickNum <= 4; pickNum++) {
      // Calculate total odds for the remaining teams
      const totalWeight = availableTeams.reduce(
        (sum, team) => sum + team.num1Odds,
        0,
      );
      let randomValue = Math.random() * totalWeight;
      let selectedIndex = -1;

      // Weighted random draw
      for (let i = 0; i < availableTeams.length; i++) {
        randomValue -= availableTeams[i].num1Odds;
        if (randomValue <= 0) {
          selectedIndex = i;
          break;
        }
      }

      // Fallback for rounding errors
      if (selectedIndex === -1) selectedIndex = availableTeams.length - 1;

      // Assign the pick
      const winner = { ...availableTeams[selectedIndex] };
      winner.draftPick = pickNum;
      finalDraftOrder.push(winner);

      // Remove winner from pool
      availableTeams.splice(selectedIndex, 1);
    }

    // --- PHASE 2: The Standings (Picks 5-14) ---
    // No more dice rolls. The remaining teams are ordered strictly by their original rank (worst record first).
    // Note: 'teams' was already sorted by record in loadStandings(),
    // so 'availableTeams' preserves that order naturally.

    availableTeams.forEach((team, index) => {
      // The first available team (worst record left) gets Pick 5, next gets 6, etc.
      const assignedTeam = { ...team };
      assignedTeam.draftPick = 5 + index;
      finalDraftOrder.push(assignedTeam);
    });

    return finalDraftOrder.sort((a, b) => a.draftPick - b.draftPick);
  };

  const resetLottery = () => {
    setLotteryResults(null);
  };

  return (
    <div className="tankathon-page">
      {/* Header */}
      <div className="tankathon-header">
        <div className="tankathon-header-content">
          <h1 className="tankathon-title">
            <RocketIcon width={32} height={32} />
            2025-26 NBA Draft Lottery Simulator
          </h1>
          <p className="tankathon-subtitle">
            Simulate the NBA Draft Lottery based on current standings
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="tankathon-controls">
        <button
          onClick={simulateLottery}
          disabled={simulating}
          className="sim-lottery-btn"
        >
          <ReloadIcon
            width={20}
            height={20}
            className={simulating ? "spinning" : ""}
          />
          {simulating ? "Simulating..." : "Simulate Lottery"}
        </button>

        {lotteryResults && (
          <button onClick={resetLottery} className="reset-lottery-btn">
            Reset
          </button>
        )}
      </div>

      {/* Standings Table */}
      <div className="tankathon-content">
        <div className="standings-table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th>Pick</th>
                <th>Team</th>
                <th>Record</th>
                <th>Win%</th>
                <th>GB</th>
                <th>Top 4</th>
                <th>#1 Overall</th>
              </tr>
            </thead>
            <tbody>
              {(lotteryResults || standings).map((team, index) => {
                const pick = lotteryResults ? team.draftPick : index + 1;
                const isJumper =
                  lotteryResults && team.draftPick < team.lotteryRank;
                const isFaller =
                  lotteryResults && team.draftPick > team.lotteryRank;
                const spotsJumped = isJumper
                  ? team.lotteryRank - team.draftPick
                  : 0;
                const spotsFell = isFaller
                  ? team.draftPick - team.lotteryRank
                  : 0;
                const winPct = (
                  (team.wins / (team.wins + team.losses)) *
                  100
                ).toFixed(1);

                return (
                  <tr
                    key={team.id}
                    className={`
                      ${pick === 1 ? "pick-one" : ""}
                      ${pick <= 4 ? "lottery-pick" : ""}
                      ${isJumper ? "jumper" : ""}
                      ${isFaller ? "faller" : ""}
                    `}
                  >
                    <td className="pick-number">
                      <span className="pick-badge">{pick}</span>
                    </td>
                    <td className="team-cell">
                      <img
                        src={`https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`}
                        alt={team.full_name}
                        className="team-logo-small"
                      />
                      <span className="team-name-table">{team.full_name}</span>
                      {isJumper && (
                        <span className="jump-indicator">↑{spotsJumped}</span>
                      )}
                      {isFaller && (
                        <span className="fall-indicator">↓{spotsFell}</span>
                      )}
                    </td>
                    <td className="record-cell">
                      {team.wins}-{team.losses}
                    </td>
                    <td>{winPct}%</td>
                    <td>{team.gamesBack}</td>
                    <td className={pick <= 4 ? "highlight-odds" : ""}>
                      {team.top4Odds}%
                    </td>
                    <td className={pick === 1 ? "highlight-odds" : ""}>
                      {team.num1Odds}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lottery Explanation */}
        <div className="lottery-info">
          <h3>How the NBA Draft Lottery Works</h3>
          <ul>
            <li>
              The 14 teams that did not make the playoffs participate in the
              lottery
            </li>
            <li>All 14 picks are determined using a weighted lottery system</li>
            <li>The 3 worst teams each have a 14% chance at the #1 pick</li>
            <li>Each team has specific odds for each draft position (1-14)</li>
            <li>
              Teams with worse records have better odds of winning higher picks
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Tankathon;
