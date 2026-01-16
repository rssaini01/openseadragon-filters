import { describe, it, expect } from 'vitest';
import {
  BRIGHTNESS_WEBGL,
  CONTRAST_WEBGL,
  GAMMA_WEBGL,
  GREYSCALE_WEBGL,
  INVERT_WEBGL,
  THRESHOLDING_WEBGL,
  CONVOLUTION_WEBGL,
  COLORMAP_WEBGL,
  DILATION_WEBGL,
  EROSION_WEBGL
} from '../src';

describe('WebGL Filters', () => {
  describe('BRIGHTNESS_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const filter = BRIGHTNESS_WEBGL(50);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_adjustment', 50);
    });

    it('should throw error for invalid brightness values', () => {
      expect(() => BRIGHTNESS_WEBGL(-300)).toThrow('Brightness adjustment must be between -255 and 255');
      expect(() => BRIGHTNESS_WEBGL(300)).toThrow('Brightness adjustment must be between -255 and 255');
    });
  });

  describe('CONTRAST_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const filter = CONTRAST_WEBGL(1.5);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_adjustment', 1.5);
    });

    it('should throw error for negative contrast', () => {
      expect(() => CONTRAST_WEBGL(-1)).toThrow('Contrast adjustment must be positive');
    });
  });

  describe('GAMMA_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const filter = GAMMA_WEBGL(2.2);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_adjustment', 2.2);
    });

    it('should throw error for negative gamma', () => {
      expect(() => GAMMA_WEBGL(-1)).toThrow('Gamma adjustment must be positive');
    });
  });

  describe('GREYSCALE_WEBGL', () => {
    it('should return WebGLFilterConfig with shader', () => {
      const filter = GREYSCALE_WEBGL();
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
    });
  });

  describe('INVERT_WEBGL', () => {
    it('should return WebGLFilterConfig with shader', () => {
      const filter = INVERT_WEBGL();
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
    });
  });

  describe('THRESHOLDING_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const filter = THRESHOLDING_WEBGL(128);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_threshold', 128);
    });

    it('should throw error for invalid threshold values', () => {
      expect(() => THRESHOLDING_WEBGL(-1)).toThrow('Threshold must be between 0 and 255');
      expect(() => THRESHOLDING_WEBGL(300)).toThrow('Threshold must be between 0 and 255');
    });
  });

  describe('CONVOLUTION_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      const filter = CONVOLUTION_WEBGL(kernel);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_kernel');
    });

    it('should throw error for invalid kernel size', () => {
      expect(() => CONVOLUTION_WEBGL([1, 2, 3, 4])).toThrow('Kernel must be 3x3 (9 elements)');
    });
  });

  describe('COLORMAP_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const stops = [[0, 0, 255], [0, 255, 0], [255, 0, 0]];
      const filter = COLORMAP_WEBGL(stops);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_colorStops');
      expect(filter.uniforms).toHaveProperty('u_numStops', 3);
      expect(filter.uniforms).toHaveProperty('u_centerpoint', 128);
    });

    it('should accept custom centerpoint', () => {
      const stops = [[0, 0, 0], [255, 255, 255]];
      const filter = COLORMAP_WEBGL(stops, 64);
      expect(filter.uniforms).toHaveProperty('u_centerpoint', 64);
    });
  });

  describe('DILATION_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const filter = DILATION_WEBGL(3);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_kernelSize', 3);
    });

    it('should throw error for even kernel size', () => {
      expect(() => DILATION_WEBGL(4)).toThrow('Kernel size must be an odd number >= 3');
    });

    it('should throw error for kernel size < 3', () => {
      expect(() => DILATION_WEBGL(1)).toThrow('Kernel size must be an odd number >= 3');
    });
  });

  describe('EROSION_WEBGL', () => {
    it('should return WebGLFilterConfig with shader and uniforms', () => {
      const filter = EROSION_WEBGL(5);
      expect(filter).toHaveProperty('shader');
      expect(filter).toHaveProperty('uniforms');
      expect(filter.uniforms).toHaveProperty('u_kernelSize', 5);
    });

    it('should throw error for even kernel size', () => {
      expect(() => EROSION_WEBGL(4)).toThrow('Kernel size must be an odd number >= 3');
    });

    it('should throw error for kernel size < 3', () => {
      expect(() => EROSION_WEBGL(1)).toThrow('Kernel size must be an odd number >= 3');
    });
  });
});
