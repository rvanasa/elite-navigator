import React from 'react';
import Item from './Item';

export default function Material(props) {
    let {material} = props;
    
    // let galaxy = useContext(GalaxyContext);
    
    return (
        <Item variant="light" handle={material} sub={material.amount}>
        
        </Item>
    );
};
