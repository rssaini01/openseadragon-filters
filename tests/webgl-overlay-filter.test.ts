import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initWebGLFiltering, convertToWebGLFilter } from '../src';

// Mock OpenSeadragon viewer
const createMockViewer = () => {
  const handlers: Record<string, Function[]> = {};
  const canvas = document.createElement('canvas');
  const drawerCanvas = document.createElement('canvas');
  
  return {
    canvas,
    drawer: {
      canvas: drawerCanvas
    },
    addHandler: vi.fn((event: string, handler: Function) => {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(handler);
    }),
    removeHandler: vi.fn(),
    _handlers: handlers,
    _triggerEvent: (event: string) => {
      handlers[event]?.forEach(h => h());
    }
  };
};

describe('WebGL Overlay Filter', () => {
  beforeEach(() => {
    // Mock 2D context
    const mock2DContext = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn()
    };

    // Mock WebGL context
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
      if (type === '2d') {
        return mock2DContext;
      }
      if (type === 'webgl') {
        return {
          createShader: vi.fn(() => ({})),
          shaderSource: vi.fn(),
          compileShader: vi.fn(),
          getShaderParameter: vi.fn(() => true),
          createProgram: vi.fn(() => ({})),
          attachShader: vi.fn(),
          linkProgram: vi.fn(),
          getProgramParameter: vi.fn(() => true),
          createBuffer: vi.fn(() => ({})),
          bindBuffer: vi.fn(),
          bufferData: vi.fn(),
          createTexture: vi.fn(() => ({})),
          createFramebuffer: vi.fn(() => ({})),
          viewport: vi.fn(),
          clearColor: vi.fn(),
          clear: vi.fn(),
          bindTexture: vi.fn(),
          texParameteri: vi.fn(),
          texImage2D: vi.fn(),
          bindFramebuffer: vi.fn(),
          framebufferTexture2D: vi.fn(),
          useProgram: vi.fn(),
          activeTexture: vi.fn(),
          uniform1i: vi.fn(),
          getUniformLocation: vi.fn(() => ({})),
          uniform1f: vi.fn(),
          uniform2fv: vi.fn(),
          uniform3fv: vi.fn(),
          uniform1fv: vi.fn(),
          getAttribLocation: vi.fn(() => 0),
          enableVertexAttribArray: vi.fn(),
          vertexAttribPointer: vi.fn(),
          drawArrays: vi.fn(),
          deleteTexture: vi.fn(),
          deleteFramebuffer: vi.fn(),
          deleteProgram: vi.fn(),
          deleteBuffer: vi.fn(),
          VERTEX_SHADER: 35633,
          FRAGMENT_SHADER: 35632,
          COMPILE_STATUS: 35713,
          LINK_STATUS: 35714,
          ARRAY_BUFFER: 34962,
          STATIC_DRAW: 35044,
          TEXTURE_2D: 3553,
          RGBA: 6408,
          UNSIGNED_BYTE: 5121,
          TEXTURE0: 33984,
          FRAMEBUFFER: 36160,
          COLOR_ATTACHMENT0: 36064,
          COLOR_BUFFER_BIT: 16384,
          TRIANGLE_STRIP: 5,
          FLOAT: 5126
        };
      }
      return null;
    }) as any;
  });

  describe('initWebGLFiltering', () => {
    it('should initialize and return filter plugin', () => {
      const viewer = createMockViewer();
      const plugin = initWebGLFiltering(viewer as any);

      expect(plugin).toHaveProperty('setFilters');
      expect(plugin).toHaveProperty('clearFilters');
      expect(plugin).toHaveProperty('destroy');
    });

    it('should register event handlers', () => {
      const viewer = createMockViewer();
      initWebGLFiltering(viewer as any);

      expect(viewer.addHandler).toHaveBeenCalledWith('update-viewport', expect.any(Function));
      expect(viewer.addHandler).toHaveBeenCalledWith('animation-finish', expect.any(Function));
    });

    it('should set filters', () => {
      const viewer = createMockViewer();
      const plugin = initWebGLFiltering(viewer as any);
      
      const filter = convertToWebGLFilter('test', 'void main() {}', {});
      expect(() => plugin.setFilters([filter])).not.toThrow();
    });

    it('should clear filters', () => {
      const viewer = createMockViewer();
      const plugin = initWebGLFiltering(viewer as any);
      
      expect(() => plugin.clearFilters()).not.toThrow();
    });
  });

  describe('convertToWebGLFilter', () => {
    it('should create WebGLFilterConfig', () => {
      const shader = 'precision mediump float; void main() {}';
      const uniforms = { u_value: 1.0 };
      const filter = convertToWebGLFilter('test', shader, uniforms);

      expect(filter).toHaveProperty('name', 'test');
      expect(filter).toHaveProperty('shader', shader);
      expect(filter).toHaveProperty('uniforms', uniforms);
    });

    it('should handle empty uniforms', () => {
      const filter = convertToWebGLFilter('test', 'void main() {}', {});

      expect(filter).toHaveProperty('uniforms');
      expect(Object.keys(filter.uniforms)).toHaveLength(0);
    });
  });
});
