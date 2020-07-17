import React from 'react';
import Item from './Item';
import {capitalCase} from 'change-case';

export default function SignalSource(props) {
    let {signalSource} = props;
    
    // let galaxy = useContext(GalaxyContext);
    
    return (
        <Item
            variant="muted"
            handle={signalSource}
            name={`${capitalCase(signalSource.name)} (Threat ${signalSource.threat || 0})` || '(Unknown)'}>
        
        </Item>
    );
};
