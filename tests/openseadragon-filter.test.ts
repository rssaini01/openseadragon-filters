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
      expect(plugin.filterIncrement).toBe(1); // Constructor calls setOptions which increments
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
});
