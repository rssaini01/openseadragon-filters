/**
 * @author Ravi Shankar Saini <sainiravi015@gmail.com>
 */

import OpenSeadragon from 'openseadragon';

interface ExtendedTile extends OpenSeadragon.Tile {
    _renderedContext?: CanvasRenderingContext2D;
    _filterIncrement?: number;
}

export type FilterProcessor = (context: CanvasRenderingContext2D, callback?: () => void) => void;

export interface Filter {
    items?: OpenSeadragon.TiledImage | OpenSeadragon.TiledImage[];
    processors: FilterProcessor | FilterProcessor[];
}

export interface FilterOptions {
    filters?: Filter | Filter[];
    loadMode?: 'sync' | 'async';
    forceCanvasDrawer?: boolean;
}

export interface FilterPluginOptions extends FilterOptions {
    viewer: OpenSeadragon.Viewer;
    forceCanvasDrawer?: boolean;
}

interface ExtendedTileLoadedEvent extends OpenSeadragon.TileLoadedEvent {
    tile: ExtendedTile;
}

interface ExtendedTileDrawingEvent {
    tile: ExtendedTile;
    rendered: CanvasRenderingContext2D & {
        _originalImageData?: ImageData;
        _filterIncrement?: number;
    };
    tiledImage: OpenSeadragon.TiledImage;
    eventSource: OpenSeadragon.Viewer;
    userData: unknown;
}

/**
 * Initialize filtering for an OpenSeadragon viewer
 */
export const initializeFiltering = (viewer: OpenSeadragon.Viewer, options?: FilterOptions): FilterPlugin => {
    if (!OpenSeadragon) {
        throw new TypeError('OpenSeadragon is not available. Please ensure OpenSeadragon is loaded before initializing filters.');
    }
    const pluginOptions: FilterPluginOptions = { ...options, viewer };
    return new FilterPlugin(pluginOptions);
};

export class FilterPlugin {
    viewer: OpenSeadragon.Viewer;
    filterIncrement: number;
    filters: Filter[] = [];

    setFilterOptions(options?: FilterOptions): void {
        setOptions(this, options);
    }

    constructor(options: FilterPluginOptions) {
        if (!options.viewer) {
            throw new Error('A viewer must be specified.');
        }
        this.viewer = options.viewer;
        this.filterIncrement = 0;

        if (options.forceCanvasDrawer) {
            this.ensureCanvasDrawer();
        }

        this.initViewerHandlers();
        setOptions(this, options);
    }

    private readonly ensureCanvasDrawer = () => {
        const drawer = this.viewer.drawer;
        if (drawer && drawer.constructor.name !== 'CanvasDrawer') {
            console.warn('WebGL drawer detected. Filters require Canvas drawer. Switching to Canvas drawer.');
            this.viewer.requestDrawer('canvas', { mainDrawer: true, redrawImmediately: false, drawerOptions: {} });
        }
    };

    private readonly initViewerHandlers = () => {
        this.viewer.addHandler('tile-loaded', this.tileLoadedHandler);
        this.viewer.addHandler('tile-drawing', this.tileDrawingHandler as any);
    };

    private readonly tileLoadedHandler = (event: ExtendedTileLoadedEvent): void => {
        const processors = getFiltersProcessors(this, event.tiledImage);
        if (processors.length === 0) return;

        const tile = event.tile;
        const image = event.image;
        if (image) {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d')!;
            context.drawImage(image, 0, 0);
            tile._renderedContext = context;
            const callback = event.getCompletionCallback();
            this.applyFilters(context, processors, callback);
            tile._filterIncrement = this.filterIncrement;
        }
    };

    private readonly applyFilters = (context: CanvasRenderingContext2D, filtersProcessors: FilterProcessor[], callback?: () => void): void => {
        if (callback) {
            const currentIncrement = this.filterIncrement;
            const callbacks: (() => void)[] = [];
            for (let i = 0; i < filtersProcessors.length - 1; i++) {
                callbacks[i] = () => {
                    if (this.filterIncrement !== currentIncrement) return;
                    filtersProcessors[i + 1](context, callbacks[i + 1]);
                };
            }
            callbacks[filtersProcessors.length - 1] = () => {
                if (this.filterIncrement !== currentIncrement) return;
                callback();
            };
            filtersProcessors[0](context, callbacks[0]);
        } else {
            for (const processor of filtersProcessors) {
                processor(context, () => {});
            }
        }
    };

    private readonly tileDrawingHandler = (event: ExtendedTileDrawingEvent): void => {
        const tile = event.tile;
        const rendered = event.rendered;

        if (!rendered) return;
        if (rendered._filterIncrement === this.filterIncrement) return;

        const processors = getFiltersProcessors(this, event.tiledImage);
        if (processors.length === 0) {
            if (rendered._originalImageData) {
                rendered.putImageData(rendered._originalImageData, 0, 0);
                delete rendered._originalImageData;
            }
            rendered._filterIncrement = this.filterIncrement;
            return;
        }

        if (rendered._originalImageData) {
            rendered.putImageData(rendered._originalImageData, 0, 0);
        } else {
            rendered._originalImageData = rendered.getImageData(0, 0, rendered.canvas.width, rendered.canvas.height);
        }

        if (tile._renderedContext && tile._filterIncrement === this.filterIncrement) {
            const imgData = tile._renderedContext.getImageData(0, 0,
                tile._renderedContext.canvas.width, tile._renderedContext.canvas.height);
            rendered.putImageData(imgData, 0, 0);
            delete tile._renderedContext;
            delete tile._filterIncrement;
            rendered._filterIncrement = this.filterIncrement;
            return;
        }

        delete tile._renderedContext;
        delete tile._filterIncrement;
        this.applyFilters(rendered, processors);
        rendered._filterIncrement = this.filterIncrement;
    };
}

function setOptions(instance: FilterPlugin, options?: FilterOptions): void {
    options = options || {};
    instance.filters = normalizeFilters(options.filters);
    validateAndNormalizeProcessors(instance.filters);
    instance.filterIncrement++;

    if (options.loadMode === 'sync') {
        instance.viewer.forceRedraw();
    } else {
        resetFilteredItems(instance);
    }
}

function normalizeFilters(filters?: Filter | Filter[]): Filter[] {
    if (!filters) return [];
    return Array.isArray(filters) ? filters : [filters];
}

function validateAndNormalizeProcessors(filters: Filter[]): void {
    for (const filter of filters) {
        if (!filter.processors) {
            throw new Error('Filter processors must be specified.');
        }
        filter.processors = Array.isArray(filter.processors) ? filter.processors : [filter.processors];
    }
}

function resetFilteredItems(instance: FilterPlugin): void {
    const itemsToReset = collectItemsToReset(instance.filters, instance.viewer.world);
    for (const item of itemsToReset) {
        item.reset();
    }
}

function collectItemsToReset(filters: Filter[], world: OpenSeadragon.World): OpenSeadragon.TiledImage[] {
    const itemsToReset: OpenSeadragon.TiledImage[] = [];

    for (const filter of filters) {
        if (!filter.items) {
            return getAllItems(world);
        }
        addFilterItemsToReset(filter.items, itemsToReset);
    }

    return itemsToReset;
}

function addFilterItemsToReset(items: OpenSeadragon.TiledImage | OpenSeadragon.TiledImage[], itemsToReset: OpenSeadragon.TiledImage[]): void {
    if (Array.isArray(items)) {
        for (const item of items) {
            addItemToReset(item, itemsToReset);
        }
    } else {
        addItemToReset(items, itemsToReset);
    }
}

function addItemToReset(item: OpenSeadragon.TiledImage, itemsToReset: OpenSeadragon.TiledImage[]): void {
    if (itemsToReset.includes(item)) {
        throw new Error('An item can not be used by multiple filters.');
    }
    itemsToReset.push(item);
}

function getAllItems(world: OpenSeadragon.World): OpenSeadragon.TiledImage[] {
    const result: OpenSeadragon.TiledImage[] = [];
    for (let i = 0; i < world.getItemCount(); i++) {
        result.push(world.getItemAt(i));
    }
    return result;
}

function getFiltersProcessors(instance: FilterPlugin, item: OpenSeadragon.TiledImage): FilterProcessor[] {
    if (instance.filters.length === 0) return [];

    const globalProcessors: FilterProcessor[] = [];
    for (const filter of instance.filters) {
        if (!filter.items) {
            globalProcessors.push(...(filter.processors as FilterProcessor[]));
        } else if (Array.isArray(filter.items)) {
            if (filter.items.includes(item)) {
                return filter.processors as FilterProcessor[];
            }
        } else if (filter.items === item) {
            return filter.processors as FilterProcessor[];
        }
    }
    return globalProcessors;
}
