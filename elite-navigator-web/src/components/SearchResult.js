import React from 'react';
import Station from './item/Station';
import Module from './item/Module';
import StarSystem from './item/StarSystem';
import Ship from './item/Ship';
import Body from './item/Body';

const resultMap = {
    ship(result) {
        return <Ship ship={result}/>;
    },
    module(result) {
        return <Module module={result}/>;
    },
    system(result) {
        return <StarSystem system={result}/>;
    },
    station(result) {
        return <Station station={result}/>;
    },
    body(result) {
        return <Body body={result}/>;
    },
};

export default function SearchResult(props) {
    let {result} = props;
    
    let renderFn = resultMap[result._type];
    if(!renderFn) {
        console.error('[Search result]', result._type, result);
        throw new Error('Unknown search result type: ' + result._type);
    }
    
    return renderFn(result);
};
