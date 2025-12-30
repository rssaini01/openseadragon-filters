import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterPlugin, BRIGHTNESS } from '../src';

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

    (global as any).document = {
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
    const _plugin = new FilterPlugin({ viewer: mockViewer as any });

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
    const _plugin = new FilterPlugin({ viewer: mockViewer as any });

    const tileDrawingHandler = mockViewer.addHandler.mock.calls.find(
      call => call[0] === 'tile-drawing'
    )?.[1];

    const mockEvent = {
      tile: {},
      rendered: null,
      tiledImage: {}
    };

    expect(() => tileDrawingHandler(mockEvent)).not.toThrow();
  });

  it('should restore original image data when no processors', () => {
    const _plugin = new FilterPlugin({ viewer: mockViewer as any });

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
