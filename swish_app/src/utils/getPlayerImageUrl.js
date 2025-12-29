// utils/getPlayerImageUrl.js
import lebron from "/lebron.avif";

export function getPlayerImageUrl(player) {
  const nbaId = player.reference || player.nba_id || player.id;
  if (!nbaId) return lebron; // fallback

  return `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${nbaId}.png`;
}
