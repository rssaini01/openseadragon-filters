import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Sortable from 'sortablejs';
import OpenSeadragon from 'openseadragon';
import { initializeFiltering } from '../src/openseadragon-filter';
import { availableFilters } from './filters';
import FilterItem from './components/FilterItem';

export default function App() {
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [viewer, setViewer] = useState(null);
    const [filterPlugin, setFilterPlugin] = useState(null);
    const selectedListRef = useRef(null);
    const filtersRef = useRef([]);

    useEffect(() => {
        const v = new OpenSeadragon({
            id: 'openseadragon',
            prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
            tileSources: '//openseadragon.github.io/example-images/highsmith/highsmith.dzi',
            crossOriginPolicy: 'Anonymous',
            drawer: 'canvas'
        });
        setViewer(v);
        const plugin = initializeFiltering(v, { forceCanvasDrawer: true });
        setFilterPlugin(plugin);
    }, []);

    useEffect(() => {
        if (selectedListRef.current && !selectedListRef.current.sortable) {
            selectedListRef.current.sortable = Sortable.create(selectedListRef.current, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: () => {
                    const items = Array.from(selectedListRef.current.children).map(div =>
                        filtersRef.current.find(f => f.id === div.dataset.id)
                    );
                    filtersRef.current = items;
                    setSelectedFilters([...items]);
                }
            });
        }
    }, [selectedListRef.current]);

    useEffect(() => {
        filtersRef.current = selectedFilters;
        if (filterPlugin) {
            updateFilters();
        }
    }, [selectedFilters, filterPlugin]);

    const addFilter = (filter) => {
        const id = crypto.randomUUID();
        const newFilter = { ...filter, id, value: filter.defaultValue || 0 };
        setSelectedFilters([...selectedFilters, newFilter]);
    };

    const removeFilter = (id) => {
        setSelectedFilters(selectedFilters.filter(f => f.id !== id));
    };

    const updateFilterValue = (id, value) => {
        const updated = selectedFilters.map(f =>
            f.id === id ? { ...f, value } : f
        );
        setSelectedFilters(updated);
    };

    const updateFilters = () => {
        if (!filterPlugin) return;

        const filters = selectedFilters.map(f => f.getFilter(f.value));
        const sync = selectedFilters.every(f => f.sync);

        filterPlugin.setFilterOptions({
            filters: { processors: filters },
            loadMode: sync ? 'sync' : 'async'
        });
    };

    return (
        <div className="app-layout">
            <div className="viewer-section">
                <div id="openseadragon"></div>
            </div>

            <div className="controls-section">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Available Filters</h2>
                        <span className="badge">{availableFilters.length}</span>
                    </div>
                    <div className="filter-grid">
                        {availableFilters.map(filter => (
                            <button
                                key={filter.name}
                                onClick={() => addFilter(filter)}
                                className="filter-btn"
                            >
                                <span className="filter-btn-icon">+</span>
                                {filter.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Active Filters</h2>
                        <span className="badge">{selectedFilters.length}</span>
                    </div>
                    <div className="selected-filters" ref={selectedListRef}>
                        {selectedFilters.length === 0 ? (
                            <div className="empty-state">
                                <p>No filters applied yet.</p>
                                <p>Add filters from above to get started.</p>
                            </div>
                        ) : (
                            selectedFilters.map(filter => (
                                <div key={filter.id} data-id={filter.id}>
                                    <FilterItem
                                        filter={filter}
                                        onRemove={() => removeFilter(filter.id)}
                                    >
                                        {filter.renderControl && filter.renderControl(
                                            (v) => updateFilterValue(filter.id, v),
                                            filter.value
                                        )}
                                    </FilterItem>
                                </div>
                            ))
                        )}
                    </div>
                    {selectedFilters.length > 0 && (
                        <div className="info-text">
                            💡 Drag and drop filters to reorder them
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
