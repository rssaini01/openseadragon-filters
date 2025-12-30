import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeFiltering, FilterPlugin, BRIGHTNESS, INVERT } from '../src';

// Mock OpenSeadragon module
vi.mock('openseadragon', () => ({
  default: {
    Viewer: vi.fn(() => mockViewer)
  }
}));

// Mock viewer
const mockViewer = {
  drawer: { constructor: { name: 'CanvasDrawer' } },
  addHandler: vi.fn(),
  forceRedraw: vi.fn(),
  requestDrawer: vi.fn(),
  world: {
    getItemCount: () => 0,
    getItemAt: vi.fn()
  }
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OpenSeadragon Filters Plugin', () => {
  describe('initializeFiltering', () => {
    it('should return FilterPlugin instance', () => {
      const plugin = initializeFiltering(mockViewer as any);

      expect(plugin).toBeInstanceOf(FilterPlugin);
    });

    it('should pass options to FilterPlugin', () => {
      const options = { loadMode: 'sync' as const };
      const plugin = initializeFiltering(mockViewer as any, options);

      expect(plugin).toBeInstanceOf(FilterPlugin);
    });
  });

  describe('FilterPlugin', () => {
    it('should throw error when no viewer is provided', () => {
      expect(() => {
        new FilterPlugin({ viewer: null as any });
      }).toThrow('A viewer must be specified');
    });

    it('should initialize with viewer', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });

      expect(plugin.viewer).toBe(mockViewer);
      expect(plugin.filterIncrement).toBe(1);
      expect(plugin.filters).toEqual([]);
    });

    it('should add event handlers to viewer', () => {
      new FilterPlugin({ viewer: mockViewer as any });

      expect(mockViewer.addHandler).toHaveBeenCalledWith('tile-loaded', expect.any(Function));
      expect(mockViewer.addHandler).toHaveBeenCalledWith('tile-drawing', expect.any(Function));
    });

    it('should set filter options', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      const initialIncrement = plugin.filterIncrement;

      plugin.setFilterOptions({
        filters: { processors: BRIGHTNESS(50) }
      });

      expect(plugin.filterIncrement).toBe(initialIncrement + 1);
      expect(plugin.filters).toHaveLength(1);
    });

    it('should handle multiple filters', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });

      plugin.setFilterOptions({
        filters: [
          { processors: BRIGHTNESS(50) },
          { processors: INVERT() }
        ]
      });

      expect(plugin.filters).toHaveLength(2);
    });

    it('should force canvas drawer when option is set', () => {
      const webglViewer = {
        ...mockViewer,
        drawer: { constructor: { name: 'WebGLDrawer' } }
      };

      new FilterPlugin({
        viewer: webglViewer as any,
        forceCanvasDrawer: true
      });

      expect(webglViewer.requestDrawer).toHaveBeenCalledWith(
        'canvas',
        expect.objectContaining({ mainDrawer: true })
      );
    });
  });

  describe('Predefined Filters', () => {
    it('should create BRIGHTNESS filter', () => {
      const filter = BRIGHTNESS(50);
      expect(typeof filter).toBe('function');
    });

    it('should create INVERT filter', () => {
      const filter = INVERT();
      expect(typeof filter).toBe('function');
    });
  });

  describe('FilterPlugin - Advanced', () => {
    it('should handle sync load mode', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      plugin.setFilterOptions({
        filters: { processors: BRIGHTNESS(50) },
        loadMode: 'sync'
      });
      expect(mockViewer.forceRedraw).toHaveBeenCalled();
    });

    it('should handle async load mode', () => {
      const mockItem = { reset: vi.fn() };
      mockViewer.world.getItemCount = () => 1;
      mockViewer.world.getItemAt = vi.fn(() => mockItem);
      
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      plugin.setFilterOptions({
        filters: { processors: BRIGHTNESS(50) },
        loadMode: 'async'
      });
      expect(mockItem.reset).toHaveBeenCalled();
    });

    it('should throw error when processors are not specified', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      expect(() => {
        plugin.setFilterOptions({
          filters: { processors: null as any }
        });
      }).toThrow('Filter processors must be specified');
    });

    it('should throw error when same item is used by multiple filters', () => {
      const mockItem = { reset: vi.fn() };
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      
      expect(() => {
        plugin.setFilterOptions({
          filters: [
            { items: mockItem as any, processors: BRIGHTNESS(50) },
            { items: mockItem as any, processors: INVERT() }
          ]
        });
      }).toThrow('An item can not be used by multiple filters');
    });

    it('should handle filters with specific items', () => {
      const mockItem1 = { reset: vi.fn() };
      const mockItem2 = { reset: vi.fn() };
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      
      plugin.setFilterOptions({
        filters: [
          { items: mockItem1 as any, processors: BRIGHTNESS(50) },
          { items: [mockItem2 as any], processors: INVERT() }
        ]
      });
      
      expect(mockItem1.reset).toHaveBeenCalled();
      expect(mockItem2.reset).toHaveBeenCalled();
    });
  });

  describe('Tile Handlers', () => {
    it('should handle tile-loaded event with image', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      plugin.setFilterOptions({ filters: { processors: BRIGHTNESS(50) } });

      const tileLoadedHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-loaded'
      )?.[1];

      const mockImage = { width: 100, height: 100 };
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(40000), width: 100, height: 100 })),
          putImageData: vi.fn(),
          canvas: { width: 100, height: 100 }
        }))
      };
      
      global.document = {
        createElement: vi.fn(() => mockCanvas)
      } as any;

      const mockTile = { _renderedContext: undefined, _filterIncrement: undefined };
      const mockEvent = {
        tile: mockTile,
        image: mockImage,
        tiledImage: {},
        getCompletionCallback: vi.fn(() => vi.fn())
      };

      tileLoadedHandler(mockEvent);

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockTile._filterIncrement).toBe(plugin.filterIncrement);
    });

    it('should skip tile-loaded when no processors', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });

      const tileLoadedHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-loaded'
      )?.[1];

      const mockEvent = {
        tile: {},
        image: { width: 100, height: 100 },
        tiledImage: {},
        getCompletionCallback: vi.fn()
      };

      tileLoadedHandler(mockEvent);

      expect(mockEvent.getCompletionCallback).not.toHaveBeenCalled();
    });

    it('should handle tile-drawing event', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      plugin.setFilterOptions({ filters: { processors: BRIGHTNESS(50) } });

      const tileDrawingHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-drawing'
      )?.[1];

      const mockRendered = {
        _filterIncrement: undefined,
        _originalImageData: undefined,
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(40000), width: 100, height: 100 })),
        putImageData: vi.fn(),
        canvas: { width: 100, height: 100 }
      };

      const mockEvent = {
        tile: {},
        rendered: mockRendered,
        tiledImage: {}
      };

      tileDrawingHandler(mockEvent);

      expect(mockRendered.getImageData).toHaveBeenCalled();
      expect(mockRendered._filterIncrement).toBe(plugin.filterIncrement);
    });

    it('should skip tile-drawing when no rendered context', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });

      const tileDrawingHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-drawing'
      )?.[1];

      const mockEvent = {
        tile: {},
        rendered: null,
        tiledImage: {}
      };

      tileDrawingHandler(mockEvent);
      // Should not throw
    });

    it('should restore original image data when no processors', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });

      const tileDrawingHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-drawing'
      )?.[1];

      const originalData = { data: new Uint8ClampedArray(40000) };
      const mockRendered = {
        _filterIncrement: undefined,
        _originalImageData: originalData,
        putImageData: vi.fn(),
        canvas: { width: 100, height: 100 }
      };

      const mockEvent = {
        tile: {},
        rendered: mockRendered,
        tiledImage: {}
      };

      tileDrawingHandler(mockEvent);

      expect(mockRendered.putImageData).toHaveBeenCalledWith(originalData, 0, 0);
      expect(mockRendered._originalImageData).toBeUndefined();
    });

    it('should use cached tile context when available', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      plugin.setFilterOptions({ filters: { processors: BRIGHTNESS(50) } });

      const tileDrawingHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-drawing'
      )?.[1];

      const cachedData = { data: new Uint8ClampedArray(40000), width: 100, height: 100 };
      const mockRenderedContext = {
        getImageData: vi.fn(() => cachedData),
        canvas: { width: 100, height: 100 }
      };
      
      const mockTile = {
        _renderedContext: mockRenderedContext,
        _filterIncrement: plugin.filterIncrement
      };

      const mockRendered = {
        _filterIncrement: undefined,
        _originalImageData: { data: new Uint8ClampedArray(40000) },
        putImageData: vi.fn(),
        getImageData: vi.fn(),
        canvas: { width: 100, height: 100 }
      };

      const mockEvent = {
        tile: mockTile,
        rendered: mockRendered,
        tiledImage: {}
      };

      tileDrawingHandler(mockEvent);

      expect(mockRenderedContext.getImageData).toHaveBeenCalled();
      expect(mockRendered.putImageData).toHaveBeenCalledWith(cachedData, 0, 0);
    });
  });

  describe('Filter Processors Logic', () => {
    it('should return empty array when no filters', () => {
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      
      const tileDrawingHandler = mockViewer.addHandler.mock.calls.find(
        call => call[0] === 'tile-drawing'
      )?.[1];

      const mockEvent = {
        tile: {},
        rendered: {
          _filterIncrement: plugin.filterIncrement,
          canvas: { width: 100, height: 100 }
        },
        tiledImage: {}
      };

      tileDrawingHandler(mockEvent);
      // Should handle gracefully
    });

    it('should match item in array of items', () => {
      const mockItem1 = { reset: vi.fn() };
      const mockItem2 = { reset: vi.fn() };
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      
      plugin.setFilterOptions({
        filters: {
          items: [mockItem1 as any, mockItem2 as any],
          processors: BRIGHTNESS(50)
        }
      });

      expect(mockItem1.reset).toHaveBeenCalled();
      expect(mockItem2.reset).toHaveBeenCalled();
    });

    it('should handle single item filter', () => {
      const mockItem = { reset: vi.fn() };
      const plugin = new FilterPlugin({ viewer: mockViewer as any });
      
      plugin.setFilterOptions({
        filters: {
          items: mockItem as any,
          processors: BRIGHTNESS(50)
        }
      });

      expect(mockItem.reset).toHaveBeenCalled();
    });
  });
});
