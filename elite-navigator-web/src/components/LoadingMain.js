import React from 'react';

import './App.scss';


export default function LoadingMain(props) {
    let {text} = props;

    return (
        <div style={{marginTop: '20vh'}}>
            <div style={{maxWidth: '960px', animationDuration: '1s'}}>
                <h4 className="text-center text-light mb-5 animate-fade-in" style={{animationDuration: '1s'}}>
                    {text}
                </h4>
                <img className="d-block mx-auto animate-fade-in" style={{animationDuration: '4s'}}
                     src="img/favicon.png" alt="Loading..."/>
            </div>
        </div>
    );
}
