import type { FilterProcessor } from './openseadragon-filter';

const applyLookupTable = (context: CanvasRenderingContext2D, precomputed: number[], callback?: () => void): void => {
    const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const pixels = imgData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = precomputed[pixels[i]];
        pixels[i + 1] = precomputed[pixels[i + 1]];
        pixels[i + 2] = precomputed[pixels[i + 2]];
    }
    context.putImageData(imgData, 0, 0);
    callback?.();
};

export const THRESHOLDING = (threshold: number): FilterProcessor => {
    if (threshold < 0 || threshold > 255) {
        throw new Error('Threshold must be between 0 and 255.');
    }
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const v = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = v < threshold ? 0 : 255;
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};

export const BRIGHTNESS = (adjustment: number): FilterProcessor => {
    if (adjustment < -255 || adjustment > 255) {
        throw new Error('Brightness adjustment must be between -255 and 255.');
    }
    const precomputed = Array.from({ length: 256 }, (_, i) => i + adjustment);
    return (context, callback) => applyLookupTable(context, precomputed, callback);
};

export const CONTRAST = (adjustment: number): FilterProcessor => {
    if (adjustment < 0) {
        throw new Error('Contrast adjustment must be positive.');
    }
    const precomputed = Array.from({ length: 256 }, (_, i) => i * adjustment);
    return (context, callback) => applyLookupTable(context, precomputed, callback);
};

export const GAMMA = (adjustment: number): FilterProcessor => {
    if (adjustment < 0) {
        throw new Error('Gamma adjustment must be positive.');
    }
    const precomputed = Array.from({ length: 256 }, (_, i) => Math.pow(i / 255, adjustment) * 255);
    return (context, callback) => applyLookupTable(context, precomputed, callback);
};

export const GREYSCALE = (): FilterProcessor => {
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const val = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = val;
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};

export const INVERT = (): FilterProcessor => {
    const precomputed = Array.from({ length: 256 }, (_, i) => 255 - i);
    return (context, callback) => applyLookupTable(context, precomputed, callback);
};

export const MORPHOLOGICAL_OPERATION = (kernelSize: number, comparator: (a: number, b: number) => number): FilterProcessor => {
    if (kernelSize % 2 === 0) {
        throw new Error('The kernel size must be an odd number.');
    }
    const kernelHalfSize = Math.floor(kernelSize / 2);
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const originalPixels = new Uint8ClampedArray(imgData.data);
        const pixels = imgData.data;
        const width = imgData.width;
        const height = imgData.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    let value = originalPixels[i + c];
                    for (let ky = -kernelHalfSize; ky <= kernelHalfSize; ky++) {
                        for (let kx = -kernelHalfSize; kx <= kernelHalfSize; kx++) {
                            const pixelY = y + ky;
                            const pixelX = x + kx;
                            if (pixelY >= 0 && pixelY < height && pixelX >= 0 && pixelX < width) {
                                const pixelIndex = (pixelY * width + pixelX) * 4;
                                value = comparator(value, originalPixels[pixelIndex + c]);
                            }
                        }
                    }
                    pixels[i + c] = value;
                }
            }
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};

export const CONVOLUTION = (kernel: number[]): FilterProcessor => {
    const kernelSize = Math.sqrt(kernel.length);
    if (kernelSize % 2 === 0) {
        throw new Error('The kernel must have an odd size.');
    }
    const kernelHalfSize = Math.floor(kernelSize / 2);
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const originalPixels = new Uint8ClampedArray(imgData.data);
        const pixels = imgData.data;
        const width = imgData.width;
        const height = imgData.height;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                    let value = 0;
                    for (let ky = -kernelHalfSize; ky <= kernelHalfSize; ky++) {
                        for (let kx = -kernelHalfSize; kx <= kernelHalfSize; kx++) {
                            const pixelY = y + ky;
                            const pixelX = x + kx;
                            if (pixelY >= 0 && pixelY < height && pixelX >= 0 && pixelX < width) {
                                const pixelIndex = (pixelY * width + pixelX) * 4;
                                const kernelIndex = (ky + kernelHalfSize) * kernelSize + (kx + kernelHalfSize);
                                value += originalPixels[pixelIndex + c] * kernel[kernelIndex];
                            }
                        }
                    }
                    pixels[i + c] = value;
                }
            }
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};

export const COLORMAP = (stops: number[][], centerpoint: number = 128): FilterProcessor => {
    const colormap = new Array(256);
    for (let i = 0; i < 256; i++) {
        const normalized = i < centerpoint ? i / centerpoint : (i - centerpoint) / (255 - centerpoint);
        const stopIndex = normalized * (stops.length - 1);
        const lowerIndex = Math.floor(stopIndex);
        const upperIndex = Math.ceil(stopIndex);
        const t = stopIndex - lowerIndex;
        colormap[i] = [
            stops[lowerIndex][0] * (1 - t) + stops[upperIndex][0] * t,
            stops[lowerIndex][1] * (1 - t) + stops[upperIndex][1] * t,
            stops[lowerIndex][2] * (1 - t) + stops[upperIndex][2] * t
        ];
    }
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
            const gray = Math.round((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
            const color = colormap[gray];
            pixels[i] = color[0];
            pixels[i + 1] = color[1];
            pixels[i + 2] = color[2];
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};