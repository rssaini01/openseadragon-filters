import * as Shaders from './webgl-shaders';
import OpenSeadragon from 'openseadragon';
import { createShaderProgram } from './webgl-utils';

export class FilteredWebGLDrawer {
    private readonly gl: WebGLRenderingContext;
    private readonly baseProgram: WebGLProgram | null = null;
    private filterProgram: WebGLProgram | null = null;
    private currentFilter: { shader: string; uniforms: Record<string, any> } | null = null;
    private framebuffer: WebGLFramebuffer | null = null;
    private texture: WebGLTexture | null = null;

    constructor(options: any) {
        const canvas = options.canvas || document.createElement('canvas');
        const gl = canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        });

        if (!gl) throw new Error('WebGL not supported');
        this.gl = gl;
        this.initializeWebGL();
    }

    private initializeWebGL(): void {
        const gl = this.gl;
        this.framebuffer = gl.createFramebuffer();
        this.texture = gl.createTexture();
    }

    private compileShader(source: string, type: number): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + info);
        }
        return shader;
    }

    private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const gl = this.gl;
        const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);
        const program = createShaderProgram(gl, vertexShader, fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error('Program linking failed: ' + info);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }

    setFilter(shader: string, uniforms: Record<string, any>): void {
        this.currentFilter = { shader, uniforms };
        if (this.filterProgram) {
            this.gl.deleteProgram(this.filterProgram);
        }
        this.filterProgram = this.createProgram(Shaders.vertexShader, shader);
    }

    clearFilter(): void {
        this.currentFilter = null;
        if (this.filterProgram) {
            this.gl.deleteProgram(this.filterProgram);
            this.filterProgram = null;
        }
    }

    applyFilterToTexture(texture: WebGLTexture, width: number, height: number): WebGLTexture {
        if (!this.filterProgram || !this.currentFilter) return texture;

        const gl = this.gl;
        const outputTexture = gl.createTexture()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

        gl.useProgram(this.filterProgram);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(this.filterProgram, 'u_image'), 0);

        for (const [name, value] of Object.entries(this.currentFilter.uniforms)) {
            const location = gl.getUniformLocation(this.filterProgram, name);
            if (location) {
                if (typeof value === 'number') {
                    gl.uniform1f(location, value);
                } else if (Array.isArray(value)) {
                    if (value.length === 2) gl.uniform2fv(location, value);
                    else if (value.length === 3) gl.uniform3fv(location, value);
                    else gl.uniform1fv(location, value);
                }
            }
        }

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(this.filterProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

        const texCoordLocation = gl.getAttribLocation(this.filterProgram, 'a_texCoord');
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        gl.viewport(0, 0, width, height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(texCoordBuffer);

        return outputTexture;
    }

    destroy(): void {
        const gl = this.gl;
        if (this.baseProgram) gl.deleteProgram(this.baseProgram);
        if (this.filterProgram) gl.deleteProgram(this.filterProgram);
        if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
        if (this.texture) gl.deleteTexture(this.texture);
    }
}

export const createWebGLDrawerWithFilters = (viewer: OpenSeadragon.Viewer) => {
    return new FilteredWebGLDrawer({ canvas: viewer.canvas });
};
