import React from 'react';
import cx from 'classnames';
import css from './style/index.module.scss';

const X1Pick = props => {
    return (
        <div className={cx(css.Pick, { [css.Active]: props.isActive })}>
            {props.spell1 && props.spell2 && props.config?.frontend?.spellsEnabled && props.champion?.name && !props.isActive &&
                <div className={cx(css.SummonerSpells)}>
                    <img src={props.spell1.icon} alt="" />
                    <img src={props.spell2.icon} alt="" />
                </div>
            }
            <div
                className={cx(css.PickImage, { [css.Active]: props.isActive })}
                style={{ display: 'flex', justifyContent: 'center' }}
            >
                {props.champion?.splashCenteredImg
                    ? <img src={props.champion.splashCenteredImg} alt="" style={{ objectPosition: 'center 10%' }} />
                    : <img src={props.champion?.loadingImg} style={{ height: 'auto', width: 80, margin: 'auto' }} alt="" />
                }
            </div>
            <div className={cx(css.PlayerName)}>
                <span>{props.displayName} {props.champion?.name ? `(${props.champion.name})` : ''}</span>
            </div>
        </div>
    );
};

export default X1Pick;
