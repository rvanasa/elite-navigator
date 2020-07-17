import React, {useContext} from 'react';
import Item from './Item';
import {GalaxyContext, SettingsContext} from '../Contexts';
import Attributes from '../Attributes';
import ExpandableList from '../ExpandableList';
import SearchResult from '../SearchResult';
import {GiInterceptorShip} from 'react-icons/all';
import {Form} from 'react-bootstrap';

export default function Ship(props) {
    let {ship} = props;
    
    let galaxy = useContext(GalaxyContext);
    let settings = useContext(SettingsContext);
    
    ship = galaxy.getShip(ship);
    
    function detail({setSelected}) {
        // let nearbyStations = galaxy._sortedSystems.flatMap(system => system.stations.filter(station => station.ships.includes(ship)));
        let nearbyStations = galaxy.getNearestStations(s => s.ships.includes(ship));
        if(settings.useDiscount) {
            nearbyStations = nearbyStations.filter(s => s.system.power === 'Li Yong-Rui');
        }
        return (<>
            {!!nearbyStations.length && (<>
                <Attributes attributes={ship.attributes}/>
                {/*<h6 className="text-muted">Purchase location:</h6>*/}
                <Form>
                    <Form.Group className="my-2"
                                onClick={() => settings.set({useDiscount: !settings.useDiscount}) & setSelected(null)}>
                        <Form.Check readOnly checked={!!settings.useDiscount} label="15% discount"/>
                    </Form.Group>
                </Form>
                <ExpandableList items={nearbyStations} size={2} render={(station, i) => (
                    <SearchResult key={i} result={station}/>
                )}/>
            </>)}
        </>);
    }
    
    return (
        <Item variant="danger"
              handle={ship}
              icon={<GiInterceptorShip/>}
              sub={ship.pilot}
              detail={detail}>
        </Item>
    );
};
