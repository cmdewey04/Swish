# Backend/fetch_live_scores.py
from nba_api.live.nba.endpoints import scoreboard
import json
from datetime import datetime
import os
from pathlib import Path

def get_live_scores():
    """Fetch today's games and their current status"""
    try:
        # Get today's scoreboard
        board = scoreboard.ScoreBoard()
        games_data = board.get_dict()
        
        games_list = []
        
        if 'scoreboard' in games_data and 'games' in games_data['scoreboard']:
            for game in games_data['scoreboard']['games']:
                game_info = {
                    'game_id': game.get('gameId'),
                    'game_status': game.get('gameStatus'),
                    'game_status_text': game.get('gameStatusText'),
                    'period': game.get('period'),
                    'game_clock': game.get('gameClock'),
                    
                    # Home team
                    'home_team': {
                        'team_id': game.get('homeTeam', {}).get('teamId'),
                        'team_name': game.get('homeTeam', {}).get('teamName'),
                        'team_city': game.get('homeTeam', {}).get('teamCity'),
                        'team_tricode': game.get('homeTeam', {}).get('teamTricode'),
                        'score': game.get('homeTeam', {}).get('score'),
                        'wins': game.get('homeTeam', {}).get('wins'),
                        'losses': game.get('homeTeam', {}).get('losses'),
                    },
                    
                    # Away team
                    'away_team': {
                        'team_id': game.get('awayTeam', {}).get('teamId'),
                        'team_name': game.get('awayTeam', {}).get('teamName'),
                        'team_city': game.get('awayTeam', {}).get('teamCity'),
                        'team_tricode': game.get('awayTeam', {}).get('teamTricode'),
                        'score': game.get('awayTeam', {}).get('score'),
                        'wins': game.get('awayTeam', {}).get('wins'),
                        'losses': game.get('awayTeam', {}).get('losses'),
                    }
                }
                
                games_list.append(game_info)
        
        # Save to JSON file
        output = {
            'last_updated': datetime.now().isoformat(),
            'games': games_list
        }
        
        # Navigate to project root
        # Current: src/Backend/fetch_live_scores.py
        backend_dir = Path(__file__).parent.absolute()  # src/Backend
        src_dir = backend_dir.parent  # src
        project_root = src_dir.parent  # project root (swish_app)
        
        # Save to Backend/data
        backend_data_dir = backend_dir / 'data'
        backend_data_dir.mkdir(exist_ok=True)
        backend_file = backend_data_dir / 'live_scores.json'
        with open(backend_file, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"✅ Saved to {backend_file}")

        # Save to ROOT public/data for frontend (OUTSIDE src/)
        public_data_dir = project_root / 'public' / 'data'
        public_data_dir.mkdir(parents=True, exist_ok=True)
        public_file = public_data_dir / 'live_scores.json'
        with open(public_file, 'w') as f:
            json.dump(output, f, indent=2)
        print(f"✅ Saved to {public_file}")
        
        print(f"🏀 Successfully fetched {len(games_list)} games")
        return output
        
    except Exception as e:
        print(f"❌ Error fetching live scores: {e}")
        import traceback
        traceback.print_exc()
        
        # Create empty file if error occurs
        backend_dir = Path(__file__).parent.absolute()
        src_dir = backend_dir.parent
        project_root = src_dir.parent
        
        output = {'last_updated': datetime.now().isoformat(), 'games': []}
        
        # Save to both locations
        backend_data_dir = backend_dir / 'data'
        backend_data_dir.mkdir(exist_ok=True)
        with open(backend_data_dir / 'live_scores.json', 'w') as f:
            json.dump(output, f, indent=2)
            
        public_data_dir = project_root / 'public' / 'data'
        public_data_dir.mkdir(parents=True, exist_ok=True)
        with open(public_data_dir / 'live_scores.json', 'w') as f:
            json.dump(output, f, indent=2)
        
        return output

if __name__ == "__main__":
    print("🏀 Fetching NBA live scores...")
    get_live_scores()