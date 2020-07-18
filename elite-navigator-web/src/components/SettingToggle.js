import React, {useContext} from 'react';
import {SettingsContext} from './Contexts';
import {Form} from 'react-bootstrap';

export default function SettingToggle(props) {
    let {setting, label, inverted, onToggle} = props;
    
    let settings = useContext(SettingsContext);
    
    function onClick(e) {
        settings.set({[setting]: !settings[setting]});
        if(onToggle) {
            onToggle(e);
        }
    }
    
    return (
        <Form>
            <Form.Group className="my-2" onClick={onClick}>
                <Form.Check readOnly checked={!!settings[setting] === !inverted} label={label || setting}/>
            </Form.Group>
        </Form>
    );
};
