/**
 * @author Ravi Shankar Saini <sainiravi015@gmail.com>
 */

interface OpenSeadragonTile {
    _renderedContext?: CanvasRenderingContext2D;
    _filterIncrement?: number;
}

interface OpenSeadragonTiledImage {
    reset(): void;
}

interface OpenSeadragonWorld {
    getItemAt(index: number): OpenSeadragonTiledImage;
}

interface OpenSeadragonViewer {
    world: OpenSeadragonWorld;
    addHandler(event: string, handler: Function): void;
    forceRedraw(): void;
}

export type FilterProcessor = (context: CanvasRenderingContext2D, callback?: () => void) => void;

export interface Filter {
    items?: OpenSeadragonTiledImage | OpenSeadragonTiledImage[];
    processors: FilterProcessor | FilterProcessor[];
}

export interface FilterOptions {
    filters?: Filter | Filter[];
    loadMode?: 'sync' | 'async';
}

export interface FilterPluginOptions extends FilterOptions {
    viewer: OpenSeadragonViewer;
}

interface TileLoadedEvent {
    tile: OpenSeadragonTile;
    image: HTMLImageElement | null | undefined;
    tiledImage: OpenSeadragonTiledImage;
    getCompletionCallback(): () => void;
}

interface TileDrawingEvent {
    tile: OpenSeadragonTile;
    rendered: CanvasRenderingContext2D & {
        _originalImageData?: ImageData;
        _filterIncrement?: number;
        canvas: HTMLCanvasElement;
    };
    tiledImage: OpenSeadragonTiledImage;
}

/**
 * Initialize filtering for an OpenSeadragon viewer
 */
export const initializeFiltering = (viewer: OpenSeadragonViewer, options?: FilterOptions): FilterPlugin => {
    const pluginOptions: FilterPluginOptions = { ...options, viewer };
    return new FilterPlugin(pluginOptions);
};

export class FilterPlugin {
    viewer: OpenSeadragonViewer;
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

        this.initViewerHandlers();
        setOptions(this, options);
    }

    private readonly initViewerHandlers = () => {
        this.viewer.addHandler('tile-loaded', this.tileLoadedHandler);
        this.viewer.addHandler('tile-drawing', this.tileDrawingHandler);
    };

    private readonly tileLoadedHandler = (event: TileLoadedEvent): void => {
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

    private readonly tileDrawingHandler = (event: TileDrawingEvent): void => {
        const tile = event.tile;
        const rendered = event.rendered;
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
    const filters = options.filters ? (Array.isArray(options.filters) ? options.filters : [options.filters]) : [];
    instance.filters = filters;

    for (const filter of instance.filters) {
        if (!filter.processors) {
            throw new Error('Filter processors must be specified.');
        }
        filter.processors = Array.isArray(filter.processors) ? filter.processors : [filter.processors];
    }
    instance.filterIncrement++;

    if (options.loadMode === 'sync') {
        instance.viewer.forceRedraw();
    } else {
        let itemsToReset: OpenSeadragonTiledImage[] = [];
        for (const filter of instance.filters) {
            if (!filter.items) {
                itemsToReset = getAllItems(instance.viewer.world);
                break;
            }
            if (Array.isArray(filter.items)) {
                for (const item of filter.items) {
                    addItemToReset(item, itemsToReset);
                }
            } else {
                addItemToReset(filter.items, itemsToReset);
            }
        }
        for (const item of itemsToReset) {
            item.reset();
        }
    }
}

function addItemToReset(item: OpenSeadragonTiledImage, itemsToReset: OpenSeadragonTiledImage[]): void {
    if (itemsToReset.indexOf(item) >= 0) {
        throw new Error('An item can not be used by multiple filters.');
    }
    itemsToReset.push(item);
}

function getAllItems(world: OpenSeadragonWorld): OpenSeadragonTiledImage[] {
    const result: OpenSeadragonTiledImage[] = [];
    for (let i = 0; i < (world as any).getItemCount(); i++) {
        result.push(world.getItemAt(i));
    }
    return result;
}

function getFiltersProcessors(instance: FilterPlugin, item: OpenSeadragonTiledImage): FilterProcessor[] {
    if (instance.filters.length === 0) return [];

    const globalProcessors: FilterProcessor[] = [];
    for (const filter of instance.filters) {
        if (!filter.items) {
            globalProcessors.push(...(filter.processors as FilterProcessor[]));
        } else if (Array.isArray(filter.items)) {
            if (filter.items.indexOf(item) >= 0) {
                return filter.processors as FilterProcessor[];
            }
        } else if (filter.items === item) {
            return filter.processors as FilterProcessor[];
        }
    }
    return globalProcessors;
}