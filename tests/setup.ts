import { vi } from 'vitest';

// Mock WebGL context with all common methods
const mockWebGLContext = {
  canvas: {},
  drawingBufferWidth: 300,
  drawingBufferHeight: 150,
  // Create methods
  createShader: vi.fn(),
  createProgram: vi.fn(),
  createBuffer: vi.fn(),
  createTexture: vi.fn(),
  createFramebuffer: vi.fn(),
  createRenderbuffer: vi.fn(),
  // Bind methods
  bindBuffer: vi.fn(),
  bindTexture: vi.fn(),
  bindFramebuffer: vi.fn(),
  bindRenderbuffer: vi.fn(),
  // Buffer methods
  bufferData: vi.fn(),
  bufferSubData: vi.fn(),
  // Texture methods
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  // Program methods
  useProgram: vi.fn(),
  linkProgram: vi.fn(),
  validateProgram: vi.fn(),
  // Shader methods
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  attachShader: vi.fn(),
  // Attribute methods
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  getAttribLocation: vi.fn(),
  getUniformLocation: vi.fn(),
  // Uniform methods
  uniform1f: vi.fn(),
  uniform1i: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  // Drawing methods
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  // State methods
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  // Framebuffer methods
  framebufferTexture2D: vi.fn(),
  framebufferRenderbuffer: vi.fn(),
  renderbufferStorage: vi.fn(),
  checkFramebufferStatus: vi.fn(),
  // Other common methods
  getParameter: vi.fn(),
  getExtension: vi.fn(),
  activeTexture: vi.fn(),
  generateMipmap: vi.fn(),
};

// Mock Canvas 2D context
const mockCanvas2DContext = {
  canvas: { width: 100, height: 100 },
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100 * 100 * 4),
    width: 100,
    height: 100
  })),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return mockWebGLContext as any;
  }
  if (contextType === '2d') {
    return mockCanvas2DContext as any;
  }
  return null;
}) as any;

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
  if (tagName === 'canvas') {
    const canvas = originalCreateElement.call(document, 'canvas') as any;
    canvas.width = 100;
    canvas.height = 100;
    return canvas;
  }
  return originalCreateElement.call(document, tagName);
});
