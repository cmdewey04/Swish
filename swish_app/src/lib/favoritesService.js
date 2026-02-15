// src/lib/favoritesService.js
import { supabase } from "./supabase";

// Get all favorites for a user
export const getFavoritesFromDB = async (userEmail) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("player_id")
    .eq("user_id", userEmail);

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }

  return data.map((f) => f.player_id);
};

// Add a favorite
export const addFavoriteToDB = async (userEmail, playerId) => {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userEmail, player_id: String(playerId) });

  if (error) {
    console.error("Error adding favorite:", error);
    return false;
  }
  return true;
};

// Remove a favorite
export const removeFavoriteFromDB = async (userEmail, playerId) => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userEmail)
    .eq("player_id", String(playerId));

  if (error) {
    console.error("Error removing favorite:", error);
    return false;
  }
  return true;
};

// Check if a player is favorited
export const checkIsFavorite = async (userEmail, playerId) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userEmail)
    .eq("player_id", String(playerId))
    .maybeSingle();

  if (error) {
    console.error("Error checking favorite:", error);
    return false;
  }

  return !!data;
};
