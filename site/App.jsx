import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import Sortable from 'sortablejs';
import OpenSeadragon from 'openseadragon';
import { initializeFiltering, initWebGLFiltering, convertToWebGLFilter } from '../src/openseadragon-filter';
import { availableFilters } from './filters';
import FilterItem from './components/FilterItem';
import * as Shaders from '../src/webgl-shaders';

export const USE_WEBGL_DRAWER = true; // Toggle between Canvas and WebGL drawer

export default function App() {
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [filterPlugin, setFilterPlugin] = useState(null);
    const selectedListRef = useRef(null);
    const filtersRef = useRef([]);

    useEffect(() => {
        const viewer = new OpenSeadragon({
            id: 'openseadragon',
            prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
            tileSources: '//openseadragon.github.io/example-images/highsmith/highsmith.dzi',
            crossOriginPolicy: 'Anonymous',
            drawer: USE_WEBGL_DRAWER ? 'webgl' : 'canvas'
        });

        const plugin = USE_WEBGL_DRAWER ? initWebGLFiltering(viewer) : initializeFiltering(viewer);
        setFilterPlugin(plugin);
    }, []);

    const handleSortEnd = () => {
        const items = Array.from(selectedListRef.current.children).map(div =>
            filtersRef.current.find(f => f.id === div.dataset.id)
        );
        filtersRef.current = items;
        setSelectedFilters([...items]);
    };

    useEffect(() => {
        if (selectedListRef.current && !selectedListRef.current.sortable) {
            selectedListRef.current.sortable = Sortable.create(selectedListRef.current, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                handle: '.drag-handle',
                onEnd: handleSortEnd
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

    const getWebGLFilter = (f) => {
        const name = f.name.toLowerCase();
        const value = f.value === undefined ? f.defaultValue : f.value;

        if (name === 'brightness') return convertToWebGLFilter('brightness', Shaders.brightnessShader, { u_adjustment: value });
        if (name === 'contrast') return convertToWebGLFilter('contrast', Shaders.contrastShader, { u_adjustment: value });
        if (name === 'gamma') return convertToWebGLFilter('gamma', Shaders.gammaShader, { u_adjustment: value });
        if (name === 'greyscale') return convertToWebGLFilter('greyscale', Shaders.greyscaleShader, {});
        if (name === 'invert') return convertToWebGLFilter('invert', Shaders.invertShader, {});
        if (name === 'thresholding') return convertToWebGLFilter('threshold', Shaders.thresholdShader, { u_threshold: value });
        if (name === 'dilation') return convertToWebGLFilter('dilation', Shaders.dilationShader, { u_kernelSize: value, u_textureSize: [2048, 2048] });
        if (name === 'erosion') return convertToWebGLFilter('erosion', Shaders.erosionShader, { u_kernelSize: value, u_textureSize: [2048, 2048] });
        return null;
    };

    const updateFilters = () => {
        if (!filterPlugin) return;

        if (USE_WEBGL_DRAWER) {
            const webglFilters = selectedFilters.map(getWebGLFilter).filter(Boolean);
            filterPlugin.setFilters(webglFilters);
        } else {
            const filters = selectedFilters.map(f => f.getFilter(f.value));
            const sync = selectedFilters.every(f => f.sync);
            filterPlugin.setFilterOptions({
                filters: { processors: filters },
                loadMode: sync ? 'sync' : 'async'
            });
        }
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
                            selectedFilters.map(filter => {
                                const control = filter.renderControl?.(v => updateFilterValue(filter.id, v), filter.value);
                                return (
                                    <div key={filter.id} data-id={filter.id}>
                                        <FilterItem filter={filter} onRemove={() => removeFilter(filter.id)}>
                                            {control}
                                        </FilterItem>
                                    </div>
                                );
                            })
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
