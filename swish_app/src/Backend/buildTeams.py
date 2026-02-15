"""
Build teams.json with CURRENT standings
Quick version - just updates team records
"""

import json
import time
from datetime import datetime
from pathlib import Path
from nba_api.stats.static import teams
from nba_api.stats.endpoints import leaguestandingsv3

DELAY = 2.0

def get_current_season():
    """Get the actual current NBA season"""
    # The NBA season is YYYY-YY format, e.g., "2024-25"
    # Season starts in October, so if we're past October, it's the new season
    now = datetime.now()
    year = now.year
    month = now.month
    
    # If we're in October-December, the season is current_year to next_year
    # If we're in Jan-September, the season started last year
    if month >= 10:
        season = f"{year}-{str(year+1)[-2:]}"
    else:
        season = f"{year-1}-{str(year)[-2:]}"
    
    return season

def update_team_records():
    """Fetch current standings and update teams.json"""
    
    season = get_current_season()
    print(f"📅 Current NBA Season: {season}")
    print(f"⏰ Fetching standings as of: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Get standings
    print("🔄 Fetching league standings...")
    try:
        standings = leaguestandingsv3.LeagueStandingsV3(
            season=season,
            season_type='Regular Season'
        )
        time.sleep(DELAY)
        
        df = standings.get_data_frames()[0]
        print(f"✅ Got standings for {len(df)} teams\n")
        
    except Exception as e:
        print(f"❌ Error fetching standings: {e}")
        return False
    
    # Build standings map
    standings_map = {}
    for _, row in df.iterrows():
        team_id = row['TeamID']
        standings_map[team_id] = {
            'wins': int(row['WINS']),
            'losses': int(row['LOSSES']),
            'win_pct': float(row['WinPCT']),
            'conference': row.get('Conference', ''),
            'division': row.get('Division', ''),
        }
    
    # Load existing teams.json
    teams_path = Path('data/teams.json')
    
    if teams_path.exists():
        print(f"📂 Loading existing {teams_path}")
        with open(teams_path, 'r') as f:
            teams_data = json.load(f)
    else:
        # Create from scratch using static teams
        print("📂 No existing teams.json, creating from static data")
        all_teams = teams.get_teams()
        teams_data = []
        
        for team in all_teams:
            teams_data.append({
                'id': team['id'],
                'name': team['nickname'],
                'full_name': team['full_name'],
                'abbreviation': team['abbreviation'],
                'city': team['city'],
                'state': team['state'],
                'year_founded': team['year_founded'],
            })
    
    # Update records
    print("\n🔄 Updating team records...")
    updated_count = 0
    
    for team in teams_data:
        team_id = team['id']
        
        if team_id in standings_map:
            old_record = f"{team.get('wins', '?')}-{team.get('losses', '?')}"
            new_data = standings_map[team_id]
            
            team['wins'] = new_data['wins']
            team['losses'] = new_data['losses']
            team['win_pct'] = new_data['win_pct']
            team['conference'] = new_data['conference']
            team['division'] = new_data['division']
            
            new_record = f"{new_data['wins']}-{new_data['losses']}"
            
            if old_record != new_record:
                print(f"  ✓ {team['full_name']}: {old_record} → {new_record}")
                updated_count += 1
            else:
                print(f"  - {team['full_name']}: {new_record} (no change)")
    
    # Save updated teams.json
    teams_path.parent.mkdir(exist_ok=True)
    
    with open(teams_path, 'w') as f:
        json.dump(teams_data, f, indent=2)
    
    print(f"\n✅ Updated {updated_count} team records")
    print(f"💾 Saved to {teams_path}")
    print(f"📊 Total teams: {len(teams_data)}")
    
    return True

if __name__ == '__main__':
    try:
        print("="*60)
        print("NBA TEAMS RECORD UPDATER")
        print("="*60 + "\n")
        
        success = update_team_records()
        
        if success:
            print("\n" + "="*60)
            print("✅ SUCCESS - Teams data is now up to date!")
            print("="*60)
        else:
            print("\n❌ FAILED - Could not update team records")
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()