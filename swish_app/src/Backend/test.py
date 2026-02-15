from nba_api.stats.endpoints import playercareerstats
import pandas as pd

# Nikola Jokić
career = playercareerstats.PlayerCareerStats(player_id='203999')

# Get as DataFrame - easiest to read and work with
df = career.season_totals_regular_season.get_data_frame()
print("DataFrame format:")
print(df)
print("\n")

# Get specific columns
print("Just points, rebounds, assists:")
print(df[['SEASON_ID', 'PTS', 'REB', 'AST']])
print("\n")

# Get as JSON - useful for sending to frontend
json_data = career.get_json()
print("JSON format (first 200 chars):")
print(json_data[:200])
print("\n")

# Get as dictionary - useful for Python manipulation
dict_data = career.get_dict()
print("Dictionary format:")
print(dict_data.keys())