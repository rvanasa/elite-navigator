import React from 'react';
import Item from './Item';

export default function Faction(props) {
    const {faction} = props;
    
    // let galaxy = useContext(GalaxyContext);
    
    return (
        <Item variant="success" handle={faction}>
        
        </Item>
    );
};
