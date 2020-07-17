import React, {useState} from 'react';
import StarSystem from './StarSystem';
import {sentenceCase} from 'change-case';
import Item from './Item';
import Body from './Body';
import Ship from './Ship';
import SignalSource from './SignalSource';
import Station from './Station';

export default function JournalEntry(props) {
    let {entry} = props;
    
    let [item, setItem] = useState(null);
    
    function cached(obj) {
        if(!item) {
            setItem(obj);
        }
        return obj;
    }
    
    // let galaxy = useContext(GalaxyContext);
    
    let name = sentenceCase(entry.event, {})
        .replace('Uss', 'USS')
        .replace('Fss', 'FSS')
        .replace('Dss', 'DSS');
    
    entry.StarSystem = entry.StarSystem || entry.SystemName;
    
    return (
        <Item variant="muted"
              handle={entry}
              name={name}
              below={(<>
                  {entry.From_Localised && (
                      <small className="text-secondary d-block">{entry.From_Localised}:</small>
                  )}
                  {entry.Message_Localised && (
                      <small className="text-muted d-block">{entry.Message_Localised}</small>
                  )}
              </>)}
              sub={entry.timestamp.getUTCHours().toString().padStart(2, '0') + ':' + entry.timestamp.getUTCMinutes().toString().padStart(2, '0')}>
            {entry.StationName ? (
                <Station station={[entry.StarSystem, entry.StationName]}/>
            ) : entry.Body || entry.BodyName ? (
                <Body body={cached(item || {
                    id: entry.BodyID,
                    name: entry.Body || entry.BodyName,
                    // type: entry.BodyType,
                    system: entry.StarSystem,
                })}/>
            ) : entry.StarSystem && (
                <StarSystem system={entry.StarSystem}/>
            )}
            {entry.Ship_Localised && (
                <Ship ship={cached(item || {
                    name: entry.Ship_Localised,
                    pilot: entry.PilotName_Localised || entry.Commander,
                })}/>
            )}
            {entry.USSType_Localised && (
                <SignalSource signalSource={cached(item || {
                    name: entry.USSType_Localised,
                    threat: entry.USSThreat,
                })}/>
            )}
        </Item>
    );
};
