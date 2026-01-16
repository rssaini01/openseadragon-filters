import * as Shaders from './webgl-shaders';
import OpenSeadragon from 'openseadragon';
import { configureTexture } from './webgl-utils';

export interface WebGLFilterConfig {
    name?: string;
    shader: string;
    uniforms: Record<string, any>;
}

export interface WebGLFiltering {
    setFilters: (newFilters: WebGLFilterConfig[]) => void;
    clearFilters: () => void;
    destroy: () => void;
}

type ExtendedViewer = OpenSeadragon.Viewer & { canvas: HTMLCanvasElement }

class WebGLFilterRenderer {
    private readonly gl: WebGLRenderingContext;
    private readonly canvas: HTMLCanvasElement;
    private readonly programs: Map<string, WebGLProgram> = new Map();
    private readonly buffers: { position: WebGLBuffer; texCoord: WebGLBuffer };
    private readonly overlayCanvas: HTMLCanvasElement;
    private readonly overlayContext: CanvasRenderingContext2D;

    constructor(private readonly viewer: ExtendedViewer) {
        this.canvas = document.createElement('canvas');
        const gl = this.canvas.getContext('webgl', { premultipliedAlpha: false, preserveDrawingBuffer: true });
        if (!gl) throw new Error('WebGL not supported');
        this.gl = gl;

        this.overlayCanvas = document.createElement('canvas');
        this.overlayContext = this.overlayCanvas.getContext('2d')!;

        this.buffers = this.createBuffers();
        this.setupOverlay();
    }

    private createBuffers() {
        const gl = this.gl;
        const position = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const texCoord = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoord);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

        return { position, texCoord };
    }

    private setupOverlay() {
        const container = this.viewer.canvas.parentElement;
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.width = '100%';
        this.overlayCanvas.style.height = '100%';
        this.overlayCanvas.style.pointerEvents = 'none';
        this.overlayCanvas.style.zIndex = '0';
        container?.appendChild(this.overlayCanvas);

        this.viewer.canvas.style.opacity = '0';
    }

    private compileShader(source: string, type: number): WebGLShader {
        if (!source) {
            throw new Error(`Shader source is ${source}. Type: ${type === this.gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'}`);
        }
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error('Shader error: ' + gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    private createProgram(fragmentShader: string): WebGLProgram {
        if (!fragmentShader) {
            throw new Error('Fragment shader source is undefined');
        }
        const gl = this.gl;
        const vs = this.compileShader(Shaders.vertexShader, gl.VERTEX_SHADER);
        const fs = this.compileShader(fragmentShader, gl.FRAGMENT_SHADER);
        const program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Program error: ' + gl.getProgramInfoLog(program));
        }
        return program;
    }

    private getProgram(key: string, shader: string): WebGLProgram {
        if (!this.programs.has(key)) {
            this.programs.set(key, this.createProgram(shader));
        }
        return this.programs.get(key)!;
    }

    private setupTexture(texture: WebGLTexture, canvas: HTMLCanvasElement) {
        const gl = this.gl;
        configureTexture(gl, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    }

    private createOutputTexture(framebuffer: WebGLFramebuffer): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        configureTexture(gl, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        return texture;
    }

    private setUniforms(program: WebGLProgram, uniforms: Record<string, any>) {
        const gl = this.gl;
        for (const [name, value] of Object.entries(uniforms)) {
            const loc = gl.getUniformLocation(program, name);
            if (!loc) continue;
            if (typeof value === 'number') {
                if (name === 'u_kernelSize') {
                    gl.uniform1i(loc, value);
                } else {
                    gl.uniform1f(loc, value);
                }
            } else if (Array.isArray(value)) {
                if (value.length === 2) gl.uniform2fv(loc, value);
                else if (value.length === 3) gl.uniform3fv(loc, value);
                else gl.uniform1fv(loc, value);
            }
        }
    }

    private setupAttributes(program: WebGLProgram) {
        const gl = this.gl;
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const texLoc = gl.getAttribLocation(program, 'a_texCoord');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texCoord);
        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    }

    private renderToOverlay() {
        this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        this.overlayContext.save();
        this.overlayContext.scale(1, -1);
        this.overlayContext.drawImage(this.canvas, 0, -this.overlayCanvas.height);
        this.overlayContext.restore();
    }

    applyFilters(filters: WebGLFilterConfig[]) {
        if (filters.length === 0) {
            this.clearFilters();
            return;
        }

        this.viewer.canvas.style.opacity = '0';
        const viewerCanvas = this.viewer.drawer.canvas as HTMLCanvasElement;
        this.canvas.width = viewerCanvas.width;
        this.canvas.height = viewerCanvas.height;
        this.overlayCanvas.width = viewerCanvas.width;
        this.overlayCanvas.height = viewerCanvas.height;

        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const texture = gl.createTexture()!;
        this.setupTexture(texture, viewerCanvas);

        let currentTexture = texture;
        const framebuffer = gl.createFramebuffer();
        const tempTextures: WebGLTexture[] = [];

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            if (!filter.shader) {
                throw new Error(`Filter at index ${i} is missing shader property`);
            }
            const program = this.getProgram(`filter_${i}_${Date.now()}`, filter.shader);
            gl.useProgram(program);

            const isLastFilter = i === filters.length - 1;
            if (isLastFilter) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                tempTextures.push(this.createOutputTexture(framebuffer));
            }

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, currentTexture);
            gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

            this.setUniforms(program, filter.uniforms);
            this.setupAttributes(program);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            if (i > 0 && currentTexture !== texture) {
                gl.deleteTexture(currentTexture);
            }
            currentTexture = isLastFilter ? texture : tempTextures[tempTextures.length - 1];
        }

        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture);
        tempTextures.forEach(t => gl.deleteTexture(t));

        this.renderToOverlay();
    }

    clearFilters() {
        this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        this.viewer.canvas.style.opacity = '1';
    }

    destroy() {
        this.programs.forEach(p => this.gl.deleteProgram(p));
        this.gl.deleteBuffer(this.buffers.position);
        this.gl.deleteBuffer(this.buffers.texCoord);
        if (this.overlayCanvas.parentNode) {
            this.overlayCanvas.remove();
        }
    }
}

export const initWebGLFiltering = (viewer: OpenSeadragon.Viewer): WebGLFiltering => {
    const renderer = new WebGLFilterRenderer(viewer as ExtendedViewer);
    let filters: WebGLFilterConfig[] = [];

    const updateFilters = () => {
        if (filters.length > 0) {
            renderer.applyFilters(filters);
        } else {
            renderer.clearFilters();
        }
    };

    viewer.addHandler('update-viewport', updateFilters);
    viewer.addHandler('animation-finish', updateFilters);

    return {
        setFilters: (newFilters: WebGLFilterConfig[]) => {
            filters = newFilters;
            updateFilters();
        },
        clearFilters: () => {
            filters = [];
            renderer.clearFilters();
        },
        destroy: () => renderer.destroy()
    };
};

export const convertToWebGLFilter = (name: string, shader: string, uniforms: Record<string, any>): WebGLFilterConfig => ({
    name,
    shader,
    uniforms
});
