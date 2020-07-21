import React, {useContext, useState} from 'react';
import {FilterContext} from './Contexts';

export default function ExpandableList(props) {
    let {items, size, ignoreFilter, ignoreSort, render} = props;
    
    let [maxItems, setMaxItems] = useState(size || 1);
    
    let filterContext = useContext(FilterContext);
    
    if(!items || !items.length) {
        return null;
    }
    
    if(filterContext) {
        if(!ignoreFilter) {
            items = items.filter(filterContext.filter);
        }
        if(!ignoreSort) {
            items = [...items.filter(x => filterContext.favorites.includes(x)), ...items.filter(x => !filterContext.favorites.includes(x))];
        }
    }
    
    return (
        <div className="my-1">
            {items.slice(0, maxItems).map(render)}
            {items.length > maxItems && (
                <span className="btn btn-outline-secondary d-block mt-2"
                      onClick={() => setMaxItems(maxItems * 2)}>
                    Show more
                </span>
            )}
        </div>
    );
};
