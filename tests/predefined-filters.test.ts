import { describe, it, expect, vi } from 'vitest';
import { BRIGHTNESS, CONTRAST, GAMMA, GREYSCALE, INVERT, THRESHOLDING, MORPHOLOGICAL_OPERATION, CONVOLUTION, COLORMAP } from '../src';

// Mock canvas context
const createMockContext = (width = 100, height = 100) => {
  const imageData = {
    data: new Uint8ClampedArray(width * height * 4).fill(128), // Gray pixels
    width,
    height
  };

  return {
    getImageData: vi.fn(() => imageData),
    putImageData: vi.fn(),
    canvas: { width, height }
  };
};

describe('Predefined Filters', () => {
  describe('BRIGHTNESS', () => {
    it('should apply brightness adjustment', () => {
      const context = createMockContext();
      const callback = vi.fn();
      const filter = BRIGHTNESS(50);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should throw error for invalid brightness values', () => {
      expect(() => BRIGHTNESS(-300)).toThrow('Brightness adjustment must be between -255 and 255');
      expect(() => BRIGHTNESS(300)).toThrow('Brightness adjustment must be between -255 and 255');
    });
  });

  describe('CONTRAST', () => {
    it('should apply contrast adjustment', () => {
      const context = createMockContext();
      const callback = vi.fn();
      const filter = CONTRAST(1.5);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should throw error for negative contrast', () => {
      expect(() => CONTRAST(-1)).toThrow('Contrast adjustment must be positive');
    });
  });

  describe('GAMMA', () => {
    it('should apply gamma correction', () => {
      const context = createMockContext();
      const callback = vi.fn();
      const filter = GAMMA(2.0);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should throw error for negative gamma', () => {
      expect(() => GAMMA(-1)).toThrow('Gamma adjustment must be positive');
    });
  });

  describe('GREYSCALE', () => {
    it('should convert to greyscale', () => {
      const context = createMockContext();
      const callback = vi.fn();
      const filter = GREYSCALE();

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('INVERT', () => {
    it('should invert colors', () => {
      const context = createMockContext();
      const callback = vi.fn();
      const filter = INVERT();

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('THRESHOLDING', () => {
    it('should apply thresholding', () => {
      const context = createMockContext();
      const callback = vi.fn();
      const filter = THRESHOLDING(128);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should throw error for invalid threshold values', () => {
      expect(() => THRESHOLDING(-1)).toThrow('Threshold must be between 0 and 255');
      expect(() => THRESHOLDING(300)).toThrow('Threshold must be between 0 and 255');
    });
  });

  describe('MORPHOLOGICAL_OPERATION', () => {
    it('should apply morphological operation', () => {
      const context = createMockContext(10, 10);
      const callback = vi.fn();
      const comparator = (a: number, b: number) => Math.max(a, b);
      const filter = MORPHOLOGICAL_OPERATION(3, comparator);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should throw error for even kernel size', () => {
      const comparator = (a: number, b: number) => Math.max(a, b);
      expect(() => MORPHOLOGICAL_OPERATION(4, comparator)).toThrow('The kernel size must be an odd number');
    });
  });

  describe('CONVOLUTION', () => {
    it('should apply convolution filter', () => {
      const context = createMockContext(10, 10);
      const callback = vi.fn();
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      const filter = CONVOLUTION(kernel);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should throw error for even kernel size', () => {
      const kernel = [1, 2, 3, 4]; // 2x2 kernel
      expect(() => CONVOLUTION(kernel)).toThrow('The kernel must have an odd size');
    });
  });

  describe('COLORMAP', () => {
    it('should apply colormap', () => {
      const context = createMockContext(10, 10);
      const callback = vi.fn();
      const stops = [
        [0, 0, 255],    // Blue
        [0, 255, 0],    // Green
        [255, 0, 0]     // Red
      ];
      const filter = COLORMAP(stops);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should apply colormap with custom centerpoint', () => {
      const context = createMockContext(10, 10);
      const callback = vi.fn();
      const stops = [
        [0, 0, 0],
        [255, 255, 255]
      ];
      const filter = COLORMAP(stops, 64);

      filter(context as any, callback);

      expect(context.getImageData).toHaveBeenCalled();
      expect(context.putImageData).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });
});
