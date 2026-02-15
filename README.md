# Swish — NBA Analytics & Live Scores

Swish is a full-stack NBA analytics application that delivers live scores, detailed box scores, AI-powered game predictions, player statistics, team breakdowns, and a draft lottery simulator — all wrapped in a sleek, dark-themed interface.

---

## Features

### Live Scores & Box Scores
Real-time NBA scores powered by the NBA API. Click into any game to see full box scores with player stats, shooting splits, plus/minus, and team totals. Games update automatically and display quarter-by-quarter scoring.

### Swish Predictor (AI Game Predictions)
An XGBoost machine learning model trained on 800+ NBA matchups predicts game outcomes before tip-off. The prediction page displays a donut chart showing win probabilities for each team, factoring in rest days, head-to-head history, win streaks, and a real-time injury report scraped from CBS Sports. Available on the game detail page for any game that hasn't started yet.

### Team Comparison
After a game finishes, view a head-to-head statistical comparison between the two teams with animated bar charts covering points, rebounds, assists, steals, blocks, turnovers, and shooting percentages.

### Top Plays
Game highlight clips sourced from YouTube, filtered by game date for relevance. Includes an embedded video player with a thumbnail grid for browsing clips.

### Player Profiles
Detailed player pages showing season averages, per-game stats, and shooting breakdowns. Accessible from box scores or the explore page.

### Team Pages
Browse all 30 NBA teams with full rosters, season records, and team-specific stats. Each team page links out to individual player profiles.

### Draft Lottery Simulator (Tankathon)
Simulates the NBA Draft Lottery using the official lottery odds for all 14 positions. Based on current standings, with visual indicators showing which teams jumped up or fell in the order.

### Favorites System
Save your favorite players with Google OAuth authentication. Favorites sync across sessions via Supabase (PostgreSQL), so your picks persist on any device.

### Explore Page
Search and browse NBA players and teams with filters. Quick access to player profiles and team breakdowns.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Vite |
| Styling | Custom CSS (dark theme) |
| Backend API | Node.js, Express |
| Data Fetching | Python (`nba_api`), BeautifulSoup |
| ML Model | XGBoost, pandas, scikit-learn |
| Auth & Database | Supabase (Google OAuth + PostgreSQL) |
| Video | YouTube Data API v3 |

---

## Project Structure

```
swish/
├── public/
│   └── data/
│       ├── live_scores.json        # Auto-updated live scores
│       └── predictions.json        # Daily AI predictions
├── src/
│   ├── components/
│   │   ├── NavBar.jsx
│   │   ├── LiveScores.jsx          # Score cards on home page
│   │   ├── SwishPredict.jsx        # AI prediction donut + injuries
│   │   ├── TeamDetail.jsx
│   │   ├── PlayerDetail.jsx
│   │   ├── HeroSection.jsx
│   │   └── ScrollToTop.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── GameDetail.jsx          # Box score, comparison, highlights
│   │   ├── Teams.jsx
│   │   ├── Explore.jsx
│   │   ├── Favorites.jsx
│   │   └── Tankathon.jsx           # Draft lottery simulator
│   ├── contexts/
│   │   ├── ThemeContext.jsx
│   │   └── AuthContext.jsx
│   ├── constants/
│   │   └── teamColors.js
│   ├── lib/
│   │   ├── supabase.js
│   │   └── favoritesService.js
│   ├── css/                        # Component-specific stylesheets
│   ├── Backend/
│   │   ├── server.js               # Express API server
│   │   ├── fetch_box_score.py      # NBA box score fetcher
│   │   ├── fetch_live_data.py      # Live scores updater
│   │   ├── buildTeams.py           # Team data aggregator
│   │   └── data/
│   │       ├── teams.json
│   │       └── predictions.json
│   └── App.jsx
├── notebooks/
│   └── swish_predict.py            # ML prediction model (Colab)
├── .env                            # API keys (not committed)
├── package.json
└── vite.config.js
```


## Prediction Model

The Swish Predictor runs in a Google Colab notebook (`swish_predict.py`) and outputs `predictions.json` which the frontend consumes. The model uses:

- **Algorithm**: XGBoost classifier
- **Features**: Pre-game averages (PTS, AST, REB, FG%), win streaks, rest days, home/away venue performance, head-to-head records, and back-to-back flags
- **Injury Adjustment**: Real-time injury data scraped from CBS Sports, weighted by player importance (PTS + REB + AST per game) and injury status severity
- **Training Data**: 800+ NBA matchups from the 2025-26 season


## API Endpoints

The Express backend (`server.js`) exposes:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/boxscore/:gameId` | GET | Fetches box score for a specific game |
| `/api/highlights?q=...&date=...` | GET | Searches YouTube for game highlights |
| `/api/refresh-scores` | POST | Triggers a live scores refresh |
| `/api/refresh-teams` | POST | Rebuilds team data from the NBA API |

---


## License

This project is for educational and portfolio purposes. NBA data is sourced from the [nba_api](https://github.com/swar/nba_api) Python package. Team logos are from the NBA and ESPN CDNs.
