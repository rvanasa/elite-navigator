import React, {useState} from 'react';

import './App.scss';
import {Button, InputGroup, Tab, Tabs} from 'react-bootstrap';
import {sentenceCase} from 'change-case';
import {tryConnect} from '../services/connection-service';
import {FilterContext, GalaxyContext, SearchContext, SelectContext, SettingsContext} from './Contexts';
import {findGalaxy} from '../services/galaxy-service';
import bootbox from 'bootbox';
import JournalEntry from './item/JournalEntry';
import {Player} from '../services/player-service';
import {FiMapPin, FiSearch, FiSettings} from 'react-icons/all';
import SearchResult from './SearchResult';
import ExpandableList from './ExpandableList';
import StarSystem from './item/StarSystem';
import Body from './item/Body';
import Category from './item/Category';
import Station from './item/Station';

let messageListener = null;

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
    
    function promptConnect() {
        disconnect();
        bootbox.prompt({
            title: 'Connect to IP address:',
            value: connection ? connection.io.uri.replace('ws://', '') : localStorage['websocket'] || 'localhost',
            callback: address => {
                if(address) {
                    localStorage['websocket'] = address || '';
                    connect(address)
                        .catch(err => console.error(err));
                }
            }
        });
    }
    
    async function connect(address) {
        setReconnecting(true);
        let connection = await tryConnect(address);
        setConnection(connection);
        setCurrentTab('nearby');
        setReconnecting(false);
        return connection;
    }
    
    function disconnect() {
        if(connection) {
            connection.close();
        }
        localStorage['websocket'] = '';
        setConnection(null);
        setReconnecting(false);
        setPlayer(null);
    }
    
    // console.log(relativeSystem || '-', galaxy, player);///
    
    if(connection) {
        connection.removeListener('message', messageListener);
        messageListener = data => {
            console.warn(data);
            player.update(data);
            setPlayer(player);
        };
        connection.on('message', messageListener);
    }
    // useEffect(() => {
    //     if(connection) {
    //         return () => connection.removeListener('message', listener);
    //     }
    // });
    
    let storedAddress = localStorage['websocket'];
    if(storedAddress && allowAutoConnect) {
        allowAutoConnect = false;
        // let timeout = setTimeout(() => disconnect(), 1000);
        connect(storedAddress)
            // .then(() => clearTimeout(timeout))
            .catch(err => console.error(err));
    }
    
    if(!galaxy) {
        findGalaxy().then(galaxy => setGalaxy(galaxy));
        return (
            <div style={{marginTop: '20vh'}}>
                <div style={{maxWidth: '960px', animationDuration: '1s'}}>
                    <h4 className="text-center text-light mb-5 animate-fade-in" style={{animationDuration: '1s'}}>
                        Loading galaxy data...
                    </h4>
                    <img className="d-block mx-auto animate-fade-in" style={{animationDuration: '4s'}}
                         src="img/favicon.png" alt="Loading..."/>
                </div>
            </div>
        );
    }
    
    let relativeSystem = galaxy.setRelativeSystem(galaxy.getSystem(parseInt(customSystemName) ? null : customSystemName) || player.getCurrentSystem() || 'Sol');
    
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
    
    return (
        <SettingsContext.Provider value={settings}>
            <SelectContext.Provider value={{selected, setSelected, ancestors: []}}>
                <FilterContext.Provider value={{filter: doFilter, favorites, addFavorite, removeFavorite}}>
                    <GalaxyContext.Provider value={galaxy}>
                        <SearchContext.Provider value={{text: searchQuery, isRelevant: isSearchRelevant}}>
                            <div className="p-2">
                                <div>
                                    {player.name && (
                                        <h6 className="text-primary float-right mt-1">CMDR {player.name}</h6>
                                    )}
                                    <h5 className={'text-' + (relativeSystem.name.toLowerCase() === customSystemName.toLowerCase() ? 'success' : 'light')}>{relativeSystem.name}</h5>
                                </div>
                                <InputGroup size="lg" className="mb-2">
                                    <input type="text"
                                           className="form-control"
                                           value={searchQuery}
                                           placeholder={'Search...'}
                                           ref={elem => searchBarElem = elem}
                                        // onFocus={() => setCurrentTab('search')}
                                           onChange={e => doSearch(e.target.value)}/>
                                </InputGroup>
                                <Tabs defaultActiveKey={connection ? 'nearby' : 'settings'}
                                      activeKey={currentTab}
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
                                                <Category name="Material traders" detail={() => (
                                                    galaxy.materialTypes.map((type, i) => (
                                                        <Category key={i} name={type} detail={() => (
                                                            <ExpandableList
                                                                items={galaxy.getNearestStations(s => s.services.includes(type + ' Material Trader'))}
                                                                size={2}
                                                                // ignoreSort
                                                                render={(station, i) => (
                                                                    <Station key={i} station={station}/>
                                                                )}/>
                                                        )}/>
                                                    ))
                                                )}/>
                                                <Category name="Services" detail={() => (
                                                    ['Interstellar Factors', 'Technology Broker'].map((type, i) => (
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
                                            </div>
                                        </>)}
                                    </Tab>
                                    <Tab eventKey="settings" title={<FiSettings className="h4 mt-1"/>}>
                                        <div className="p-2">
                                            <div className="p-2">
                                                <h5 className={'text-' + (customSystemName ? relativeSystem.name.toLowerCase() === customSystemName.toLowerCase() ? 'success' : 'danger' : 'light')}>
                                                    Current system:
                                                </h5>
                                                <InputGroup size="md" className="my-1" style={{opacity: .8}}>
                                                    <input type="text"
                                                           className="form-control"
                                                           value={customSystemName}
                                                           placeholder="Change current system..."
                                                           onFocus={e => e.target.select()}
                                                           onChange={e => doSearch(null) & setCustomSystemName(e.target.value)}/>
                                                </InputGroup>
                                                <StarSystem system={relativeSystem}/>
                                            </div>
                                            <Button
                                                size="lg"
                                                variant={'outline-' + (connection ? 'light' : reconnecting ? 'warning' : 'info')}
                                                className="w-100 py-2 my-3"
                                                style={{opacity: connection && .5}}
                                                onClick={() => connection ? disconnect() : promptConnect()}>
                                                {connection ? 'Connected' : reconnecting ? 'Connection not found' : 'Connect'}
                                            </Button>
                                            {!connection && (
                                                <a href="bin/elite-navigator.exe" target="_blank">
                                                    <Button
                                                        size=""
                                                        variant="outline-light"
                                                        className="w-100 py-2 my-2"
                                                        style={{opacity: .7}}>
                                                        Download location sync
                                                    </Button>
                                                </a>
                                            )}
                                            {connection && currentTab === 'settings' && (<>
                                                <ExpandableList
                                                    items={player.journal.filter(isEntryVisible)}
                                                    size={5}
                                                    render={(entry, i) => (
                                                        <JournalEntry key={`${entry.timestamp}${i}`} entry={entry}/>
                                                    )}/>
                                            </>)}
                                        </div>
                                    </Tab>
                                </Tabs>
                            </div>
                        </SearchContext.Provider>
                    </GalaxyContext.Provider>
                </FilterContext.Provider>
            </SelectContext.Provider>
        </SettingsContext.Provider>
    );
};
