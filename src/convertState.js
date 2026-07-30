import banImg from "./assets/ban_placeholder.svg";
import topSplash from "./assets/top_splash_placeholder.svg";
import jungSplash from "./assets/jung_splash_placeholder.svg";
import midSplash from "./assets/mid_splash_placeholder.svg";
import botSplash from "./assets/bot_splash_placeholder.svg";
import supSplash from "./assets/sup_splash_placeholder.svg";

const pickSplashes = [topSplash, jungSplash, midSplash, botSplash, supSplash];

const makeUrlAbsolute = (url, backendUrl) => {
  if (!url || !url.startsWith('/cache')) {
    return url;
  }

  const httpBackendUrl = backendUrl.replace('ws://', 'http://').replace('wss://', 'https://');
  const components = httpBackendUrl.split('/')

  return components[0] + '//' + components[2] + url;
};

const putPlaceholders = (team,  backendUrl) => {
  for (let i = 0; i < 5; i++) {
    // Picks
    // Check if exists
    if (i >= team.picks.length) {
      // Does not exists, push
      team.picks.push({
        champion: {
          loadingImg: pickSplashes[i]
        }
      });
    } else {
      // Exists, check!
      const pick = team.picks[i];
      if (!pick.champion || !pick.champion.loadingImg) {
        pick.champion = {
          loadingImg: pickSplashes[i]
        };
        // pick.spell1 = null;
        // pick.spell2 = null;
      }

      if (pick.spell1) {
        pick.spell1.icon = makeUrlAbsolute(pick.spell1.icon, backendUrl);
      }
      if (pick.spell2) {
        pick.spell2.icon = makeUrlAbsolute(pick.spell2.icon, backendUrl);
      }
      pick.champion.loadingImg = makeUrlAbsolute(pick.champion.loadingImg, backendUrl);
      pick.champion.splashImg = makeUrlAbsolute(pick.champion.splashImg, backendUrl);
      pick.champion.splashCenteredImg = makeUrlAbsolute(pick.champion.splashCenteredImg, backendUrl);
      pick.champion.squareImg = makeUrlAbsolute(pick.champion.squareImg, backendUrl);
    }

    // Bans
    if (i >= team.bans.length) {
      // Does not exist
      team.bans.push({
        champion: {
          squareImg: banImg
        }
      });
    } else {
      const ban = team.bans[i];
      if (!ban.champion || !ban.champion.squareImg) {
         ban.champion = {
            squareImg: banImg,
            loadingImg: ban.champion.loadingImg
         }
      }
      ban.champion.loadingImg = makeUrlAbsolute(ban.champion.loadingImg, backendUrl);
      ban.champion.squareImg = makeUrlAbsolute(ban.champion.squareImg, backendUrl);
      ban.champion.splashCenteredImg = makeUrlAbsolute(ban.champion.splashCenteredImg, backendUrl);
      ban.champion.splashImg = makeUrlAbsolute(ban.champion.splashImg, backendUrl);
    }
  }
};

const convertState = (state, backendUrl) => {
  if (!state || Object.keys(state).length === 0) return state;

  // Deep clone state to prevent mutating globalState in-place
  const stateCopy = JSON.parse(JSON.stringify(state));

  putPlaceholders(stateCopy.blueTeam, backendUrl);
  putPlaceholders(stateCopy.redTeam, backendUrl);

  return stateCopy;
}

export default convertState;
