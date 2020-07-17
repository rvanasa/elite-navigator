import React from 'react';
import StarSystem from './StarSystem';
import Item from './Item';
import {GiAsteroid, GiVibratingBall, IoMdPlanet} from 'react-icons/all';

export default function Body(props) {
    let {body} = props;
    
    // let galaxy = useContext(GalaxyContext);
    
    // let body = {name: body, type: }
    
    let Icon = body.starDistance ? IoMdPlanet : GiVibratingBall;
    
    return (
        <Item
            variant="success"
            handle={body}
            icon={<Icon/>}
            name={body.name || '(Body)'}
            sub={body.starDistance ? body.starDistance.toLocaleString() + ' Ls' : ''}
            detail={() => (
                body.rings && body.rings.map((ring, i) => (
                    <Item
                        key={i}
                        variant="info"
                        handle={ring}
                        name={ring.name}
                        icon={<GiAsteroid/>}
                        sub={ring.type}/>
                )))}>
            <StarSystem system={body.system}/>
        </Item>
    );
};
