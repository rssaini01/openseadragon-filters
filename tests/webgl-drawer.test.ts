import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilteredWebGLDrawer, createWebGLDrawerWithFilters } from '../src/webgl-drawer';

const createMockWebGLContext = () => ({
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  deleteShader: vi.fn(),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ''),
  deleteProgram: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  createTexture: vi.fn(() => ({})),
  createFramebuffer: vi.fn(() => ({})),
  deleteFramebuffer: vi.fn(),
  deleteTexture: vi.fn(),
  deleteBuffer: vi.fn(),
  viewport: vi.fn(),
  useProgram: vi.fn(),
  bindTexture: vi.fn(),
  texParameteri: vi.fn(),
  texImage2D: vi.fn(),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  getUniformLocation: vi.fn(() => ({})),
  uniform1i: vi.fn(),
  uniform1f: vi.fn(),
  uniform2fv: vi.fn(),
  uniform3fv: vi.fn(),
  uniform1fv: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  drawArrays: vi.fn(),
  activeTexture: vi.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  TEXTURE_2D: 3553,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  TRIANGLE_STRIP: 5,
  FLOAT: 5126,
  TEXTURE_MIN_FILTER: 10241,
  TEXTURE_MAG_FILTER: 10240,
  LINEAR: 9729,
  TEXTURE_WRAP_S: 10242,
  TEXTURE_WRAP_T: 10243,
  CLAMP_TO_EDGE: 33071,
  FRAMEBUFFER: 36160,
  COLOR_ATTACHMENT0: 36064,
  TEXTURE0: 33984
});

describe('WebGL Drawer', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === 'webgl') return createMockWebGLContext();
      return null;
    }) as any;
  });

  describe('FilteredWebGLDrawer', () => {
    it('should initialize with canvas', () => {
      const canvas = document.createElement('canvas');
      expect(() => new FilteredWebGLDrawer({ canvas })).not.toThrow();
    });

    it('should throw error if WebGL not supported', () => {
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;
      expect(() => new FilteredWebGLDrawer({})).toThrow('WebGL not supported');
    });

    it('should set filter', () => {
      const drawer = new FilteredWebGLDrawer({});
      const shader = 'precision mediump float; void main() {}';
      const uniforms = { u_value: 1.0 };
      
      expect(() => drawer.setFilter(shader, uniforms)).not.toThrow();
    });

    it('should clear filter', () => {
      const drawer = new FilteredWebGLDrawer({});
      const shader = 'precision mediump float; void main() {}';
      
      drawer.setFilter(shader, {});
      expect(() => drawer.clearFilter()).not.toThrow();
    });

    it('should apply filter to texture', () => {
      const drawer = new FilteredWebGLDrawer({});
      const shader = 'precision mediump float; uniform sampler2D u_image; void main() {}';
      const uniforms = { u_value: 1.0 };
      
      drawer.setFilter(shader, uniforms);
      
      const mockTexture = {} as WebGLTexture;
      const result = drawer.applyFilterToTexture(mockTexture, 100, 100);
      
      expect(result).toBeDefined();
    });

    it('should return original texture if no filter set', () => {
      const drawer = new FilteredWebGLDrawer({});
      const mockTexture = {} as WebGLTexture;
      
      const result = drawer.applyFilterToTexture(mockTexture, 100, 100);
      expect(result).toBe(mockTexture);
    });

    it('should destroy resources', () => {
      const drawer = new FilteredWebGLDrawer({});
      expect(() => drawer.destroy()).not.toThrow();
    });
  });

  describe('createWebGLDrawerWithFilters', () => {
    it('should create drawer with viewer canvas', () => {
      const viewer = {
        canvas: document.createElement('canvas')
      } as any;
      
      const drawer = createWebGLDrawerWithFilters(viewer);
      expect(drawer).toBeInstanceOf(FilteredWebGLDrawer);
    });
  });
});
