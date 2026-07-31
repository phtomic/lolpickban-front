/* eslint-disable array-callback-return */
import React from 'react';
import cx from 'classnames';
import X1Pick from './X1Pick';
import X1Ban from './X1Ban';
import css from './style/index.module.scss';
import teams from '../teams';

const MAX_BANS = 3; // x1 uses 3 bans per team
const sleep = ms => new Promise(r => setTimeout(r, ms));

export const convertToSlug = (text) => {
    const a = 'àáäâãèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
    const b = 'aaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return text.toString().toLowerCase().trim().replace(/ /g, "")
        .replace(p, c => b.charAt(a.indexOf(c)))
        .replace(/&/g, '-and-')
        .replace(/[\s\W-]+/g, '-')
};

const playersInfoDefault = {
    enabled: false,
    team: {},
    blueTeamSelected: {},
    redTeamSelected: {},
    stage: 0   // 0 = blue player, 1 = red player
};

export default class X1Overlay extends React.Component {
    state = {
        currentAnimationState: css.TheVoid,
        currentPlayerInfoAnimation: css.TheVoid,
        openingAnimationPlayed: false,
        infoAnimationPlayed: false,
        lastChampion: { image: '', blueTeam: false },
        selectedChampion: false,
        lastPick: {
            key: 0,
            blueTeam: true,
            isBan: true,
            phase: ''
        },
        playersInfo: playersInfoDefault,
        currentPlayerInfo: {
            playerImg: '',
            playerName: '',
            champion: '',
            teamName: ''
        }
    };

    /* ─── OPENING ANIMATION ─── */
    playOpeningAnimation() {
        this.setState({ openingAnimationPlayed: true, playersInfo: playersInfoDefault });
        setTimeout(() => {
            setTimeout(() => {
                this.setState({ currentAnimationState: css.AnimationHidden });
                setTimeout(() => {
                    this.setState({ currentAnimationState: css.AnimationTimer + ' ' + css.AnimationBansPick });
                    setTimeout(() => {
                        this.setState({ currentAnimationState: css.AnimationBansPick + ' ' + css.AnimationBansPickOnly });
                        setTimeout(() => {
                            this.setState({ currentAnimationState: css.AnimationPigs, playersInfo: playersInfoDefault });
                        }, 1000);
                    }, 1450);
                }, 700);
            }, 700);
        }, 500);
    }

    /* ─── PHASE LABEL ─── */
    getPhase(state) {
        switch (state?.toUpperCase()) {
            case 'BAN PHASE 1':  return 'BANIMENTOS 1';
            case 'PICK PHASE 1': return 'SELECAO 1';
            case 'BAN PHASE 2':  return 'BANIMENTOS 2';
            case 'PICK PHASE 2': return 'SELECAO 2';
            default:             return 'PREPARACAO';
        }
    }

    /* ─── POST-GAME PLAYER INFO (x1: 2 players — blue then red) ─── */
    async playersInfoAnimation() {
        let uri = Window.PB.getQueryVariable('backend')
            .split(':')[1].replace(/\/\//g, '').concat(':8998');

        const prom = async () => {
            // stage 0 → blue player, stage 1 → red player
            const isBlue = this.state.playersInfo.stage === 0;
            const team = isBlue
                ? this.state.playersInfo.blueTeamSelected
                : this.state.playersInfo.redTeamSelected;

            if (this.state.playersInfo.stage <= 1) {
                const state = this.state;
                await sleep(1000);

                // Find the first real player on this team
                const teamInfo = teams.find(t => t.team === team.name);
                const playerName = teamInfo?.players?.[0] || Object.keys(state.playersInfo.team)[isBlue ? 0 : 1];

                this.setState({
                    ...this.state,
                    currentPlayerInfoAnimation: css.AnimationPlayerInfo,
                    currentPlayerInfo: {
                        teamName: team.name?.toUpperCase() || '',
                        playerImg: `http://${uri}/players/${convertToSlug(playerName)}.png`,
                        playerName: playerName,
                        champion: state.playersInfo.team[playerName]?.champion,
                        spell1: state.playersInfo.team[playerName]?.spell1?.icon,
                        spell2: state.playersInfo.team[playerName]?.spell2?.icon
                    }
                });

                await sleep(7000);
                this.setState({
                    ...state,
                    currentPlayerInfoAnimation: css.TheVoid,
                    playersInfo: { ...state.playersInfo, stage: state.playersInfo.stage + 1 }
                });
                prom();
            } else {
                window.location.reload();
            }
        };
        prom();
    }

    /* ─── TRACK LAST CHAMPION (pick/ban transitions) ─── */
    mapLastChampion(data, self, config) {
        let updateState = false;
        let changes = {};
        let tmpState = self.state;
        let lastPick = tmpState.lastPick;
        let lastSelection = data[lastPick.blueTeam ? 'blueTeam' : 'redTeam']?.[lastPick.isBan ? 'bans' : 'picks']?.[lastPick.key];
        let picksAtivos = false;

        const playAudio = (ban = false) => {
            if (ban && this.props.playBan) {
                this.props.playBan({ forceSoundEnabled: true });
            } else if (this.props.playPick) {
                this.props.playPick({ forceSoundEnabled: true });
            }
        };

        function changeState(newChanges) {
            updateState = true;
            changes = { ...changes, ...newChanges };
            tmpState = { ...tmpState, ...newChanges };
        }

        function setS(pick, isBan, key, blueTeam) {
            if (
                pick.displayName !== undefined &&
                tmpState.playersInfo?.team?.[pick.displayName.trim().toLowerCase()] !== pick
            ) {
                changeState({
                    playersInfo: {
                        ...tmpState.playersInfo,
                        team: {
                            ...tmpState.playersInfo.team,
                            [pick.displayName.trim().toLowerCase()]: pick
                        }
                    }
                });
            }

            if (pick.isActive) {
                picksAtivos = true;
                const selectedChampion = pick?.champion?.splashCenteredImg || '';
                if (
                    tmpState.selectedChampion !== selectedChampion &&
                    selectedChampion !== '' &&
                    !selectedChampion?.includes('placeholder')
                ) {
                    if (selectedChampion) changeState({ selectedChampion });
                }
                if (lastPick.key !== key || lastPick.blueTeam !== blueTeam || lastPick.isBan !== isBan) {
                    changeState({
                        selectedChampion: false,
                        lastPick: { key, blueTeam, isBan, phase: data.state },
                        lastChampion: {
                            image: lastSelection?.champion?.splashCenteredImg || '',
                            blueTeam: lastPick.blueTeam,
                            isBan: lastPick.isBan,
                            timeout: Date.now() + 4000
                        }
                    });
                    playAudio(lastPick.isBan);
                }
            }
        }

        let update = {};
        if (tmpState.playersInfo.blueTeamSelected.name !== config.frontend.blueTeam.name)
            update.blueTeamSelected = config.frontend.blueTeam;
        if (tmpState.playersInfo.redTeamSelected.name !== config.frontend.redTeam.name)
            update.redTeamSelected = config.frontend.redTeam;
        if (Object.keys(update).length > 0)
            changeState({ playersInfo: { ...tmpState.playersInfo, ...update } });

        // Only track pick[0] and bans[0..2] for x1
        if (data.blueTeam.picks[0]) setS(data.blueTeam.picks[0], false, 0, true);
        if (data.redTeam.picks[0])  setS(data.redTeam.picks[0],  false, 0, false);
        data.blueTeam.bans.slice(0, MAX_BANS).forEach((ban, i) => setS(ban, true, i, true));
        data.redTeam.bans.slice(0, MAX_BANS).forEach((ban, i)  => setS(ban, true, i, false));

        if (data.state !== lastPick.phase && !picksAtivos) {
            changeState({
                selectedChampion: false,
                lastPick: { phase: data.state },
                lastChampion: {
                    image: lastSelection?.champion?.splashCenteredImg || '',
                    blueTeam: lastPick.blueTeam,
                    isBan: lastPick.isBan,
                    timeout: Date.now() + 4000
                }
            });
            playAudio(lastPick.isBan);
        }

        if (updateState) self.setState(changes);
    }

    componentDidMount() {
        const { state, config } = this.props;
        if (state?.blueTeam && state?.redTeam) {
            this.mapLastChampion(state, this, config);
        }
        if (state?.champSelectActive && !this.state.openingAnimationPlayed) {
            this.playOpeningAnimation();
        }
    }

    componentDidUpdate(prevProps) {
        const { state, config } = this.props;
        if (!state) return;
        if (prevProps.state !== state) {
            if (state.blueTeam && state.redTeam) {
                this.mapLastChampion(state, this, config);
            }
            if (state.champSelectActive && !this.state.openingAnimationPlayed) {
                this.playOpeningAnimation();
            }
            if (!state.champSelectActive && this.state.openingAnimationPlayed && !this.state.infoAnimationPlayed) {
                this.setState({
                    openingAnimationPlayed: false,
                    currentAnimationState: css.TheAbsoluteVoid,
                    playersInfo: { ...this.state.playersInfo, enabled: true },
                    infoAnimationPlayed: true
                }, () => {
                    this.playersInfoAnimation();
                });
            }
        }
    }

    render() {
        const { state, config } = this.props;
        const fase = this.getPhase(state.state);

        const foiBan = this.state.lastChampion?.isBan;
        const fadeoutType = this.state.lastChampion.blueTeam ? css.AnimationFastFadeOutBlue : css.AnimationFastFadeOutRed;
        const banType     = this.state.lastChampion.blueTeam ? css.AnimationBanBlue : css.AnimationBanRed;

        const isBlueActive = state.blueTeam?.isActive;
        const activeGlowColor  = isBlueActive ? 'rgba(0, 151, 196, 0.45)'  : 'rgba(222, 40, 70, 0.45)';
        const activeBorderColor = isBlueActive ? 'rgba(0, 200, 255, 0.35)' : 'rgba(255, 60, 90, 0.35)';

        const pickBanImageStyle = {
            height: 600,
            width: 380,
            minWidth: 100,
            objectFit: 'cover',
            borderRadius: '12px 40px 12px 40px',
            position: 'absolute',
            transform: 'translate(-50%, 18%)',
            top: '50%',
            left: '50%',
            boxShadow: `0 0 55px ${activeGlowColor}, 0 0 110px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.6)`,
            border: `2px solid ${activeBorderColor}`,
            transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
            zIndex: 0
        };

        /* ─── RENDER BANS (max 3) ─── */
        const renderBans = (teamState) => {
            const list = teamState.bans
                .slice(0, MAX_BANS)
                .map((ban, idx) => <X1Ban key={`ban-${idx}`} {...ban} />);
            return <div className={cx(css.BansBox)}>{list}</div>;
        };

        /* ─── RENDER TEAM PANEL ─── */
        const renderTeam = (panelClass, teamConfig, teamState) => {
            const isActive = teamState.isActive;
            return (
                <div className={cx(css.TeamPanel, panelClass, { [css.IsActive]: isActive })}>
                    <div className={css.TeamBar}>
                        {config.frontend.scoreEnabled && panelClass === css.TeamBlue &&
                            <div className={css.TeamScore}>{teamConfig.score}</div>}
                        <div className={css.TeamName}>{teamConfig.name}</div>
                        {config.frontend.scoreEnabled && panelClass === css.TeamRed &&
                            <div className={css.TeamScore}>{teamConfig.score}</div>}
                    </div>
                    <div className={css.BansWrapper}>
                        <div className={cx(css.Bans)}>
                            {renderBans(teamState)}
                        </div>
                    </div>
                    <div className={cx(css.Picks)}>
                        {teamState.picks[0] &&
                            <X1Pick key="pick-0" config={this.props.config} {...teamState.picks[0]} />}
                    </div>
                </div>
            );
        };

        return (<>
            <div
                className={cx(css.X1, this.state.currentAnimationState)}
                style={{
                    '--color-red':  config.frontend.redTeam.color,
                    '--color-blue': config.frontend.blueTeam.color,
                    position: 'relative'
                }}
            >
                {Object.keys(state).length !== 0 &&
                    <div>
                        {/* ─── CENTER TIMER + VS ─── */}
                        <div className={cx(css.CenterBox)}>
                            <div className={cx(css.Timer, {
                                [css.Blue]: state.blueTeam?.isActive,
                                [css.Red]:  state.redTeam?.isActive
                            })}>
                                <div className={cx(css.Background, css.Blue)} />
                                <div className={cx(css.Background, css.Red)} />
                                {state.timer < 100 && (
                                    <div className={cx(css.TimerChars)}>
                                        {state.timer.toString().split('').map((char, idx) =>
                                            <div key={`tc-${idx}`} className={cx(css.TimerChar)}>{char}</div>
                                        )}
                                    </div>
                                )}
                                {state.timer >= 100 && (
                                    <div className={cx(css.TimerChars)}>{state.timer}</div>
                                )}
                                <div className={css.PhaseText}>{fase}</div>
                                <div className={css.VsWrapper}>
                                    <span className={css.VsText}>VS</span>
                                </div>
                            </div>
                        </div>

                        {/* ─── FLOATING CHAMPION IMAGE (selection preview) ─── */}
                        <div style={{ display: 'flex' }}>
                            {this.state.selectedChampion && (
                                <img
                                    alt="championSelected"
                                    className={cx(css.AnimationFadeIn)}
                                    src={this.state.selectedChampion}
                                    style={pickBanImageStyle}
                                />
                            )}
                            {this.state.lastChampion.image !== undefined &&
                                this.state.lastChampion.image?.trim()?.length > 0 &&
                                this.state.lastChampion.timeout >= Date.now() && (
                                <img
                                    alt="championFadeOut"
                                    className={cx(foiBan ? banType : fadeoutType)}
                                    src={this.state.lastChampion.image}
                                    style={pickBanImageStyle}
                                />
                            )}
                        </div>

                        {/* ─── TEAM PANELS ─── */}
                        {renderTeam(css.TeamBlue, config.frontend.blueTeam, state.blueTeam)}
                        {renderTeam(css.TeamRed,  config.frontend.redTeam,  state.redTeam)}
                    </div>
                }
            </div>

            {/* ─── POST-GAME PLAYER INFO ─── */}
            {this.state.playersInfo.enabled && (
                <div
                    className={cx(this.state.currentPlayerInfoAnimation)}
                    style={{
                        width: 900,
                        height: 700,
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    {/* Champion name */}
                    <div style={{
                        display: 'inline',
                        position: 'absolute',
                        width: 400,
                        top: 530,
                        padding: '8px 16px',
                        alignContent: 'center',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,25,40,0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        borderBottom: '2px solid rgba(255,255,255,0.1)',
                        borderRadius: '0 0 12px 0'
                    }}>
                        <h1 style={{
                            color: 'white',
                            textAlign: 'center',
                            fontFamily: "'Saira Condensed', sans-serif",
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            textShadow: '0 0 20px rgba(255,255,255,0.2)',
                            margin: 0
                        }}>{this.state.currentPlayerInfo.champion?.name?.trim()}</h1>
                    </div>

                    {/* Splash art */}
                    <img
                        src={this.state.currentPlayerInfo.champion?.splashCenteredImg}
                        alt={this.state.currentPlayerInfo.champion?.name || 'Splash'}
                        style={{
                            height: 700,
                            width: 400,
                            minWidth: 100,
                            margin: 'auto',
                            objectFit: 'cover',
                            borderRadius: '10px 80px 10px 80px',
                            boxShadow: '0 0 60px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}
                    />

                    {/* Spells */}
                    <div style={{ marginTop: -65, marginLeft: 250 }}>
                        <img src={this.state.currentPlayerInfo.spell1} alt="Spell 1" style={{
                            width: 60, height: 'auto', borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }} />
                        <img src={this.state.currentPlayerInfo.spell2} alt="Spell 2" style={{
                            width: 60, height: 'auto', borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }} />
                    </div>

                    {/* Player info card */}
                    <div style={{
                        marginTop: -650, marginLeft: 500, color: 'white', padding: 30,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(15,20,35,0.85) 100%)',
                        backdropFilter: 'blur(15px)',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}>
                        <h1 style={{
                            fontFamily: "'Saira Condensed', sans-serif",
                            fontWeight: 800, letterSpacing: '3px',
                            textShadow: '0 0 20px rgba(255,255,255,0.15)',
                            margin: '0 0 10px 0'
                        }}>{this.state.currentPlayerInfo.teamName}</h1>
                        <h2 style={{
                            display: 'inline',
                            fontFamily: "'Saira Condensed', sans-serif",
                            fontWeight: 600, letterSpacing: '1px'
                        }}>{this.state.currentPlayerInfo.playerName}</h2>
                    </div>

                    {/* Player photo */}
                    <div style={{ marginLeft: 500, color: 'white', padding: 30, borderRadius: 16 }}>
                        <img
                            src={this.state.currentPlayerInfo.playerImg}
                            alt="Player"
                            style={{
                                display: 'block', height: 400, width: 'auto',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                            }}
                        />
                    </div>
                </div>
            )}
        </>);
    }
}
