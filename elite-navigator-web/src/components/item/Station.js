import React, {useContext} from 'react';
import StarSystem from './StarSystem';
import {GalaxyContext} from '../Contexts';
import Item from './Item';
import {GiDefenseSatellite, GiPlanetCore} from 'react-icons/all';
import Attributes from '../Attributes';

export default function Station(props) {
    let {station} = props;
    
    let galaxy = useContext(GalaxyContext);
    
    station = galaxy.getStation(station);
    if(!station) {
        return <Item variant="secondary" name={typeof props.station === 'string' ? props.station : '(Station)'}/>;
    }
    
    let Icon = station.planetary ? GiPlanetCore : GiDefenseSatellite;
    
    return (
        <Item variant="warning"
              handle={station}
              icon={<Icon/>}
              sub={station.starDistance ? station.starDistance.toLocaleString() + ' Ls' : ''}
              detail={() => (
                  <Attributes attributes={station.attributes}/>
              )}>
            {station.system && (
                <StarSystem system={station.system}/>
            )}
        </Item>
    );
};
