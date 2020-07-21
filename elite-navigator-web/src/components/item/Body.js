import React, {useContext} from 'react';
import StarSystem from './StarSystem';
import Item from './Item';
import {BsBrightnessLow, GiAsteroid, GiVibratingBall, IoMdPlanet} from 'react-icons/all';
import {GalaxyContext} from '../Contexts';
import Attributes from '../Attributes';

export default function Body(props) {
    let {body} = props;
    
    let galaxy = useContext(GalaxyContext);
    
    body = galaxy.getBody(body);
    if(!body) {
        return <Item variant="secondary" name={typeof props.body === 'string' ? props.body : '(Body)'}/>;
    }
    
    let system = galaxy.getSystem(body.system);
    
    let Icon = body.type && body.type.toLowerCase().includes('star') ? BsBrightnessLow : GiVibratingBall/*IoMdPlanet*/;
    
    return (
        <Item
            variant="success"
            handle={body}
            icon={<Icon/>}
            name={body.name || '(Body)'}
            sub={body.starDistance ? body.starDistance.toLocaleString() + ' Ls' : ''}
            below={<small className="text-muted">{body.type}</small>}
            detail={() => (<>
                <Attributes attributes={body.attributes}/>
                {body.rings && body.rings.map((ring, i) => (
                    <Item
                        key={i}
                        variant="info"
                        handle={ring}
                        name={ring.name}
                        icon={<GiAsteroid/>}
                        sub={ring.type}/>
                ))}
            </>)}>
            {system && (
                <StarSystem system={system}/>
            )}
        </Item>
    );
};
