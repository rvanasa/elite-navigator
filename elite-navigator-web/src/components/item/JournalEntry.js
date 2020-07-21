import React, {useState} from 'react';
import StarSystem from './StarSystem';
import {sentenceCase} from 'change-case';
import Item from './Item';
import Body from './Body';
import Ship from './Ship';
import SignalSource from './SignalSource';
import Station from './Station';

export default function JournalEntry(props) {
    let {entry, internal} = props;

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

    let internalComponent = (<>
        {entry.StarSystem && (
            entry.StationName ? (
                <Station station={[entry.StarSystem, entry.StationName]}/>
            ) : entry.Body || entry.BodyName ? (
                <Body body={cached(item || {
                    _type: 'body',
                    id: entry.BodyID,
                    name: entry.Body || entry.BodyName,
                    type: entry.PlanetClass || (entry.StarType && `${entry.StarType + entry.Subclass}-${entry.Luminosity} star`),
                    system: entry.StarSystem,
                    // starDistance: Math.round(entry.DistanceFromArrivalLS),
                    attributes: {
                        'Type': entry.PlanetClass,
                        'Earth masses': entry.MassEM,
                        'Atmosphere': sentenceCase(entry.Atmosphere || ''),
                        'Volcanism': sentenceCase(entry.Volcanism || ''),
                        'Landable': entry.Landable && 'Landable',
                        'State': entry.TerraformState,
                        'Discovered': !entry.wasDiscovered && 'Discovered',
                    },
                })}/>
            ) : (
                <StarSystem system={entry.StarSystem}/>
            )
        )}
        {entry.Ship_Localised && (
            <Ship ship={cached(item || {
                _type: 'ship',
                name: entry.Ship_Localised,
                pilot: entry.PilotName_Localised || entry.Commander,
            })}/>
        )}
        {entry.USSType_Localised && (
            <SignalSource signalSource={cached(item || {
                _type: 'signal',
                name: entry.USSType_Localised,
                threat: entry.USSThreat,
            })}/>
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
              sub={entry.timestamp.getUTCHours().toString().padStart(2, '0') + ':' + entry.timestamp.getUTCMinutes().toString().padStart(2, '0')}>
            {internalComponent}
        </Item>
    );
};
