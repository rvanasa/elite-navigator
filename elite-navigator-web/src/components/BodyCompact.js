import React, {useContext} from 'react';
import {GalaxyContext} from './Contexts';
import classNames from 'classnames';

export default function Body(props) {
    let {body, player} = props;

    let galaxy = useContext(GalaxyContext);

    body = galaxy.getBody(body);
    // if(!body) {
    //     return <Item variant="secondary" name={typeof props.body === 'string' ? props.body : '(Body)'}/>;
    // }

    // let system = galaxy.getSystem(body.system);
    //
    // let Icon = body.type && body.type.toLowerCase().includes('star') ? BsBrightnessLow : GiVibratingBall/*IoMdPlanet*/;

    let systemName = typeof body.system === 'string' ? body.system : (galaxy.getSystem(body.system) || {}).name;

    let playerMapped = player && player.getMostRecent(entry => entry.event === 'SAAScanComplete' && entry.BodyName === body.name);

    return (
        // <Item
        //     variant="success"
        //     handle={body}
        //     icon={<Icon/>}
        //     name={body.name || '(Body)'}
        //     sub={body.starDistance ? body.starDistance.toLocaleString() + ' Ls' : ''}
        //     below={<small className="text-muted">{body.type}</small>}
        //     detail={() => (<>
        //         <Attributes attributes={body.attributes}/>
        //         {body.rings && body.rings.map((ring, i) => (
        //             <Item
        //                 key={i}
        //                 variant="info"
        //                 handle={ring}
        //                 name={ring.name}
        //                 icon={<GiAsteroid/>}
        //                 sub={ring.type}/>
        //         ))}
        //     </>)}>
        //     {system && (
        //         <StarSystem system={system}/>
        //     )}
        // </Item>
        <div className={classNames('d-flex py-2', playerMapped && 'text-success')}
             style={{background: 'black', opacity: playerMapped && .6}}>
            <div className="px-3" style={{minWidth: '60px'}}>
                <h4 className="mb-0">{body.name.replace(systemName, '').trim()}</h4>
            </div>
            <div>
                <div style={{marginTop: '4px'}}>{body.type}</div>
                {/*<Attributes attributes={body.attributes}/>*/}
            </div>
        </div>
    );
};
