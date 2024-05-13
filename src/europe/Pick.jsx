import React from 'react';
import cx from 'classnames';

import css from './style/index.module.scss';

const Pick = props => {
   return <div className={cx(css.Pick, { [css.Active]: props.isActive })}>
        {props.spell1 && props.spell2 && props.config.frontend.spellsEnabled && props.champion.name && !props.isActive && <div className={cx(css.SummonerSpells)}>
            <img src={props.spell1.icon} alt="" />
            <img src={props.spell2.icon} alt="" />
        </div>}
        <div className={cx(css.PickImage, {
            [css.Active]: props.isActive
        })} style={{justifyContent:'center',display:'flex'}}>
            {props.champion.splashCenteredImg?
               <img src={props.champion.splashCenteredImg} style={{objectPosition:'0px -30px'}} alt="" />:
               <img src={props.champion.loadingImg} style={{height:'auto',width:60,margin:'auto'}} alt="" />
            }
        </div>
        <div className={cx(css.PlayerName)}>
            <span>{props.displayName} ({props.champion.name || "Escolhendo"})</span>
        </div>
    </div>
};

export default Pick;
