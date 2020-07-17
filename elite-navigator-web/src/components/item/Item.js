import React, {useContext, useState} from 'react';
import {FilterContext, SearchContext, SelectContext} from '../Contexts';
import Attributes from '../Attributes';
import {Swipeable} from 'react-swipeable';

export default function Item(props) {
    let {handle, variant, icon, name, sub, below, detail, children} = props;
    
    let [isSelected, setSelected] = useState(false);
    let [subSelected, setSubSelected] = useState(null);
    
    let filterContext = useContext(FilterContext);
    let selectContext = useContext(SelectContext);
    let searchContext = useContext(SearchContext);
    
    handle = handle || `${variant}${name}${sub}`;/////
    if(!name) {
        name = handle.name;
    }
    
    if(selectContext.ancestors.includes(handle)) {
        return null;
    }
    
    if(selectContext.selected !== handle) {
        isSelected = false;
    }
    else if(subSelected) {
        isSelected = true;
    }
    
    if(!isSelected && selectContext.selected) {
        variant = 'muted';
    }
    
    function toggleSelected() {
        setSelected(!isSelected);
        selectContext.setSelected(isSelected ? null : handle);
    }
    
    let relevantAttributes = null;
    if(searchContext && handle.attributes) {
        relevantAttributes = {};
        Object.entries(handle.attributes).forEach(([k, v]) => {
            if((!name || !name.includes(v)) && searchContext.isRelevant(v)) {
                relevantAttributes[k] = v;
            }
        });
    }
    
    let isFavorite = filterContext.favorites.includes(handle);/////
    
    let favoriteColor = '#5b5ad5';
    let borderStyle = 'solid 2px ' + (isFavorite ? favoriteColor : '#424345');
    
    function renderDetail() {
        let subSelectContext = {
            selected: subSelected,
            setSelected: setSubSelected,
            ancestors: [...selectContext.ancestors, handle],
        };
        return (
            <SelectContext.Provider value={subSelectContext}>
                <div className="p-2 pt-1" style={{background: '#080808'}}>
                    {detail && detail(subSelectContext)}
                    {children}
                </div>
            </SelectContext.Provider>
        );
    }
    
    return (
        <div className="m-0 mb-1 rounded-lg"
             style={{
                 background: isSelected ? '#333' : '#222',
                 borderLeft: detail ? `solid 6px ${isFavorite ? favoriteColor : '#76777A'}` : borderStyle,
                 borderTop: borderStyle,
                 borderRight: borderStyle,
                 borderBottom: borderStyle,
             }}>
            <Swipeable
                onSwipedLeft={() => filterContext.removeFavorite(handle)}
                onSwipedRight={() => filterContext.addFavorite(handle)}>
                <div className="cursor-pointer p-2"
                     onClick={selectContext && detail && (e => e.stopPropagation() & toggleSelected())}>
                    <div className="d-flex">
                        {(icon || name) && (
                            <span className={`m-0 text-${variant} flex-grow-1`}>
                                {icon && (
                                    <span
                                        className="mr-2"
                                        style={{position: 'relative', top: '-2px', opacity: .9}}>
                                        {icon}
                                    </span>
                                )}
                                {name}
                            </span>
                        )}
                        {sub && (
                            <small className={`float-right text-${variant}`}
                                   style={{marginTop: '2px', whiteSpace: 'nowrap', opacity: .9}}>
                                {sub}
                            </small>
                        )}
                    </div>
                    {below}
                    {!isSelected && relevantAttributes && (
                        <Attributes hideKeys attributes={relevantAttributes}/>
                    )}
                </div>
            </Swipeable>
            {!isSelected && (<>
                {children && (
                    <div className="px-2">
                        {children}
                    </div>
                )}
            </>)}
            {isSelected && renderDetail()}
        </div>
    );
};
