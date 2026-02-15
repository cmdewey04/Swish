"""
Update player stats in players.json (FAST VERSION)
Only updates stats, keeps all other player data
Run: python updatePlayerStats.py
"""

import json
import time
from datetime import datetime
from pathlib import Path
from nba_api.stats.endpoints import playercareerstats

DELAY = 0.6  # 600ms between calls
MAX_RETRIES = 3
RETRY_DELAY = 5

def get_current_season():
    """Get the actual current NBA season"""
    now = datetime.now()
    year = now.year
    month = now.month
    
    if month >= 10:
        season = f"{year}-{str(year+1)[-2:]}"
    else:
        season = f"{year-1}-{str(year)[-2:]}"
    
    return season

def fetch_with_retry(func, description="API call"):
    """Retry API calls that fail"""
    for attempt in range(MAX_RETRIES):
        try:
            result = func()
            time.sleep(DELAY)
            return result
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"      ⚠️  Retry {attempt + 1}/{MAX_RETRIES}...")
                time.sleep(RETRY_DELAY)
            else:
                raise e

def get_player_stats(player_id, player_name, season):
    """Get current season stats for a player"""
    try:
        def _fetch():
            return playercareerstats.PlayerCareerStats(
                player_id=str(player_id),
                timeout=30
            )
        
        career = fetch_with_retry(_fetch, f"stats for {player_name}")
        df = career.season_totals_regular_season.get_data_frame()
        
        if df.empty:
            return None
        
        # Filter for current season
        current_season_df = df[df['SEASON_ID'] == season]
        
        # If no data for current season, use most recent
        if current_season_df.empty:
            current_season = df.iloc[0]
        else:
            current_season = current_season_df.iloc[0]
        
        games_played = current_season['GP']
        
        if games_played == 0:
            return None
        
        # Calculate per-game averages
        return {
            'gp': int(games_played),
            'mpg': round(current_season['MIN'] / games_played, 1),
            'ppg': round(current_season['PTS'] / games_played, 1),
            'rpg': round(current_season['REB'] / games_played, 1),
            'apg': round(current_season['AST'] / games_played, 1),
            'spg': round(current_season['STL'] / games_played, 1),
            'bpg': round(current_season['BLK'] / games_played, 1),
            'topg': round(current_season['TOV'] / games_played, 1),
            'fgpct': round(current_season['FG_PCT'] * 100, 1) if current_season['FG_PCT'] else None,
            'fg3pct': round(current_season['FG3_PCT'] * 100, 1) if current_season['FG3_PCT'] else None,
            'ftpct': round(current_season['FT_PCT'] * 100, 1) if current_season['FT_PCT'] else None,
            'fgm': round(current_season['FGM'] / games_played, 1),
            'fga': round(current_season['FGA'] / games_played, 1),
            'fg3m': round(current_season['FG3M'] / games_played, 1),
            'fg3a': round(current_season['FG3A'] / games_played, 1),
            'ftm': round(current_season['FTM'] / games_played, 1),
            'fta': round(current_season['FTA'] / games_played, 1),
            'oreb': round(current_season['OREB'] / games_played, 1),
            'dreb': round(current_season['DREB'] / games_played, 1),
            'pf': round(current_season['PF'] / games_played, 1),
        }
    except Exception as e:
        print(f"      ❌ Failed: {str(e)[:50]}")
        return None

def update_player_stats():
    """Update stats for all players in players.json"""
    
    season = get_current_season()
    players_path = Path('data/players.json')
    
    if not players_path.exists():
        print(f"❌ {players_path} not found!")
        return False
    
    # Load existing players
    print(f"📂 Loading {players_path}")
    with open(players_path, 'r') as f:
        players = json.load(f)
    
    print(f"📊 Found {len(players)} players")
    print(f"📅 Season: {season}")
    print(f"⏰ Started: {datetime.now().strftime('%H:%M:%S')}\n")
    
    updated_count = 0
    failed_count = 0
    skipped_count = 0
    
    # Update each player
    for i, player in enumerate(players):
        player_id = player['id']
        player_name = player['full_name']
        
        print(f"[{i+1}/{len(players)}] {player_name}...")
        
        # Get fresh stats
        new_stats = get_player_stats(player_id, player_name, season)
        
        if new_stats:
            # Check if stats actually changed
            old_ppg = player.get('ppg', 0)
            new_ppg = new_stats.get('ppg', 0)
            
            # Update all stat fields
            player.update(new_stats)
            
            if old_ppg != new_ppg:
                print(f"    ✓ Updated: {old_ppg} → {new_ppg} PPG ({new_stats['gp']} GP)")
                updated_count += 1
            else:
                print(f"    - No change: {new_ppg} PPG")
                skipped_count += 1
        else:
            print(f"    ⚠️  No stats available")
            failed_count += 1
        
        # Progress update every 50 players
        if (i + 1) % 50 == 0:
            elapsed = datetime.now()
            print(f"\n--- Progress: {i+1}/{len(players)} complete ({elapsed.strftime('%H:%M:%S')}) ---\n")
    
    # Save updated players.json
    backup_path = players_path.with_suffix('.json.backup')
    
    print(f"\n💾 Creating backup: {backup_path}")
    with open(backup_path, 'w') as f:
        json.dump(players, f, indent=2)
    
    print(f"💾 Saving updated data: {players_path}")
    with open(players_path, 'w') as f:
        json.dump(players, f, indent=2)
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"✅ Updated: {updated_count} players")
    print(f"➖ Unchanged: {skipped_count} players")
    print(f"⚠️  Failed: {failed_count} players")
    print(f"📊 Total: {len(players)} players")
    print(f"⏰ Finished: {datetime.now().strftime('%H:%M:%S')}")
    
    return True

if __name__ == '__main__':
    try:
        print("="*60)
        print("NBA PLAYER STATS UPDATER")
        print("="*60 + "\n")
        
        success = update_player_stats()
        
        if success:
            print("\n✅ SUCCESS - Player stats updated!")
        else:
            print("\n❌ FAILED")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()