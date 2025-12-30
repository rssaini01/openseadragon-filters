import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterPlugin, BRIGHTNESS, INVERT } from '../src';

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
