import React, {useContext, useState} from 'react';
import StarSystem from './StarSystem';
import {sentenceCase} from 'change-case';
import Item from './Item';
import Body from './Body';
import Ship from './Ship';
import SignalSource from './SignalSource';
import Station from './Station';
import {
    createBodyFromJournalEntry,
    createShipFromJournalEntry,
    createSignalFromJournalEntry,
} from '../../services/player-service';
import {GalaxyContext} from '../Contexts';

export default function JournalEntry(props) {
    let {entry, internal} = props;

    let [item, setItem] = useState(null);

    function cached(obj) {
        if(!item) {
            setItem(obj);
        }
        return obj;
    }

    let galaxy = useContext(GalaxyContext);

    let name = sentenceCase(entry.event, {})
        .replace('Uss', 'USS')
        .replace('Fss', 'FSS')
        .replace('Dss', 'DSS');

    entry.StarSystem = entry.StarSystem || entry.SystemName;

    let time = new Date(entry.timestamp);

    let internalComponent = (<>
        {entry.StarSystem && (
            entry.StationName ? (
                <Station station={[entry.StarSystem, entry.StationName]}/>
            ) : entry.Body || entry.BodyName ? (
                <Body body={cached(item || galaxy.getBody(entry.BodyName) || createBodyFromJournalEntry(entry))}/>
            ) : (
                <StarSystem system={entry.StarSystem}/>
            )
        )}
        {entry.Ship_Localised && (
            <Ship ship={cached(item || createShipFromJournalEntry(entry))}/>
        )}
        {entry.USSType_Localised && (
            <SignalSource signalSource={cached(item || createSignalFromJournalEntry(entry))}/>
        )}
    </>);

    if(internal) {
        return internalComponent;
    }

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
              sub={time.getUTCHours().toString().padStart(2, '0') + ':' + time.getUTCMinutes().toString().padStart(2, '0')}>
            {internalComponent}
        </Item>
    );
};
