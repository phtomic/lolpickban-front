/* eslint-disable array-callback-return */
import React from 'react';
import cx from 'classnames';
import Pick from "./Pick";
import topSplash from "../assets/top_splash_placeholder.svg";
import jungSplash from "../assets/jung_splash_placeholder.svg";
import midSplash from "../assets/mid_splash_placeholder.svg";
import botSplash from "../assets/bot_splash_placeholder.svg";
import supSplash from "../assets/sup_splash_placeholder.svg";
import css from './style/index.module.scss';
import Ban from "./Ban";
import teams from '../teams';
const lanes = [topSplash, jungSplash, midSplash, botSplash, supSplash]
const sleep = ms => new Promise(r => setTimeout(r, ms));
const playersInfoDefault = {
    enabled: false,
    team: {},
    blueTeamSelected: {},
    redTeamSelected: {},
    stage: 0
}
export const convertToSlug = (text) => {
    const a = 'àáäâãèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
    const b = 'aaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return text.toString().toLowerCase().trim().replace(/ /g, "")
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special chars
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[\s\W-]+/g, '-') // Replace spaces, non-word characters and dashes with a single dash (-)
}
export default class Overlay extends React.Component {
    state = {
        currentAnimationState: css.TheVoid,
        currentPlayerInfoAnimation: css.TheVoid,
        openingAnimationPlayed: false,
        infoAnimationPlayed: false,
        lastChampion: { image: "", blueTeam: false },
        selectedChampion: false,
        lastPick: {
            key: 0,
            blueTeam: true,
            isBan: true,
            phase: ''
        },
        playersInfo: playersInfoDefault,
        currentPlayerInfo: {
            playerImg: "",
            playerName: "",
            champion: "",
            teamName: "",
            lane: ""
        },
        audio: this.props.audio
    };
    playOpeningAnimation() {
        this.setState({ ...this.state, openingAnimationPlayed: true, playersInfo: playersInfoDefault });
        setTimeout(() => {
            //this.setState({ currentAnimationState: css.AnimationFadeIn });
            setTimeout(() => {
                this.setState({ ...this.state, currentAnimationState: css.AnimationHidden });

                setTimeout(() => {
                    this.setState({ ...this.state, currentAnimationState: css.AnimationTimer + ' ' + css.AnimationBansPick });

                    setTimeout(() => {
                        this.setState({ ...this.state, currentAnimationState: css.AnimationBansPick + ' ' + css.AnimationBansPickOnly });
                        setTimeout(() => {
                            this.setState({ ...this.state, currentAnimationState: css.AnimationPigs, playersInfo: playersInfoDefault });
                        }, 1000);
                    }, 1450);
                }, 700);
            }, 700)
        }, 500);
    }
    getPhase(state) {
        switch (state?.toUpperCase()) {
            case "BAN PHASE 1": return "FASE DE BANIMENTOS 1"
            case "PICK PHASE 1": return "FASE DE SELECAO 1"
            case "BAN PHASE 2": return "FASE DE BANIMENTOS 2"
            case "PICK PHASE 2": return "FASE DE SELECAO 2"
            default: return "PREPARACAO"
        }
    }
    async playersInfoAnimation() {
        let uri = Window.PB.getQueryVariable('backend').split(":")[1].replace(/\/\//g, "").concat(":8998")
        const prom = async () => {
            let team = (this.state.playersInfo.stage < 5) ? this.state.playersInfo.blueTeamSelected : this.state.playersInfo.redTeamSelected
            let indexStage = (this.state.playersInfo.stage < 5) ? this.state.playersInfo.stage : this.state.playersInfo.stage - 5
            if (this.state.playersInfo.stage <= 9) {
                let state = this.state
                await sleep(1000);
                let teamInfo = teams.find((teamT) => teamT.team === team.name)
                let playerName = teamInfo.players[indexStage]
                this.setState({
                    ...this.state,
                    currentPlayerInfoAnimation: css.AnimationPlayerInfo,
                    currentPlayerInfo: {
                        lane: lanes[indexStage],
                        teamName: team.name.toUpperCase(),
                        playerImg: `http://${uri}/players/${convertToSlug(playerName)}.png`,
                        playerName: playerName,
                        champion: state.playersInfo.team[playerName].champion,
                        spell1: state.playersInfo.team[playerName].spell1.icon,
                        spell2: state.playersInfo.team[playerName].spell2.icon
                    }
                })
                await sleep(7000);
                this.setState({ ...state, currentPlayerInfoAnimation: css.TheVoid, playersInfo: { ...state.playersInfo, stage: state.playersInfo.stage + 1 } })
                prom()
            } else {
                window.location.reload()
            }
        }
        prom()
    }
    mapLastChampion(data, self, config) {
        let tmpState = self.state
        let updateState = false
        let lastPick = tmpState.lastPick
        let lastSelection = data[lastPick.blueTeam ? 'blueTeam' : 'redTeam'][lastPick.isBan ? 'bans' : 'picks'][lastPick.key]
        let picksAtivos = false
        const playAudio = (ban=false) => ban?this.props.playBan({forceSoundEnabled:true}):this.props.playPick({forceSoundEnabled:true})
        function changeState(changes) {
            updateState = true
            tmpState = { ...tmpState, ...changes }
        }
        function setS(pick, isBan = false, key, blueTeam) {
            if (
                pick.displayName !== undefined &&
                tmpState.playersInfo?.team?.[pick.displayName.trim().toLowerCase()] !== pick
            )
                changeState({
                    playersInfo: {
                        ...tmpState.playersInfo,
                        team: {
                            ...tmpState.playersInfo.team,
                            [pick.displayName.trim().toLowerCase()]: pick
                        }
                    }
                })

            if (pick.isActive) {
                picksAtivos = true
                let selectedChampion = pick?.champion?.splashCenteredImg || ''
                if (tmpState.selectedChampion !== selectedChampion && selectedChampion !== '' && !selectedChampion?.includes('placeholder')) {
                    if (selectedChampion)
                        changeState({ selectedChampion })
                }
                if (lastPick.key !== key || lastPick.blueTeam !== blueTeam || lastPick.isBan !== isBan) {
                    changeState({
                        selectedChampion: false,
                        lastPick: {
                            key, blueTeam, isBan, phase: data.state
                        },
                        lastChampion: {
                            image: lastSelection?.champion?.splashCenteredImg || '',
                            blueTeam: lastPick.blueTeam,
                            isBan: lastPick.isBan,
                            timeout: Date.now() + 4000
                        },
                        banAnimation: css.AnimationBan
                    });
                    playAudio(lastPick.isBan)
                }
            }

        }
        let update = {}
        if (tmpState.playersInfo.blueTeamSelected.name !== config.frontend.blueTeam.name) update.blueTeamSelected = config.frontend.blueTeam
        if (tmpState.playersInfo.redTeamSelected.name !== config.frontend.redTeam.name) update.redTeamSelected = config.frontend.redTeam
        if (Object.keys(update).length > 0) changeState({ playersInfo: { ...tmpState.playersInfo, ...update } })
        data.blueTeam.picks.forEach((pick, index) => setS(pick, false, index, true))
        data.blueTeam.bans.forEach((pick, index) => setS(pick, true, index, true))
        data.redTeam.picks.forEach((pick, index) => setS(pick, false, index, false))
        data.redTeam.bans.forEach((pick, index) => setS(pick, true, index, false))
        if (data.state !== lastPick.phase && !picksAtivos) {
            changeState({
                selectedChampion: false,
                lastPick: {
                    phase: data.state
                },
                lastChampion: {
                    image: lastSelection?.champion?.splashCenteredImg || '',
                    blueTeam: lastPick.blueTeam,
                    isBan: lastPick.isBan,
                    timeout: Date.now() + 4000
                },
                banAnimation: css.AnimationBan
            });
            playAudio(lastPick.isBan)
        }
        if (updateState) self.setState(tmpState)
    }
    render() {
        const { state, config } = this.props;
        let fase = this.getPhase(state.state)
        let foiBan = this.state.lastChampion?.isBan
        if (state.blueTeam && state.redTeam) {
            this.mapLastChampion(state, this, config)
        }
        if (state.champSelectActive && !this.state.openingAnimationPlayed) {
            this.playOpeningAnimation();
        }

        if (!state.champSelectActive && this.state.openingAnimationPlayed && this.state.infoAnimationPlayed !== true) {
            this.setState({ ...this.state, openingAnimationPlayed: false, currentAnimationState: css.TheAbsoluteVoid, playersInfo: { ...this.state.playersInfo, enabled: true }, infoAnimationPlayed: true });
            this.playersInfoAnimation()
        }

        const renderBans = (teamState) => {
            const list = teamState.bans.map((ban, idx) => <Ban key={`ban-${idx}`} {...ban} />);
            list.splice(3, 0, <div key="ban-spacer" className={css.Spacing} />);
            return <div className={cx(css.BansBox)}>{list}</div>;
        };
        const renderTeam = (teamName, teamConfig, teamState) => (
            <div className={cx(css.Team, teamName)}>
                <div className={css.BansWrapper}>
                    <div className={cx(css.Bans, { [css.WithScore]: config.frontend.scoreEnabled })}>
                        {teamName === css.TeamBlue && config.frontend.scoreEnabled && <div className={css.TeamScore}>
                            {teamConfig.score}
                        </div>}
                        {teamName === css.TeamRed && renderBans(teamState)}
                        <div className={cx(css.TeamName, { [css.WithoutCoaches]: !config.frontend.coachesEnabled })}>
                            {teamConfig.name}
                            {config.frontend.coachesEnabled && <div className={css.CoachName}>
                                Coach: {teamConfig.coach}
                            </div>}
                        </div>
                        {teamName === css.TeamBlue && renderBans(teamState)}
                        {teamName === css.TeamRed && config.frontend.scoreEnabled && <div className={css.TeamScore}>
                            {teamConfig.score}
                        </div>}
                    </div>
                </div>
                <div className={cx(css.Picks)}>
                    {teamState.picks.map((pick, idx) => <Pick key={`pick-${idx}`} config={this.props.config} {...pick} />)}
                </div>
            </div>
        );
        let fadeoutType = (this.state.lastChampion.blueTeam) ? css.AnimationFastFadeOutBlue : css.AnimationFastFadeOutRed
        let banType = (this.state.lastChampion.blueTeam) ? css.AnimationBanBlue : css.AnimationBanRed
        let pickBanImageStyle = {
            height: 700,
            width: 400,
            minWidth: 100,
            margin: 'auto',
            objectFit: 'cover',
            borderRadius: '10px 40px 10px 40px', position: 'absolute', transform: 'translate(-50%, 20%)',
            top: '50%',
            left: '50%',
        }
        return (<>
            <div className={cx(css.Europe, this.state.currentAnimationState)} style={{ "--color-red": config.frontend.redTeam.color, "--color-blue": config.frontend.blueTeam.color, position: 'relative' }}>
                {Object.keys(state).length !== 0 &&
                    <div className={''}>
                        <div className={cx(css.MiddleBox)}>
                            <div className={cx(css.Timer, {
                                [`${css.Red} ${css.Blue}`]: !state.blueTeam.isActive && !state.redTeam.isActive,
                                [css.Blue]: state.blueTeam.isActive,
                                [css.Red]: state.redTeam.isActive
                            })}>
                                <div className={cx(css.Background, css.Blue)} />
                                <div className={cx(css.Background, css.Red)} />
                                {state.timer < 100 && <div className={cx(css.TimerChars)}>
                                    {state.timer.toString().split('').map((char, idx) => <div key={`div-${idx}`}
                                        className={cx(css.TimerChar)}>{char}</div>)}
                                </div>}
                                <div style={{ marginTop: "-15px" }}>{fase}</div>
                                {state.timer >= 100 && <div className={cx(css.TimerChars)}>
                                    {state.timer}
                                </div>}
                            </div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            {this.state.selectedChampion && <img
                                alt='championSelected'
                                className={cx(css.AnimationFadeIn)}
                                src={this.state.selectedChampion}
                                style={pickBanImageStyle} />}
                            {this.state.lastChampion.image !== undefined && this.state.lastChampion.image?.trim()?.length > 0 && this.state.lastChampion.timeout >= Date.now() && <img
                                alt='championFadeOut'
                                className={cx(foiBan ? banType : fadeoutType)}
                                src={this.state.lastChampion.image}
                                style={pickBanImageStyle} />}
                        </div>

                        {renderTeam(css.TeamBlue, config.frontend.blueTeam, state.blueTeam)}
                        {renderTeam(css.TeamRed, config.frontend.redTeam, state.redTeam)}
                    </div>}
            </div>
            {this.state.playersInfo.enabled && <div className={cx(this.state.currentPlayerInfoAnimation)} style={{
                width: 900,
                height: 700,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}>
                <div style={{ display: 'inline', position: 'absolute', width: 400, top: 530, padding: 3, alignContent: 'center', backgroundColor: 'black' }}>
                    <h1 style={{ color: 'white', textAlign: 'center' }}>{this.state.currentPlayerInfo.champion?.name?.trim()}</h1>
                </div>
                <img src={this.state.currentPlayerInfo.champion?.splashCenteredImg} style={{ height: 700, width: 400, minWidth: 100, margin: 'auto', objectFit: 'cover', borderRadius: '10px 80px 10px 80px' }} />
                <div style={{ marginTop: -65, marginLeft: 250 }}>

                    <img src={this.state.currentPlayerInfo.spell1} style={{ width: 60, height: 'auto' }} />
                    <img src={this.state.currentPlayerInfo.spell2} style={{ width: 60, height: 'auto' }} />
                </div>
                <div style={{ marginTop: -650, marginLeft: 500, color: 'white', padding: 30, backgroundColor: "rgb(0,0,0)", borderRadius: 20 }}>
                    <h1>{this.state.currentPlayerInfo.teamName}</h1>
                    <h2 style={{ display: 'inline' }}>{this.state.currentPlayerInfo.playerName}</h2>
                    <img style={{ display: 'block', height: 100, width: 'auto', marginTop: -100, marginLeft: 250 }} src={this.state.currentPlayerInfo.lane} />
                </div>
                <div style={{ marginLeft: 500, color: 'white', padding: 30, borderRadius: 20 }}>
                    <img style={{ display: 'block', height: 400, width: 'auto' }} src={this.state.currentPlayerInfo.playerImg} />
                </div>
            </div>}
        </>
        )
    }
}
