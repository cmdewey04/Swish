// src/components/Player.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import {
  getFavoritesFromDB,
  addFavoriteToDB,
  removeFavoriteFromDB,
  checkIsFavorite,
} from "../lib/favoritesService";
import "../css/Player.css";

const DEFAULT_IMG = "/lebron.avif";

function Player({ player }) {
  const [isFav, setIsFav] = useState(false);
  const { user } = useAuth();

  const displayId = player.id || player.player_id;

  // Check if player is favorited (only for logged-in users)
  useEffect(() => {
    const checkFavorite = async () => {
      if (user) {
        const fav = await checkIsFavorite(user.email, displayId);
        setIsFav(fav);
      }
    };

    if (user) {
      checkFavorite();
      window.addEventListener("favoritesChanged", checkFavorite);
      return () => {
        window.removeEventListener("favoritesChanged", checkFavorite);
      };
    }
  }, [displayId, user]);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return; // Safety check

    if (isFav) {
      await removeFavoriteFromDB(user.email, displayId);
    } else {
      await addFavoriteToDB(user.email, displayId);
    }

    setIsFav(!isFav);
    window.dispatchEvent(new Event("favoritesChanged"));
  };

  const imgSrc = player.id
    ? `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${player.id}.png`
    : DEFAULT_IMG;

  return (
    <Link to={`/players/${displayId}`} className="player-card-explore">
      {/* Only show favorite button if user is logged in */}
      {user && (
        <button
          onClick={handleFavorite}
          className={`player-favorite-btn ${isFav ? "favorited" : ""}`}
          title={isFav ? "Remove from favorites" : "Add to favorites"}
        >
          {isFav ? (
            <HeartFilledIcon width={20} height={20} />
          ) : (
            <HeartIcon width={20} height={20} />
          )}
        </button>
      )}

      <div className="player-card-header">
        <img
          src={imgSrc}
          alt={player.full_name}
          className="player-headshot"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextElementSibling.style.display = "flex";
          }}
        />
        <div className="player-headshot-placeholder">
          {player.full_name
            ?.split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
      </div>

      <div className="player-card-body">
        <h3 className="player-name-explore">{player.full_name}</h3>
        <p className="player-team-explore">{player.team_name}</p>
        <div className="player-position-badge">{player.position}</div>

        {player.active === false ? (
          <div className="player-inactive-label">Inactive / Injured</div>
        ) : (
          <div className="player-stats-row">
            <div className="stat-item-explore">
              <span className="stat-label-explore">PPG</span>
              <span className="stat-value-explore">{player.ppg ?? "-"}</span>
            </div>
            <div className="stat-item-explore">
              <span className="stat-label-explore">RPG</span>
              <span className="stat-value-explore">{player.rpg ?? "-"}</span>
            </div>
            <div className="stat-item-explore">
              <span className="stat-label-explore">APG</span>
              <span className="stat-value-explore">{player.apg ?? "-"}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default Player;
