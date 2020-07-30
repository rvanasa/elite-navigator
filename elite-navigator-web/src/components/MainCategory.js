import React from 'react';

export default function MainCategory(props) {
    const {name, children} = props;
    
    return (
        <div className="mt-1 mb-3">
            <h5 className="ml-1 text-light">{name}</h5>
            {children}
        </div>
    );
};
