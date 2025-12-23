import type { FilterProcessor } from './openseadragon-filter';
import { createWebGLFilter } from './webgl-processor';
import * as Shaders from './webgl-shaders';

export const BRIGHTNESS_WEBGL = (adjustment: number): FilterProcessor => {
    if (adjustment < -255 || adjustment > 255) {
        throw new Error('Brightness adjustment must be between -255 and 255.');
    }
    return createWebGLFilter('brightness', Shaders.brightnessShader, { u_adjustment: adjustment });
};

export const CONTRAST_WEBGL = (adjustment: number): FilterProcessor => {
    if (adjustment < 0) {
        throw new Error('Contrast adjustment must be positive.');
    }
    return createWebGLFilter('contrast', Shaders.contrastShader, { u_adjustment: adjustment });
};

export const GAMMA_WEBGL = (adjustment: number): FilterProcessor => {
    if (adjustment < 0) {
        throw new Error('Gamma adjustment must be positive.');
    }
    return createWebGLFilter('gamma', Shaders.gammaShader, { u_adjustment: adjustment });
};

export const INVERT_WEBGL = (): FilterProcessor => {
    return createWebGLFilter('invert', Shaders.invertShader, {});
};

export const GREYSCALE_WEBGL = (): FilterProcessor => {
    return createWebGLFilter('greyscale', Shaders.greyscaleShader, {});
};

export const THRESHOLDING_WEBGL = (threshold: number): FilterProcessor => {
    if (threshold < 0 || threshold > 255) {
        throw new Error('Threshold must be between 0 and 255.');
    }
    return createWebGLFilter('threshold', Shaders.thresholdShader, { u_threshold: threshold });
};

export const CONVOLUTION_WEBGL = (kernel: number[]): FilterProcessor => {
    if (kernel.length !== 9) {
        throw new Error('Kernel must be 3x3 (9 elements).');
    }
    return (context: CanvasRenderingContext2D, callback?: () => void) => {
        createWebGLFilter('convolution', Shaders.convolutionShader, {
            u_kernel: kernel,
            u_textureSize: [context.canvas.width, context.canvas.height]
        })(context, callback);
    };
};

export const COLORMAP_WEBGL = (stops: number[][], centerpoint: number = 128): FilterProcessor => {
    const flatStops = stops.flat();
    return createWebGLFilter('colormap', Shaders.colormapShader, {
        u_colorStops: flatStops.map(v => v / 255),
        u_numStops: stops.length,
        u_centerpoint: centerpoint
    });
};

export const DILATION_WEBGL = (kernelSize: number): FilterProcessor => {
    if (kernelSize % 2 === 0 || kernelSize < 3) {
        throw new Error('Kernel size must be an odd number >= 3.');
    }
    return (context: CanvasRenderingContext2D, callback?: () => void) => {
        createWebGLFilter('dilation', Shaders.dilationShader, {
            u_kernelSize: kernelSize,
            u_textureSize: [context.canvas.width, context.canvas.height]
        })(context, callback);
    };
};

export const EROSION_WEBGL = (kernelSize: number): FilterProcessor => {
    if (kernelSize % 2 === 0 || kernelSize < 3) {
        throw new Error('Kernel size must be an odd number >= 3.');
    }
    return (context: CanvasRenderingContext2D, callback?: () => void) => {
        createWebGLFilter('erosion', Shaders.erosionShader, {
            u_kernelSize: kernelSize,
            u_textureSize: [context.canvas.width, context.canvas.height]
        })(context, callback);
    };
};
