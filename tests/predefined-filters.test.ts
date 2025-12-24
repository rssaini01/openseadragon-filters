import { describe, it, expect, vi } from 'vitest';
import { BRIGHTNESS, CONTRAST, GAMMA, GREYSCALE, INVERT, THRESHOLDING } from '../src';

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
  });
});
