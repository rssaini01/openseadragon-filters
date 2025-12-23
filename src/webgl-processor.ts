import * as Shaders from './webgl-shaders';

interface ShaderProgram {
  program: WebGLProgram;
  locations: {
    position?: number;
    texCoord?: number;
    [key: string]: any;
  };
}

class WebGLFilterProcessor {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private programs: Map<string, ShaderProgram> = new Map();
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private framebuffer: WebGLFramebuffer | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.canvas.getContext('webgl', { premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    this.initBuffers();
  }

  private initBuffers(): void {
    const gl = this.gl;
    
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

    this.texture = gl.createTexture();
    this.framebuffer = gl.createFramebuffer();
  }

  private compileShader(source: string, type: number): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): ShaderProgram {
    const gl = this.gl;
    const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }

    return {
      program,
      locations: {
        position: gl.getAttribLocation(program, 'a_position'),
        texCoord: gl.getAttribLocation(program, 'a_texCoord')
      }
    };
  }

  private getProgram(name: string, fragmentShader: string): ShaderProgram {
    if (!this.programs.has(name)) {
      this.programs.set(name, this.createProgram(Shaders.vertexShader, fragmentShader));
    }
    return this.programs.get(name)!;
  }

  private setupTexture(image: HTMLImageElement | HTMLCanvasElement): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  private render(program: ShaderProgram): void {
    const gl = this.gl;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(program.locations.position!);
    gl.vertexAttribPointer(program.locations.position!, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(program.locations.texCoord!);
    gl.vertexAttribPointer(program.locations.texCoord!, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  applyFilter(context: CanvasRenderingContext2D, filterName: string, fragmentShader: string, uniforms: Record<string, any>, callback?: () => void): void {
    const gl = this.gl;
    const sourceCanvas = context.canvas;
    
    this.canvas.width = sourceCanvas.width;
    this.canvas.height = sourceCanvas.height;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    const program = this.getProgram(filterName, fragmentShader);
    gl.useProgram(program.program);

    this.setupTexture(sourceCanvas);

    for (const [name, value] of Object.entries(uniforms)) {
      const location = gl.getUniformLocation(program.program, name);
      if (location) {
        if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
          if (value.length === 2) gl.uniform2fv(location, value);
          else if (value.length === 3) gl.uniform3fv(location, value);
          else if (value.length === 9) gl.uniform1fv(location, value);
          else gl.uniform1fv(location, value);
        }
      }
    }

    const imageLocation = gl.getUniformLocation(program.program, 'u_image');
    gl.uniform1i(imageLocation, 0);

    this.render(program);

    context.drawImage(this.canvas, 0, 0);
    callback?.();
  }

  destroy(): void {
    const gl = this.gl;
    this.programs.forEach(p => gl.deleteProgram(p.program));
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
  }
}

const processor = new WebGLFilterProcessor();

export const createWebGLFilter = (filterName: string, fragmentShader: string, uniforms: Record<string, any>) => {
  return (context: CanvasRenderingContext2D, callback?: () => void) => {
    processor.applyFilter(context, filterName, fragmentShader, uniforms, callback);
  };
};
