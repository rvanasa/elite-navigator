import React from 'react';
import Item from './Item';

export default function Commodity(props) {
    let {commodity} = props;
    
    // let galaxy = useContext(GalaxyContext);
    
    return (
        <Item variant="light" handle={commodity} sub={commodity.amount && 'x' + commodity.amount}>
        
        </Item>
    );
};
