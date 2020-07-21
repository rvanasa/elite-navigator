import React, {useContext} from 'react';
import Item from './Item';
import {GalaxyContext, SettingsContext} from '../Contexts';
import ExpandableList from '../ExpandableList';
import SearchResult from '../SearchResult';
import Attributes from '../Attributes';
import Ship from './Ship';
import SettingToggle from '../SettingToggle';

export default function Module(props) {
    let {module} = props;
    
    let galaxy = useContext(GalaxyContext);
    let settings = useContext(SettingsContext);
    
    module = galaxy.getModule(module);
    
    function detail({setSelected}) {
        // let nearbyStations = galaxy._sortedSystems.flatMap(system => system.stations.filter(station => station.modules.includes(module)));
        let nearbyStations = galaxy.getNearestStations(s => s.modules.includes(module));
        if(settings.onlyDiscounts) {
            nearbyStations = nearbyStations.filter(s => s.system.power === 'Li Yong-Rui');
        }
        return (<>
            {module.ship && (
                <Ship ship={module.ship}/>
            )}
            <Attributes attributes={module.attributes}/>
            {/*<h6 className="text-muted">Purchase location:</h6>*/}
            <SettingToggle setting="onlyDiscounts" label="15% discount" onToggle={() => setSelected(null)}/>
            <ExpandableList items={nearbyStations} size={2} render={(station, i) => (
                <SearchResult key={i} result={station}/>
            )}/>
        </>);
    }
    
    return (
        <Item variant="danger"
              handle={module}
              name={`${module.class + module.rating} ${module.name}`}
              sub={(module.ship && module.ship.name) || module.mode}
              detail={detail}>
        </Item>
    );
};
