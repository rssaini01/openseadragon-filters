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
        onEnd: () => {
          const items = Array.from(selectedListRef.current.children).map(li =>
            filtersRef.current.find(f => f.id === li.dataset.id)
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
    <div className="wdzt-table-layout wdzt-full-width">
      <div className="wdzt-row-layout">
        <div className="wdzt-cell-layout column-2">
          <div id="openseadragon"></div>
        </div>
        <div className="wdzt-cell-layout column-2">
          <h3>Available filters</h3>
          <ul id="available">
            {availableFilters.map(filter => (
              <li key={filter.name}>
                <button onClick={() => addFilter(filter)} className={"button"}>+</button>&nbsp;{filter.name}
              </li>
            ))}
          </ul>

          <h3>Selected filters</h3>
          <ul id="selected" ref={selectedListRef}>
            {selectedFilters.map(filter => (
              <li key={filter.id} data-id={filter.id}>
                <FilterItem
                  filter={filter}
                  onRemove={() => removeFilter(filter.id)}
                >
                  {filter.renderControl && filter.renderControl(
                    (v) => updateFilterValue(filter.id, v),
                    filter.value
                  )}
                </FilterItem>
              </li>
            ))}
          </ul>

          <p>Drag and drop the selected filters to set their order.</p>
        </div>
      </div>
    </div>
  );
}
