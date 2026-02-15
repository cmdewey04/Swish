# Backend/fetch_box_score.py
import sys
import json
import requests

def fetch_and_format(game_id):
    url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
    try:
        res = requests.get(url, timeout=10).json()['game']
        
        # 1. Create the player_stats list (UPPERCASE for your React frontend)
        player_stats = []
        for team_key in ['homeTeam', 'awayTeam']:
            team = res[team_key]
            for p in team['players']:
                s = p['statistics']
                player_stats.append({
                    "PLAYER_ID": p['personId'],
                    "PLAYER_NAME": f"{p['firstName']} {p['familyName']}",
                    "TEAM_ID": team['teamId'],
                    "TEAM_ABBREVIATION": team['teamTricode'],
                    "START_POSITION": p.get('position'), # Mapping for starters
                    "COMMENT": p.get('status'), # Mapping for DNP
                    "MIN": s['minutes'],
                    "PTS": s['points'],
                    "REB": s['reboundsTotal'],
                    "AST": s['assists'],
                    "STL": s['steals'],
                    "BLK": s['blocks'],
                    "FGM": s['fieldGoalsMade'],
                    "FGA": s['fieldGoalsAttempted'],
                    "FG_PCT": s['fieldGoalsPercentage'],
                    "FG3M": s['threePointersMade'],
                    "FG3A": s['threePointersAttempted'],
                    "FG3_PCT": s['threePointersPercentage'],
                    "FTM": s['freeThrowsMade'],
                    "FTA": s['freeThrowsAttempted'],
                    "FT_PCT": s['freeThrowsPercentage'],
                    "OREB": s['reboundsOffensive'],
                    "DREB": s['reboundsDefensive'],
                    "TO": s['turnovers'],
                    "PF": s['foulsPersonal'],
                    "PLUS_MINUS": s['plusMinusPoints']
                })

        # 2. Create the line_score (needed for your useMemo logic)
        line_score = []
        for team_key in ['awayTeam', 'homeTeam']: # React expects Away first [0]
            t = res[team_key]
            line_score.append({
                "TEAM_ID": t['teamId'],
                "TEAM_ABBREVIATION": t['teamTricode'],
                "TEAM_CITY_NAME": t['teamCity'],
                "TEAM_NICKNAME": t['teamName'],
                "PTS": t['statistics']['points'],
                "TEAM_WINS_LOSSES": f"{t.get('wins', 0)}-{t.get('losses', 0)}"
            })

        return {
            "success": True,
            "data": {
                "player_stats": player_stats,
                "line_score": line_score,
                "game_summary": {"GAME_STATUS_ID": 3 if res['gameStatusText'] == 'Final' else 2},
                "team_stats": [] # You can populate this similar to players if needed
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    game_id = sys.argv[1]
    print(json.dumps(fetch_and_format(game_id)))