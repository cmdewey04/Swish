// src/pages/Favorites.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Player from "../components/Player";
import { getFavoritesFromDB } from "../lib/favoritesService";
import { useAuth } from "../contexts/AuthContext";
import PLAYERS from "../Backend/data/players.json";

const Favorites = () => {
  const [favoritePlayers, setFavoritePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadFavorites = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const favoriteIds = await getFavoritesFromDB(user.email);
    const players = PLAYERS.filter((p) =>
      favoriteIds.includes(String(p.id)),
    ).sort((a, b) => (b.ppg || 0) - (a.ppg || 0));

    setFavoritePlayers(players);
    setLoading(false);
  };

  useEffect(() => {
    loadFavorites();
    window.addEventListener("favoritesChanged", loadFavorites);
    return () => window.removeEventListener("favoritesChanged", loadFavorites);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading favorites...</p>
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-b border-slate-700/50 backdrop-blur-sm">
          <div className="px-4 py-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-slate-50 mb-2">Favorites</h1>
          </div>
        </div>

        <div className="px-4 py-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-slate-300 mb-2">
              Sign in to access favorites
            </h3>
            <p className="text-slate-500 mb-6">
              You need to be logged in to save and view your favorite players
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-800 rounded-md text-white font-semibold hover:shadow-lg transition-all"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - show favorites
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-50 mb-2">
            {user.name.split(" ")[0]}'s Favorites
          </h1>
          <p className="text-base text-slate-400">
            {favoritePlayers.length} favorite player
            {favoritePlayers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="px-4 py-8 max-w-7xl mx-auto">
        {favoritePlayers.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-slate-300 mb-2">
              No favorites yet
            </h3>
            <p className="text-slate-500 mb-6">
              Start adding players to your favorites
            </p>
            <Link
              to="/explore"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-800 rounded-md text-white font-semibold"
            >
              Explore Players
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoritePlayers.map((player) => (
              <Player key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
