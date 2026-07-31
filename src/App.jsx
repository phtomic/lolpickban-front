import React, {useEffect, useState} from 'react';
import Overlay from "./europe/Overlay";
import X1Overlay from "./x1/X1Overlay";
import convertState from './convertState';
import convertStateX1, { isX1State } from './convertStateX1';
import Error from './Error';
import teams from './teams';
import useSound from 'use-sound';
import mypicksound from './assets/pick.mp3'
import mybansound from './assets/ban.mp3'

function App() {
    const [globalState, setGlobalState] = useState({});
    const [layoutMode, setLayoutMode] = useState('europe'); // 'europe' | 'x1'
    const [playPick] = useSound(mypicksound,{
        interrupt:true,
        volume:1,
        playbackRate:1,
        soundEnabled:true
    })
    const [playBan] = useSound(mybansound,{
        interrupt:true,
        volume:1,
        playbackRate:1,
        soundEnabled:true
    })
    const [config, setConfig] = useState({
        frontend: {
            scoreEnabled: false,
            spellsEnabled: true,
            coachesEnabled: false,
            blueTeam: {
                name: "Team Blue",
                score: 0,
                coach: "",
                color: "rgb(0,151,196)"
            },
            redTeam: {
                name: "Team Red",
                score: 0,
                coach: "",
                color: "rgb(222,40,70)"
            },
            patch: ""
        }
    });
    const [error, setError] = useState('');

    useEffect(() => {
        Window.PB.on('newState', state => {
            // Auto-detect x1: if each team has at most 1 real pick (displayName set)
            if (isX1State(state.state)) {
                setLayoutMode('x1');
            }

            setGlobalState(state.state);
            let playersRed = state.state.redTeam.picks.map((player)=>player.displayName?.toLowerCase()?.trim())
            let playersBlue = state.state.blueTeam.picks.map((player)=>player.displayName?.toLowerCase()?.trim())
            teams.forEach((team)=>{
               team.players = team.players.map(player=>player?.toLowerCase()?.trim())
               playersBlue.forEach(player=>{
                  if(team.players.includes(player?.toLowerCase()?.trim())) state.state.config.frontend.blueTeam = {
                     name: team.team,
                     score: team.score,
                     coach: team.coach,
                     color: "rgb(0,151,196)"
                  }
               })
               playersRed.forEach(player=>{
                  if(team.players.includes(player?.toLowerCase()?.trim())) state.state.config.frontend.redTeam = {
                     name: team.team,
                     score: team.score,
                     coach: team.coach,
                     color: "rgb(222,40,70)"
                 }
               })
            })
            setConfig(state.state.config);
        });

        try {
            Window.PB.start();
        } catch {
            setError('error: failed to read backend url query param. make sure you set ?backend=ws://[ip]:[port] as query parameter.')
        }
    }, []);

    if (Window.PB.getQueryVariable('status') === '1') {
        const status = {
            backend: Window.PB.getQueryVariable('backend'),
            error: error,
            config: config,
            layoutMode: layoutMode,
            state: { ...globalState, config: undefined, blueTeam: JSON.stringify(globalState.blueTeam), redTeam: JSON.stringify(globalState.redTeam) }
        }
        return <Error message={`status: ${JSON.stringify(status, undefined, 4)}`} isStatus />
    }

    if (error) {
        return <Error message={error} />
    }

    if (config) {
        // x1 layout: auto-detected when only 1 pick per team
        if (layoutMode === 'x1') {
            return (
                <div className="App">
                    <X1Overlay
                        state={convertStateX1(globalState, Window.PB.backend)}
                        config={config}
                        playPick={playPick}
                        playBan={playBan}
                    />
                </div>
            );
        }

        // Default: europe 5v5 layout
        return (
            <div className="App">
                <Overlay state={convertState(globalState, Window.PB.backend)} config={config} playPick={playPick} playBan={playBan}/>
            </div>
        );
    } else {
        return (
            <Error message='Unable to load configuration' />
        )
    }
}

export default App;
