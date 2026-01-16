import * as Shaders from './webgl-shaders';
import { convertToWebGLFilter, WebGLFilterConfig } from './webgl-overlay-filter';

export const BRIGHTNESS_WEBGL = (adjustment: number): WebGLFilterConfig => {
    if (adjustment < -255 || adjustment > 255) {
        throw new Error('Brightness adjustment must be between -255 and 255.');
    }
    return convertToWebGLFilter('brightness', Shaders.brightnessShader, { u_adjustment: adjustment });
};

export const CONTRAST_WEBGL = (adjustment: number): WebGLFilterConfig => {
    if (adjustment < 0) {
        throw new Error('Contrast adjustment must be positive.');
    }
    return convertToWebGLFilter('contrast', Shaders.contrastShader, { u_adjustment: adjustment });
};

export const GAMMA_WEBGL = (adjustment: number): WebGLFilterConfig => {
    if (adjustment < 0) {
        throw new Error('Gamma adjustment must be positive.');
    }
    return convertToWebGLFilter('gamma', Shaders.gammaShader, { u_adjustment: adjustment });
};

export const INVERT_WEBGL = (): WebGLFilterConfig => {
    return convertToWebGLFilter('invert', Shaders.invertShader, {});
};

export const GREYSCALE_WEBGL = (): WebGLFilterConfig => {
    return convertToWebGLFilter('greyscale', Shaders.greyscaleShader, {});
};

export const THRESHOLDING_WEBGL = (threshold: number): WebGLFilterConfig => {
    if (threshold < 0 || threshold > 255) {
        throw new Error('Threshold must be between 0 and 255.');
    }
    return convertToWebGLFilter('threshold', Shaders.thresholdShader, { u_threshold: threshold });
};

export const CONVOLUTION_WEBGL = (kernel: number[]): WebGLFilterConfig => {
    if (kernel.length !== 9) {
        throw new Error('Kernel must be 3x3 (9 elements).');
    }
    return convertToWebGLFilter('convolution', Shaders.convolutionShader, { u_kernel: kernel });
};

export const COLORMAP_WEBGL = (stops: number[][], centerpoint: number = 128): WebGLFilterConfig => {
    const flatStops = stops.flat();
    return convertToWebGLFilter('colormap', Shaders.colormapShader, {
        u_colorStops: flatStops.map(v => v / 255),
        u_numStops: stops.length,
        u_centerpoint: centerpoint
    });
};

export const DILATION_WEBGL = (kernelSize: number): WebGLFilterConfig => {
    if (kernelSize % 2 === 0 || kernelSize < 3) {
        throw new Error('Kernel size must be an odd number >= 3.');
    }
    return convertToWebGLFilter('dilation', Shaders.dilationShader, { u_kernelSize: kernelSize });
};

export const EROSION_WEBGL = (kernelSize: number): WebGLFilterConfig => {
    if (kernelSize % 2 === 0 || kernelSize < 3) {
        throw new Error('Kernel size must be an odd number >= 3.');
    }
    return convertToWebGLFilter('erosion', Shaders.erosionShader, { u_kernelSize: kernelSize });
};
