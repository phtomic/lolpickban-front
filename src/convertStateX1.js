import banImg from "./assets/ban_placeholder.svg";
import midSplash from "./assets/mid_splash_placeholder.svg";

// x1: 1 pick + 3 bans per team
const MAX_PICKS = 1;
const MAX_BANS  = 3;

const makeUrlAbsolute = (url, backendUrl) => {
  if (!url || !url.startsWith('/cache')) return url;
  const http = backendUrl.replace('ws://', 'http://').replace('wss://', 'https://');
  const parts = http.split('/');
  return parts[0] + '//' + parts[2] + url;
};

const putPlaceholders = (team, backendUrl) => {
  // ─── PICKS (only 1 for x1) ───
  for (let i = 0; i < MAX_PICKS; i++) {
    if (i >= team.picks.length) {
      team.picks.push({ champion: { loadingImg: midSplash } });
    } else {
      const pick = team.picks[i];
      if (!pick.champion || !pick.champion.loadingImg) {
        pick.champion = { loadingImg: midSplash };
      }
      if (pick.spell1) pick.spell1.icon = makeUrlAbsolute(pick.spell1.icon, backendUrl);
      if (pick.spell2) pick.spell2.icon = makeUrlAbsolute(pick.spell2.icon, backendUrl);
      pick.champion.loadingImg       = makeUrlAbsolute(pick.champion.loadingImg,       backendUrl);
      pick.champion.splashImg        = makeUrlAbsolute(pick.champion.splashImg,        backendUrl);
      pick.champion.splashCenteredImg = makeUrlAbsolute(pick.champion.splashCenteredImg, backendUrl);
      pick.champion.squareImg        = makeUrlAbsolute(pick.champion.squareImg,        backendUrl);
    }
  }
  // Truncate to MAX_PICKS
  team.picks = team.picks.slice(0, MAX_PICKS);

  // ─── BANS (only 3 for x1) ───
  for (let i = 0; i < MAX_BANS; i++) {
    if (i >= team.bans.length) {
      team.bans.push({ champion: { squareImg: banImg } });
    } else {
      const ban = team.bans[i];
      if (!ban.champion || !ban.champion.squareImg) {
        ban.champion = { squareImg: banImg, loadingImg: ban.champion?.loadingImg };
      }
      ban.champion.loadingImg        = makeUrlAbsolute(ban.champion.loadingImg,        backendUrl);
      ban.champion.squareImg         = makeUrlAbsolute(ban.champion.squareImg,         backendUrl);
      ban.champion.splashCenteredImg = makeUrlAbsolute(ban.champion.splashCenteredImg, backendUrl);
      ban.champion.splashImg         = makeUrlAbsolute(ban.champion.splashImg,         backendUrl);
    }
  }
  // Truncate to MAX_BANS
  team.bans = team.bans.slice(0, MAX_BANS);
};

/**
 * Detects whether the raw backend state is a 1v1 (x1) match.
 * Returns true if each team has at most 1 pick with a real displayName.
 */
export const isX1State = (state) => {
  if (!state?.blueTeam?.picks || !state?.redTeam?.picks) return false;
  const blueRealPicks = state.blueTeam.picks.filter(p => p.displayName).length;
  const redRealPicks  = state.redTeam.picks.filter(p => p.displayName).length;
  // ≤1 real pick per side → treat as x1
  return blueRealPicks <= 1 && redRealPicks <= 1 &&
         (blueRealPicks + redRealPicks) > 0;
};

const convertStateX1 = (state, backendUrl) => {
  if (!state || Object.keys(state).length === 0) return state;
  const stateCopy = JSON.parse(JSON.stringify(state));
  putPlaceholders(stateCopy.blueTeam, backendUrl);
  putPlaceholders(stateCopy.redTeam,  backendUrl);
  return stateCopy;
};

export default convertStateX1;
