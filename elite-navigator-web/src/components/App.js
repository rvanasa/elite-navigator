import React, {useState} from 'react';

import './App.scss';
import {Button, InputGroup, Tab, Tabs} from 'react-bootstrap';
import {sentenceCase} from 'change-case';
import {tryConnect} from '../services/connection-service';
import {FilterContext, GalaxyContext, SearchContext, SelectContext, SettingsContext} from './Contexts';
import {findGalaxy, getDefaultGalaxy} from '../services/galaxy-service';
import JournalEntry from './item/JournalEntry';
import {createBodyFromJournalEntry, Player} from '../services/player-service';
import {FiMapPin, FiRadio, FiSearch} from 'react-icons/all';
import SearchResult from './SearchResult';
import ExpandableList from './ExpandableList';
import StarSystem from './item/StarSystem';
import Body from './item/Body';
import Category from './item/Category';
import Station from './item/Station';
import queryString from 'query-string';
import BodyCompact from './compact/BodyCompact';
import SettingToggle from './SettingToggle';
import LoadingMain from './LoadingMain';

let connectionListener = null;

let allowAutoConnect = true;

export default function App() {
    let [settings, setSettings] = useState(null);
    let [player, setPlayer] = useState(null);
    let [galaxy, setGalaxy] = useState(null);
    let [connection, setConnection] = useState(null);
    let [reconnecting, setReconnecting] = useState(null);
    let [customSystemName, setCustomSystemName] = useState('');
    let [currentTab, setCurrentTab] = useState(undefined);
    let [searchQuery, setSearchQuery] = useState('');
    let [searchResults, setSearchResults] = useState([]);
    let [favorites, setFavorites] = useState([]);
    let [selected, setSelected] = useState(null);

    let {layout} = queryString.parse(window.location.search);

    if(!settings) {
        settings = {
            set(changes) {
                setSettings({...settings, ...changes});
            },
        };
        setSettings(settings);
    }

    if(!player) {
        player = new Player();
        setPlayer(player);
    }

    function sendMessage(msg, role) {
        console.log('Sending message:', msg, role);
        connection.emit('msg', msg, role);
    }

    function transmitSettings(settings) {
        if(layout === 'overlay') {
            return;
        }
        if(settings.hasOwnProperty('overlay')) {
            sendMessage({
                overlay: settings.overlay || null,
            }, 'uplink');
        }
    }

    function promptConnect() {
        disconnect();
        // bootbox.prompt({
        //     title: 'Connect to IP address:',
        //     value: connection ? connection.io.uri.replace('ws://', '') : localStorage['websocket'] || 'localhost',
        //     callback: address => {
        //         if(address) {
        //             localStorage['websocket'] = address || '';
        //             connect(address)
        //                 .catch(err => console.error(err));
        //         }
        //     },
        // });
        connect()
            .catch(err => console.error(err));
    }

    async function connect(roomName) {
        setReconnecting(true);
        connection = await tryConnect(roomName);
        setConnection(connection);
        setReconnecting(false);
        return connection;
    }

    function disconnect() {
        if(connection) {
            connection.close();
        }
        setConnection(null);
        setReconnecting(false);
        setPlayer(null);
    }

    if(connection) {
        if(connectionListener) {
            connection.removeListener('msg', connectionListener);
        }
        connectionListener = (msg, id, role) => {
            if(!role && msg.joinedAsRole === 'uplink') {
                transmitSettings(settings);
            }
            if(role === 'uplink') {
                if(msg.overlay) {
                    setSettings({...settings, overlay: msg.overlay});
                }
                player.update(msg);
            }
            setPlayer(null);
            if(role || !msg.resetPlayer) {
                setPlayer(player);
            }
        };
        connection.on('msg', connectionListener);
    }
    // useEffect(() => {
    //     if(connection) {
    //         return () => connection.removeListener('message', listener);
    //     }
    // });

    if(/*storedAddress && */allowAutoConnect) {
        allowAutoConnect = false;
        // let timeout = setTimeout(() => disconnect(), 1000);
        connect()
            //     .then(() => clearTimeout(timeout))
            .catch(err => console.error(err));
    }

    if(!galaxy) {
        if(layout === 'overlay') {
            galaxy = getDefaultGalaxy();
            // setGalaxy(galaxy);
        }
        else {
            findGalaxy().then(galaxy => setGalaxy(galaxy));
            return (
                <LoadingMain text="Loading galaxy data..."/>
            );
        }
    }

    let playerSystem = player.getCurrentSystem(galaxy);
    let relativeSystem = galaxy.setRelativeSystem(galaxy.getSystem(parseInt(customSystemName) ? null : customSystemName) || playerSystem || 'Sol');

    if(layout === 'overlay' && !relativeSystem) {
        return (
            <LoadingMain text="Loading player data..."/>
        );
    }

    if(!currentTab) {
        // currentTab = playerSystem ? 'nearby' : 'settings';
        currentTab = 'settings';
        setCurrentTab(currentTab);
    }

    let hideEvents = ['Music', 'FSSSignalDiscovered'];

    function isEntryVisible(entry) {
        return !hideEvents.includes(entry.event);
    }

    function doSearch(searchText) {
        // setCurrentTab(searchText ? 'search' : undefined);
        if(searchText) {
            setCurrentTab('search');
        }
        else {
            searchText = '';
        }
        setSearchQuery(searchText);
        setSearchResults(galaxy.search(searchText));
        setSelected(null);
    }

    function doFilter(item) {
        // return item._type !== 'station' || item.type !== 'Fleet Carrier';
        return true;
    }

    let searchBarElem = null;

    function onSelectTab(tab) {
        setCurrentTab(tab);
        setSelected(null);
        if(tab === 'search' && searchBarElem) {
            if(currentTab === 'search' && searchBarElem.value) {
                searchBarElem.value = '';
                // setSearchQuery('');
                // setSearchResults([]);
                doSearch();
            }
            else {
                searchBarElem.select();
            }
            searchBarElem.focus();
        }
    }

    function isSearchRelevant(text) {
        return galaxy._isSearchRelevant(searchQuery, text);
    }

    function addFavorite(item) {
        if(!item._type) {
            return;/////
        }
        setFavorites([item, ...favorites.filter(x => x !== item)]);
    }

    function removeFavorite(item) {
        setFavorites(favorites.filter(x => x !== item));
    }

    if(layout === 'overlay') {
        document.body.style.backgroundColor = '#0000';
    }

    let overlayContent = () => {
        let starEntries = player.journal
            .filter(e => e.event === 'Scan' && e.StarSystem === relativeSystem.name && e.StarType)
            .reverse();
        return (<>
            <h6 className="text-info" style={{opacity: .5}}>
                {starEntries.map(e => e.StarType + e.Subclass + ' ' + e.Luminosity).join(', ')}
            </h6>
            {/*<SearchContext.Provider*/}
            {/*    value={{isRelevant: v => v === 'Terraformable'}}>*/}
                <ExpandableList
                    items={(() => {
                        let items = player.journal.filter(entry => (entry.TerraformState || entry.PlanetClass === 'Earthlike body' || entry.PlanetClass === 'Ammonia world') && entry.StarSystem === relativeSystem.name).sort((a, b) => a.BodyName.localeCompare(b.BodyName));
                        return items.filter((a, i) => items.slice(i + 1).every(b => a.BodyName !== b.BodyName));
                    })()}
                    size={100}
                    render={(entry, i) => (
                        // <JournalEntry
                        //     key={`${entry.timestamp}${i}`}
                        //     internal
                        //     entry={entry}/>
                        <BodyCompact key={i} body={createBodyFromJournalEntry(entry)} player={player}/>
                    )}/>
            {/*</SearchContext.Provider>*/}
        </>);
    };

    let mainContent = () => (<>
        <InputGroup size="lg" className="mb-2">
            <input type="text"
                   className="form-control"
                   value={searchQuery}
                   placeholder={'Search...'}
                   ref={elem => searchBarElem = elem}
                // onFocus={() => setCurrentTab('search')}
                   onChange={e => doSearch(e.target.value)}/>
        </InputGroup>
        <Tabs activeKey={currentTab}
              onSelect={onSelectTab}>
            <Tab eventKey="search" title={<FiSearch className="h4 mt-1"/>}>
                {currentTab === 'search' && (
                    searchQuery ? (
                        <ExpandableList
                            items={searchResults}
                            size={20}
                            // ignoreSort
                            render={(result, i) => (
                                <SearchResult key={i} result={result}/>
                            )}/>
                    ) : (<>
                        <ExpandableList
                            items={favorites}
                            size={10}
                            // ignoreSort
                            render={(item, i) => (
                                <SearchResult key={i} result={item}/>
                            )}/>
                        <ExpandableList
                            items={galaxy.getNearestSystems(() => s => !favorites.includes(s), 80)}
                            size={10}
                            // ignoreSort
                            render={(item, i) => (
                                <SearchResult key={i} result={item}/>
                            )}/>
                    </>)
                )}
            </Tab>
            <Tab eventKey="settings" title={<FiRadio className="h4 mt-1"/>}>
                {currentTab === 'settings' && (<>
                    <div className="p-2">
                        <div className="p-2">
                            <h5 className={'text-' + (customSystemName ? relativeSystem.name.toLowerCase() === customSystemName.toLowerCase() ? 'success' : 'danger' : 'light')}>
                                Current system:
                            </h5>
                            <InputGroup size="md" className="my-1" style={{opacity: .8}}>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={customSystemName}
                                    placeholder="Choose populated system..."
                                    onFocus={e => e.target.select()}
                                    onChange={e => doSearch(null) & setCustomSystemName(e.target.value)}/>
                            </InputGroup>
                            <StarSystem system={relativeSystem}/>
                        </div>
                        {!connection ? (
                            <Button
                                size="lg"
                                variant={'outline-' + (connection ? 'light' : reconnecting ? 'warning' : 'info')}
                                className="w-100 py-2 my-3"
                                style={{opacity: connection && .5}}
                                onClick={() => connection ? disconnect() : promptConnect()}>
                                {/*{connection ? 'Connected' : reconnecting ? 'Connecting...' : 'Connect'}*/}
                                {reconnecting ? 'Connecting...' : 'Connect'}
                            </Button>
                        ) : playerSystem && (<div className="ml-2 mt-3">
                            {/*<h5 className="text-light my-3">*/}
                            {/*    Connected to local network*/}
                            {/*</h5>*/}
                            <SettingToggle
                                setting="overlay"
                                label="Exploration overlay"
                                onToggle={overlay => transmitSettings({...settings, overlay})}/>
                        </div>)}
                        {!playerSystem ? (
                            <a href="https://github.com/rvanasa/elite-navigator/releases"
                               target="_blank" rel="noopener noreferrer">
                                <Button
                                    variant="outline-light"
                                    className="w-100 py-2 my-2"
                                    style={{opacity: .7}}
                                    onClick={() => connect('localhost')}>
                                    Download location sync
                                </Button>
                            </a>
                        ) : (<>
                            <br/>
                            <Category name="Recent actions" detail={() => (
                                <ExpandableList
                                    items={player.journal.filter(isEntryVisible)}
                                    size={5}
                                    render={(entry, i) => (
                                        <JournalEntry
                                            key={`${entry.timestamp}${i}`}
                                            entry={entry}/>
                                    )}/>
                            )}/>
                            {/*<Category name="First discoveries" detail={() => (<>*/}
                            {/*    <Category name="Everything" detail={() => (*/}
                            {/*        <ExpandableList*/}
                            {/*            items={player.discoveries}*/}
                            {/*            size={10}*/}
                            {/*            render={(entry, i) => (*/}
                            {/*                <JournalEntry*/}
                            {/*                    key={`${entry.timestamp}${i}`}*/}
                            {/*                    internal*/}
                            {/*                    entry={entry}/>*/}
                            {/*            )}/>*/}
                            {/*    )}/>*/}
                            {/*    <Category name="Terraformable" detail={() => (*/}
                            {/*        <ExpandableList*/}
                            {/*            items={player.discoveries.filter(entry => entry.TerraformState)}*/}
                            {/*            size={10}*/}
                            {/*            render={(entry, i) => (*/}
                            {/*                <JournalEntry*/}
                            {/*                    key={`${entry.timestamp}${i}`}*/}
                            {/*                    internal*/}
                            {/*                    entry={entry}/>*/}
                            {/*            )}/>*/}
                            {/*    )}/>*/}
                            {/*    <Category name="Earthlike" detail={() => (*/}
                            {/*        <ExpandableList*/}
                            {/*            items={player.discoveries.filter(entry => entry.PlanetClass === 'Earthlike body')}*/}
                            {/*            size={10}*/}
                            {/*            render={(entry, i) => (*/}
                            {/*                <JournalEntry*/}
                            {/*                    key={`${entry.timestamp}${i}`}*/}
                            {/*                    internal*/}
                            {/*                    entry={entry}/>*/}
                            {/*            )}/>*/}
                            {/*    )}/>*/}
                            {/*</>)}/>*/}
                        </>)}
                    </div>
                </>)}
            </Tab>
            <Tab eventKey="nearby" title={<FiMapPin className="h4 mt-1"/>}>
                {currentTab === 'nearby' && (<>
                    <div className="mt-2">
                        <Category name="Nearby stations" detail={() => (
                            <ExpandableList
                                items={galaxy.getNearestStations()}
                                size={3}
                                // ignoreSort
                                render={(station, i) => (
                                    <SearchResult key={i} result={station}/>
                                )}/>
                        )}/>
                        <Category name="Pristine rings" detail={() => (<>
                            {/*<SettingToggle*/}
                            {/*    setting="allResourceTypes"*/}
                            {/*    inverted*/}
                            {/*    label="Pristine"/>*/}
                            {galaxy.ringTypes.map((type, i) => (
                                <Category key={i} name={type} detail={() => (<>
                                    <ExpandableList
                                        items={galaxy.getNearestRingBodies(type).filter(b => settings.allResourceTypes || b.system.reserveType === 'Pristine')}
                                        size={2}
                                        // ignoreSort
                                        render={(body, i) => (
                                            <Body key={i} body={body}/>
                                        )}/>
                                </>)}/>
                            ))}
                        </>)}/>
                        {/*<Category name="Material traders" detail={() => (*/}
                        {/*    galaxy.materialTypes.map((type, i) => (*/}
                        {/*        <Category key={i} name={type} detail={() => (*/}
                        {/*            <ExpandableList*/}
                        {/*                items={galaxy.getNearestStations(s => s.services.includes(type + ' Material Trader'))}*/}
                        {/*                size={2}*/}
                        {/*                // ignoreSort*/}
                        {/*                render={(station, i) => (*/}
                        {/*                    <Station key={i} station={station}/>*/}
                        {/*                )}/>*/}
                        {/*        )}/>*/}
                        {/*    ))*/}
                        {/*)}/>*/}
                        <Category name="Services" detail={() => (
                            ['Interstellar Factors', 'Black Market', 'Technology Broker'].map((type, i) => (
                                <Category key={i} name={sentenceCase(type)} detail={() => (
                                    <ExpandableList
                                        items={galaxy.getNearestStations(s => s.services.includes(type))}
                                        size={2}
                                        // ignoreSort
                                        render={(station, i) => (
                                            <Station key={i} station={station}/>
                                        )}/>
                                )}/>
                            ))
                        )}/>
                        <br/>
                        {overlayContent()}
                    </div>
                </>)}
            </Tab>
        </Tabs>
    </>);

    return (
        <SettingsContext.Provider value={settings}>
            <SelectContext.Provider value={{selected, setSelected, ancestors: []}}>
                <FilterContext.Provider value={{filter: doFilter, favorites, addFavorite, removeFavorite}}>
                    <GalaxyContext.Provider value={galaxy}>
                        <SearchContext.Provider value={{text: searchQuery, isRelevant: isSearchRelevant}}>
                            <div className="p-2">
                                <div>
                                    {player.name && layout !== 'overlay' && (
                                        <h6 className="text-primary float-right mt-1">CMDR {player.name}</h6>
                                    )}
                                    <h5 className={'text-' + (relativeSystem.name.toLowerCase() === customSystemName.toLowerCase() ? 'success' :
                                        playerSystem ? playerSystem && relativeSystem.name.toLowerCase() !== playerSystem.name.toLowerCase() ? 'danger' : 'info' : 'light')}>
                                        {layout !== 'overlay' || playerSystem || customSystemName || searchQuery ? relativeSystem.name : <>&nbsp;</>}
                                    </h5>
                                </div>
                                {layout === 'overlay' ? overlayContent() : mainContent()}
                            </div>
                        </SearchContext.Provider>
                    </GalaxyContext.Provider>
                </FilterContext.Provider>
            </SelectContext.Provider>
        </SettingsContext.Provider>
    );
};
