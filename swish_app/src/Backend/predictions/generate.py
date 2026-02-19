"""
NBA Game Predictions Generator
Standalone script converted from Google Colab notebook.
Fetches team game logs, builds features, trains XGBoost model,
scrapes injuries, and outputs predictions.json for today's games.

Usage: python generate.py
Output: ../data/predictions.json
"""

import json
import time
import re
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from bs4 import BeautifulSoup
from nba_api.live.nba.endpoints import scoreboard as live_scoreboard
from nba_api.stats.endpoints import (
    leaguedashplayerstats,
    teamgamelog,
)
from nba_api.stats.static import teams as nba_teams_static
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier

# ── Constants ──

OUTPUT_PATH = Path(__file__).parent.parent / "data" / "predictions.json"

ABBR_TO_NAME = {
    "ATL": "Atlanta Hawks", "BOS": "Boston Celtics", "BKN": "Brooklyn Nets",
    "CHA": "Charlotte Hornets", "CHI": "Chicago Bulls", "CLE": "Cleveland Cavaliers",
    "DAL": "Dallas Mavericks", "DEN": "Denver Nuggets", "DET": "Detroit Pistons",
    "GSW": "Golden State Warriors", "HOU": "Houston Rockets", "IND": "Indiana Pacers",
    "LAC": "Los Angeles Clippers", "LAL": "Los Angeles Lakers", "MEM": "Memphis Grizzlies",
    "MIA": "Miami Heat", "MIL": "Milwaukee Bucks", "MIN": "Minnesota Timberwolves",
    "NOP": "New Orleans Pelicans", "NYK": "New York Knicks", "OKC": "Oklahoma City Thunder",
    "ORL": "Orlando Magic", "PHI": "Philadelphia 76ers", "PHX": "Phoenix Suns",
    "POR": "Portland Trail Blazers", "SAC": "Sacramento Kings", "SAS": "San Antonio Spurs",
    "TOR": "Toronto Raptors", "UTA": "Utah Jazz", "WAS": "Washington Wizards"
}
NAME_TO_ABBR = {v: k for k, v in ABBR_TO_NAME.items()}

INJURY_TEAM_MAP = {
    **{name: name for name in ABBR_TO_NAME.values()},
    "L.A. Clippers": "Los Angeles Clippers",
    "L.A. Lakers": "Los Angeles Lakers",
}

STATUS_WEIGHTS = {
    'Out': 1.0, 'Out For Season': 1.0, 'Out Indefinitely': 1.0,
    'Doubtful': 0.8, 'Day-To-Day': 0.5, 'Questionable': 0.4, 'Probable': 0.1,
}


def get_current_season():
    """Get the NBA season string (e.g. '2025-26')."""
    now = datetime.now()
    if now.month >= 10:
        return f"{now.year}-{str(now.year + 1)[-2:]}"
    return f"{now.year - 1}-{str(now.year)[-2:]}"


def normalize_name(name):
    """Strip accents and lowercase for matching."""
    nfkd = unicodedata.normalize('NFKD', name)
    return ''.join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def convert_for_json(obj):
    """Convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, (np.float32, np.float64)):
        return float(obj)
    if isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


# ══════════════════════════════════════════════════════════
# STEP 1: Fetch all team game logs
# ══════════════════════════════════════════════════════════

def fetch_team_game_logs(season):
    """Fetch game logs for all 30 NBA teams."""
    nba_teams = nba_teams_static.get_teams()
    all_team_logs = []

    for team in nba_teams:
        team_id = team['id']
        team_name = team['full_name']
        print(f"  Fetching: {team_name}")

        try:
            gamelog = teamgamelog.TeamGameLog(
                team_id=team_id,
                season=season,
                season_type_all_star='Regular Season'
            )
            df = gamelog.get_data_frames()[0]
            df['TEAM_NAME'] = team_name
            all_team_logs.append(df)
            time.sleep(2.0)
        except Exception as e:
            print(f"  Error fetching {team_name}: {e}")
            continue

    if not all_team_logs:
        raise RuntimeError("No team game logs collected")

    season_df = pd.concat(all_team_logs, ignore_index=True)
    print(f"  Total rows: {len(season_df)}")
    return season_df


# ══════════════════════════════════════════════════════════
# STEP 2: Feature engineering
# ══════════════════════════════════════════════════════════

def engineer_features(df):
    """Add rolling stats, streaks, venue percentages, rest days."""
    df['WIN'] = df['WL'].map({'W': 1, 'L': 0})
    df['HOME_GAME'] = df['MATCHUP'].str.contains("vs.").astype(int)
    df['GAME_DATE'] = pd.to_datetime(df['GAME_DATE'], format='%b %d, %Y', errors='coerce')
    df = df.sort_values(['TEAM_NAME', 'GAME_DATE'])

    def get_situational_stats(group):
        group = group.copy()
        group['PTS_rolling_avg'] = group['PTS'].shift(1).rolling(window=3, min_periods=1).mean()
        group['AST_rolling_avg'] = group['AST'].shift(1).rolling(window=3, min_periods=1).mean()
        group['REB_rolling_avg'] = group['REB'].shift(1).rolling(window=3, min_periods=1).mean()

        wins = group['WIN']
        streak_id = wins.ne(wins.shift()).cumsum()
        group['WIN_STREAK'] = (group.groupby(streak_id).cumcount() + 1) * wins.replace(0, -1)

        home_wins_cumsum = (group['WIN'] * group['HOME_GAME']).cumsum()
        home_games_cumsum = group['HOME_GAME'].cumsum()
        group['HOME_VENUE_PCT'] = (home_wins_cumsum / home_games_cumsum).where(home_games_cumsum > 0)
        group['HOME_VENUE_PCT'] = group['HOME_VENUE_PCT'].ffill().fillna(0)

        road_game = 1 - group['HOME_GAME']
        road_wins_cumsum = (group['WIN'] * road_game).cumsum()
        road_games_cumsum = road_game.cumsum()
        group['ROAD_VENUE_PCT'] = (road_wins_cumsum / road_games_cumsum).where(road_games_cumsum > 0)
        group['ROAD_VENUE_PCT'] = group['ROAD_VENUE_PCT'].ffill().fillna(0)

        group['DAYS_REST'] = (group['GAME_DATE'].diff().dt.days - 1).fillna(1)
        return group

    df = df.groupby('TEAM_NAME', group_keys=False).apply(get_situational_stats).reset_index(drop=True)

    # Extract opponent
    df['OPP_TEAM_ABBR'] = df['MATCHUP'].str.extract(r'(?:vs\. |@ )([A-Z]{3})')
    df['OPP_TEAM_NAME'] = df['OPP_TEAM_ABBR'].map(ABBR_TO_NAME)

    return df


def build_pre_game_stats(df):
    """Build pre-game (shifted) stats for prediction. Fully vectorized."""
    df = df.sort_values(['TEAM_NAME', 'GAME_DATE']).reset_index(drop=True)
    g = df.groupby('TEAM_NAME')

    # Expanding / rolling stats per team (all vectorized via transform)
    for col, new_col in [('PTS', 'PRE_PTS_avg'), ('AST', 'PRE_AST_avg'),
                          ('REB', 'PRE_REB_avg'), ('FG_PCT', 'PRE_FG_PCT')]:
        df[new_col] = g[col].transform(lambda x: x.expanding().mean().shift(1))

    df['RECENT_WIN_PCT'] = g['WIN'].transform(
        lambda x: x.shift(1).rolling(5, min_periods=1).mean()
    )
    df['PRE_WIN_STREAK'] = g['WIN_STREAK'].transform(lambda x: x.shift(1).fillna(0))
    df['PRE_HOME_PCT'] = g['HOME_VENUE_PCT'].transform(lambda x: x.shift(1).fillna(0))
    df['PRE_ROAD_PCT'] = g['ROAD_VENUE_PCT'].transform(lambda x: x.shift(1).fillna(0))
    df['PRE_WIN_PCT'] = g['WIN'].transform(
        lambda x: x.expanding().mean().shift(1).fillna(0)
    )
    df['DAYS_REST'] = g['GAME_DATE'].transform(
        lambda x: (x.diff().dt.days - 1).fillna(1)
    )
    df['BACK_TO_BACK'] = (df['DAYS_REST'] == 0).astype(int)

    # H2H stats — vectorized using cumcount/cumsum per (team, opponent) pair
    h2h = df.groupby(['TEAM_NAME', 'OPP_TEAM_NAME'])
    df['H2H_GAMES'] = h2h.cumcount()  # 0 for first meeting, 1 for second, etc.
    df['H2H_WINS'] = h2h['WIN'].transform(lambda x: x.cumsum().shift(1).fillna(0))

    return df


# ══════════════════════════════════════════════════════════
# STEP 3: Fetch player stats for injury importance
# ══════════════════════════════════════════════════════════

def fetch_player_stats(season):
    """Fetch per-game player stats for injury importance weighting."""
    print("  Fetching player season averages...")
    try:
        player_stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            season_type_all_star='Regular Season',
            per_mode_detailed='PerGame'
        )
        player_df = player_stats.get_data_frames()[0]
        player_df['IMPORTANCE'] = player_df['PTS'] + player_df['REB'] + player_df['AST']
        player_df['_norm'] = player_df['PLAYER_NAME'].apply(normalize_name)

        all_nba_teams = nba_teams_static.get_teams()
        team_id_to_name = {t['id']: t['full_name'] for t in all_nba_teams}
        player_df['TEAM_FULL_NAME'] = player_df['TEAM_ID'].map(team_id_to_name)

        print(f"  Loaded stats for {len(player_df)} players")
        return player_df
    except Exception as e:
        print(f"  Could not fetch player stats: {e}")
        return None


# ══════════════════════════════════════════════════════════
# STEP 4: Scrape injuries
# ══════════════════════════════════════════════════════════

def _dedupe_player_name(raw):
    """Fix doubled names from CBS scraper."""
    if not raw:
        return "Unknown"
    splits = []
    for j in range(1, len(raw)):
        if raw[j].isupper() and raw[j - 1].islower():
            splits.append(j)
    if splits:
        for split_pos in splits:
            candidate = raw[split_pos:]
            if ' ' in candidate and len(candidate) > 4:
                return candidate
    return raw


def fetch_nba_injuries():
    """Scrape current NBA injuries from CBS Sports."""
    url = "https://www.cbssports.com/nba/injuries/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')

        injuries = []
        tables = soup.find_all('table', class_='TableBase-table')
        team_headers = soup.find_all('span', class_='TeamName')

        for i, table in enumerate(tables):
            current_team = (
                team_headers[i].get_text(strip=True)
                if i < len(team_headers) else "Unknown"
            )

            tbody = table.find('tbody')
            rows = tbody.find_all('tr') if tbody else table.find_all('tr')[1:]

            for row in rows:
                cols = row.find_all('td')
                if len(cols) < 3:
                    continue

                name_cell = cols[0]
                long_span = name_cell.find(
                    'span',
                    class_=lambda c: c and 'long' in c.lower()
                ) if name_cell else None

                if long_span:
                    player_name = long_span.get_text(strip=True)
                else:
                    links = name_cell.find_all('a')
                    if len(links) >= 2:
                        player_name = links[-1].get_text(strip=True)
                    elif links:
                        player_name = links[0].get_text(strip=True)
                    else:
                        player_name = _dedupe_player_name(name_cell.get_text(strip=True))

                position = cols[1].get_text(strip=True) if len(cols) > 1 else ""
                raw_return = cols[2].get_text(strip=True) if len(cols) > 2 else ""
                status = cols[4].get_text(strip=True) if len(cols) > 4 else ""
                injury_type = cols[3].get_text(strip=True) if len(cols) > 3 else ""

                injuries.append({
                    'Team': current_team,
                    'Player': player_name,
                    'Position': position,
                    'Status': status,
                    'Injury': injury_type,
                    'Est_Return': raw_return,
                })

        if injuries:
            result_df = pd.DataFrame(injuries)
            print(f"  Scraped {len(result_df)} injuries across {len(tables)} teams")
            return result_df

    except Exception as e:
        print(f"  CBS scrape failed: {e}")

    return None


def compute_injury_scores(injury_df, player_df):
    """Compute per-team injury impact scores."""
    team_injury_scores = {name: 0.0 for name in ABBR_TO_NAME.values()}
    team_injury_details = {name: [] for name in ABBR_TO_NAME.values()}

    if injury_df is None or len(injury_df) == 0:
        print("  No injury data available")
        return team_injury_scores, team_injury_details

    for _, row in injury_df.iterrows():
        team_raw = str(row.get('Team', '')).strip()
        status = str(row.get('Status', '')).strip()
        player_name = str(row.get('Player', '')).strip()

        matched_team = INJURY_TEAM_MAP.get(team_raw)
        if not matched_team:
            for key, val in INJURY_TEAM_MAP.items():
                if key.lower() in team_raw.lower() or team_raw.lower() in key.lower():
                    matched_team = val
                    break

        if not matched_team or matched_team not in team_injury_scores:
            continue

        status_weight = STATUS_WEIGHTS.get(status, 0.3)

        importance = 15.0
        if player_df is not None:
            player_norm = normalize_name(player_name)
            match = player_df[
                (player_df['_norm'] == player_norm) &
                (player_df['TEAM_FULL_NAME'] == matched_team)
            ]
            if match.empty:
                last_name = player_norm.split()[-1] if player_norm else ''
                team_players = player_df[player_df['TEAM_FULL_NAME'] == matched_team]
                match = team_players[team_players['_norm'].str.contains(last_name, na=False)]
            if not match.empty:
                importance = match.iloc[0]['IMPORTANCE']

        avg_importance = 15.0
        normalised = importance / avg_importance
        score = status_weight * normalised

        team_injury_scores[matched_team] += score
        team_injury_details[matched_team].append({
            'player': player_name,
            'status': status,
            'importance': round(importance, 1),
            'impact': round(score, 2)
        })

    return team_injury_scores, team_injury_details


# ══════════════════════════════════════════════════════════
# STEP 5: Build matchups and train model
# ══════════════════════════════════════════════════════════

def build_matchups(df):
    """Build home-vs-away matchup rows from game data."""
    home_games = df[df['HOME_GAME'] == 1].copy()
    matchup_data = []

    for _, row in home_games.iterrows():
        opp = row['OPP_TEAM_NAME']
        game_date = row['GAME_DATE']

        opp_row = df[(df['TEAM_NAME'] == opp) & (df['GAME_DATE'] == game_date)]
        if opp_row.empty:
            continue
        opp_row = opp_row.iloc[0]

        if pd.isna(row['PRE_PTS_avg']) or pd.isna(opp_row['PRE_PTS_avg']):
            continue

        matchup_data.append({
            'HOME_PTS_avg': row['PRE_PTS_avg'],
            'HOME_AST_avg': row['PRE_AST_avg'],
            'HOME_REB_avg': row['PRE_REB_avg'],
            'HOME_FG_PCT': row['PRE_FG_PCT'],
            'HOME_RECENT_WIN_PCT': row['RECENT_WIN_PCT'],
            'HOME_WIN_STREAK': row['PRE_WIN_STREAK'],
            'HOME_VENUE_PCT': row['PRE_HOME_PCT'],
            'HOME_OVERALL_PCT': row['PRE_WIN_PCT'],
            'HOME_DAYS_REST': row['DAYS_REST'],
            'HOME_B2B': row['BACK_TO_BACK'],
            'HOME_H2H_WINS': row['H2H_WINS'],
            'HOME_H2H_GAMES': row['H2H_GAMES'],
            'AWAY_PTS_avg': opp_row['PRE_PTS_avg'],
            'AWAY_AST_avg': opp_row['PRE_AST_avg'],
            'AWAY_REB_avg': opp_row['PRE_REB_avg'],
            'AWAY_FG_PCT': opp_row['PRE_FG_PCT'],
            'AWAY_RECENT_WIN_PCT': opp_row['RECENT_WIN_PCT'],
            'AWAY_WIN_STREAK': opp_row['PRE_WIN_STREAK'],
            'AWAY_VENUE_PCT': opp_row['PRE_ROAD_PCT'],
            'AWAY_OVERALL_PCT': opp_row['PRE_WIN_PCT'],
            'AWAY_DAYS_REST': opp_row['DAYS_REST'],
            'AWAY_B2B': opp_row['BACK_TO_BACK'],
            'REST_DIFF': row['DAYS_REST'] - opp_row['DAYS_REST'],
            'WIN_PCT_DIFF': row['PRE_WIN_PCT'] - opp_row['PRE_WIN_PCT'],
            'PTS_DIFF': row['PRE_PTS_avg'] - opp_row['PRE_PTS_avg'],
            'HOME_WIN': row['WIN'],
            'GAME_DATE': game_date,
            'HOME_TEAM': row['TEAM_NAME'],
            'AWAY_TEAM': opp,
        })

    matchup_df = pd.DataFrame(matchup_data).dropna()
    matchup_df = matchup_df.sort_values('GAME_DATE').reset_index(drop=True)
    return matchup_df


def train_model(matchup_df):
    """Train XGBoost on matchup data, return fitted model and accuracy."""
    meta_cols = ['HOME_WIN', 'GAME_DATE', 'HOME_TEAM', 'AWAY_TEAM']
    features = [c for c in matchup_df.columns if c not in meta_cols]

    X = matchup_df[features]
    y = matchup_df['HOME_WIN']

    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    model = XGBClassifier(
        use_label_encoder=False,
        eval_metric='logloss',
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    accuracy = accuracy_score(y_test, preds)
    print(f"  Held-out accuracy: {accuracy:.2%}")

    # Retrain on full dataset for production predictions
    model.fit(X, y)
    return model, features, accuracy


# ══════════════════════════════════════════════════════════
# STEP 6: Predict today's games
# ══════════════════════════════════════════════════════════

def predict_todays_games(model, features, df, team_injury_scores, team_injury_details):
    """Fetch today's schedule and generate predictions."""
    latest = df.sort_values('GAME_DATE').groupby('TEAM_NAME').last().reset_index()

    def predict_game(home_name, away_name, home_rest=1, away_rest=1):
        h = latest[latest['TEAM_NAME'] == home_name]
        a = latest[latest['TEAM_NAME'] == away_name]
        if h.empty or a.empty:
            return None
        h, a = h.iloc[0], a.iloc[0]

        h2h = df[(df['TEAM_NAME'] == home_name) & (df['OPP_TEAM_NAME'] == away_name)]
        h2h_wins = h2h['WIN'].sum() if len(h2h) > 0 else 0
        h2h_games = len(h2h)

        input_row = pd.DataFrame([{
            'HOME_PTS_avg': h['PRE_PTS_avg'],
            'HOME_AST_avg': h['PRE_AST_avg'],
            'HOME_REB_avg': h['PRE_REB_avg'],
            'HOME_FG_PCT': h['PRE_FG_PCT'],
            'HOME_RECENT_WIN_PCT': h['RECENT_WIN_PCT'],
            'HOME_WIN_STREAK': h['PRE_WIN_STREAK'],
            'HOME_VENUE_PCT': h['PRE_HOME_PCT'],
            'HOME_OVERALL_PCT': h['PRE_WIN_PCT'],
            'HOME_DAYS_REST': home_rest,
            'HOME_B2B': 1 if home_rest == 0 else 0,
            'HOME_H2H_WINS': h2h_wins,
            'HOME_H2H_GAMES': h2h_games,
            'AWAY_PTS_avg': a['PRE_PTS_avg'],
            'AWAY_AST_avg': a['PRE_AST_avg'],
            'AWAY_REB_avg': a['PRE_REB_avg'],
            'AWAY_FG_PCT': a['PRE_FG_PCT'],
            'AWAY_RECENT_WIN_PCT': a['RECENT_WIN_PCT'],
            'AWAY_WIN_STREAK': a['PRE_WIN_STREAK'],
            'AWAY_VENUE_PCT': a['PRE_ROAD_PCT'],
            'AWAY_OVERALL_PCT': a['PRE_WIN_PCT'],
            'AWAY_DAYS_REST': away_rest,
            'AWAY_B2B': 1 if away_rest == 0 else 0,
            'REST_DIFF': home_rest - away_rest,
            'WIN_PCT_DIFF': h['PRE_WIN_PCT'] - a['PRE_WIN_PCT'],
            'PTS_DIFF': h['PRE_PTS_avg'] - a['PRE_PTS_avg'],
        }])

        raw_prob = model.predict_proba(input_row)[0][1]
        home_inj = team_injury_scores.get(home_name, 0)
        away_inj = team_injury_scores.get(away_name, 0)
        injury_adjustment = (away_inj - home_inj) * 0.02
        adj_prob = max(0.05, min(0.95, raw_prob + injury_adjustment))

        return {
            'prob': adj_prob,
            'raw_prob': raw_prob,
            'home_inj': home_inj,
            'away_inj': away_inj,
            'adjustment': injury_adjustment,
        }

    # Fetch today's schedule from NBA live scoreboard
    print("  Fetching today's schedule...")
    board = live_scoreboard.ScoreBoard()
    games_data = board.get_dict()

    todays_games = []
    if 'scoreboard' in games_data and 'games' in games_data['scoreboard']:
        for game in games_data['scoreboard']['games']:
            home_name = f"{game['homeTeam']['teamCity']} {game['homeTeam']['teamName']}"
            away_name = f"{game['awayTeam']['teamCity']} {game['awayTeam']['teamName']}"

            try:
                home_last = df[df['TEAM_NAME'] == home_name].sort_values('GAME_DATE').iloc[-1]
                away_last = df[df['TEAM_NAME'] == away_name].sort_values('GAME_DATE').iloc[-1]
                today = pd.Timestamp.now().normalize()
                home_rest = max((today - home_last['GAME_DATE']).days - 1, 0)
                away_rest = max((today - away_last['GAME_DATE']).days - 1, 0)
            except Exception:
                home_rest = 1
                away_rest = 1

            todays_games.append({
                "home": home_name, "away": away_name,
                "home_rest": home_rest, "away_rest": away_rest,
                "status": game.get('gameStatusText', ''),
                "home_abbr": game['homeTeam']['teamTricode'],
                "away_abbr": game['awayTeam']['teamTricode'],
            })

    print(f"  Found {len(todays_games)} games today")

    # Generate predictions
    predictions = []
    for game in todays_games:
        result = predict_game(game['home'], game['away'], game['home_rest'], game['away_rest'])
        if result is None:
            print(f"  Could not predict: {game['away']} @ {game['home']}")
            continue

        home_abbr = game.get('home_abbr', NAME_TO_ABBR.get(game['home'], '???'))
        away_abbr = game.get('away_abbr', NAME_TO_ABBR.get(game['away'], '???'))

        game_injuries = []
        for team_name, team_abbr in [(game['home'], home_abbr), (game['away'], away_abbr)]:
            details = team_injury_details.get(team_name, [])
            for d in details:
                game_injuries.append({
                    "player": d['player'],
                    "team": team_abbr,
                    "status": d['status'],
                    "importance": d['importance'],
                    "impact": d['impact'],
                })

        predictions.append({
            "home_team": game['home'],
            "away_team": game['away'],
            "home_abbr": home_abbr,
            "away_abbr": away_abbr,
            "home_win_prob": round(result['prob'], 3),
            "away_win_prob": round(1 - result['prob'], 3),
            "raw_prob": round(result['raw_prob'], 3),
            "injury_adjustment": round(result['adjustment'], 3),
            "home_injury_score": round(result['home_inj'], 2),
            "away_injury_score": round(result['away_inj'], 2),
            "home_rest": game['home_rest'],
            "away_rest": game['away_rest'],
            "status": game['status'],
            "injuries": game_injuries,
        })

    return predictions, todays_games


# ══════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════

def main():
    season = get_current_season()
    print(f"{'=' * 60}")
    print(f"  NBA PREDICTION GENERATOR")
    print(f"  Season: {season}")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'=' * 60}\n")

    # Step 1: Fetch game logs
    print("[1/6] Fetching team game logs...")
    season_df = fetch_team_game_logs(season)

    # Step 2: Feature engineering
    print("\n[2/6] Engineering features...")
    df = engineer_features(season_df)

    # Step 3: Build pre-game stats
    print("\n[3/6] Building pre-game stats...")
    df = build_pre_game_stats(df)

    # Step 4: Fetch injuries & player stats
    print("\n[4/6] Fetching injuries & player stats...")
    player_df = fetch_player_stats(season)
    time.sleep(2)
    injury_df = fetch_nba_injuries()
    team_injury_scores, team_injury_details = compute_injury_scores(injury_df, player_df)

    # Step 5: Train model
    print("\n[5/6] Training model...")
    matchup_df = build_matchups(df)
    print(f"  Total matchups: {len(matchup_df)}")
    model, features, accuracy = train_model(matchup_df)

    # Step 6: Predict today's games
    print("\n[6/6] Predicting today's games...")
    predictions, todays_games = predict_todays_games(
        model, features, df, team_injury_scores, team_injury_details
    )

    # Build output
    output = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "generated_at": datetime.now().isoformat(),
        "model_accuracy": f"{accuracy:.2%}",
        "total_matchups_trained": len(matchup_df),
        "has_injuries": injury_df is not None and len(injury_df) > 0,
        "games": predictions,
    }

    # Write to file
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=2, default=convert_for_json)

    print(f"\n{'=' * 60}")
    print(f"  DONE!")
    print(f"  Output: {OUTPUT_PATH}")
    print(f"  Games predicted: {len(predictions)}")
    print(f"  Model accuracy: {accuracy:.2%}")
    for g in predictions:
        winner = g['home_abbr'] if g['home_win_prob'] > 0.5 else g['away_abbr']
        conf = max(g['home_win_prob'], g['away_win_prob'])
        print(f"    {g['away_abbr']} @ {g['home_abbr']}: {winner} ({conf:.1%})")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
