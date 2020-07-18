import React, {useContext, useState} from 'react';
import {FilterContext, SearchContext, SelectContext} from '../Contexts';
import Attributes from '../Attributes';
import {Swipeable} from 'react-swipeable';

export default function Item(props) {
    let {handle, variant, icon, name, sub, below, detail, children} = props;
    
    let [isSelected, setSelected] = useState(false);
    let [detailSelected, setDetailSelected] = useState(null);
    
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
    else if(detailSelected) {
        isSelected = true;
    }
    
    if(!isSelected && selectContext.selected) {
        variant = 'muted';
    }
    
    function toggleSelected() {
        setSelected(!isSelected);
        selectContext.setSelected(isSelected ? null : handle);
        setDetailSelected(null);///
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
    
    function renderDetail() {
        let subSelectContext = {
            selected: detailSelected,
            setSelected: item => setDetailSelected(item) & setSelected(true),
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
    
    let borderColor = '#424345';
    let favoriteColor = '#5b5ad5';
    let borderStyle = 'solid 2px ' + (isFavorite ? favoriteColor : borderColor);
    
    return (
        <div className="m-0 mb-1 rounded-lg"
             style={{
                 background: isSelected ? '#333' : '#1A1A1A',
                 borderLeft: detail ? `solid 6px ${!isSelected && selectContext.selected ? borderColor : isFavorite ? favoriteColor : '#76777A'}` : borderStyle,
                 borderTop: borderStyle,
                 borderRight: borderStyle,
                 borderBottom: borderStyle,
                 // animation: isFavorite && 'swipe-right .4s ease-out',
             }}>
            <Swipeable
                onSwipedLeft={() => filterContext.removeFavorite(handle)}
                onSwipedRight={() => filterContext.addFavorite(handle)}>
                <div className="cursor-pointer p-2"
                     style={{
                         opacity: !isSelected && selectContext.selected ? .8 : 1,/////
                     }}
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
