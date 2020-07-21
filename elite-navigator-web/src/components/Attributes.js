import React from 'react';

export default function Attributes(props) {
    let {attributes, hideKeys} = props;
    
    if(!attributes) {
        return null;
    }
    
    return (<>
        {Object.entries(attributes).filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
                {!hideKeys && k !== v && (
                    <small className="text-secondary">{k}:</small>
                )}
                <small className="text-muted d-inline-block">{typeof v === 'number' ? v.toLocaleString() : v}</small>
            </div>
        ))}
    </>);
};
