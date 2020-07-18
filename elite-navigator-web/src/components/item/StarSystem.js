import React, {useContext} from 'react';
import {GalaxyContext} from '../Contexts';
import Item from './Item';
import ExpandableList from '../ExpandableList';
import SearchResult from '../SearchResult';
import Attributes from '../Attributes';
import {BsBrightnessLow} from 'react-icons/all';

export default function StarSystem(props) {
    let {system} = props;
    
    let galaxy = useContext(GalaxyContext);
    
    system = galaxy.getSystem(system);
    if(!system) {
        return <Item variant="secondary" name={typeof props.system === 'string' ? props.system : '(System)'}/>;
    }
    
    return (
        <Item
            // variant="info"
            handle={system}
            icon={<BsBrightnessLow/>}
            sub={system._currentDistance ? system._currentDistance.toLocaleString() + ' Ly' : null}
            below={
                system.permitRequired && (
                    <small className="text-danger ml-2">Permit required</small>
                )}
            detail={() => (<>
                <Attributes attributes={system.attributes}/>
                <ExpandableList items={system.stations} size={5} render={(item, i) => (
                    <SearchResult key={i} result={item}/>
                )}/>
                {/*<ExpandableList items={system.bodies} size={5} render={(item, i) => (*/}
                {/*    <SearchResult key={i} result={item}/>*/}
                {/*)}/>*/}
            </>)}>
        </Item>
    );
};
