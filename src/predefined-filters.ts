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

interface MorphologicalContext {
    originalPixels: Uint8ClampedArray;
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
    kernelHalfSize: number;
    comparator: (a: number, b: number) => number;
}

export const MORPHOLOGICAL_OPERATION = (kernelSize: number, comparator: (a: number, b: number) => number): FilterProcessor => {
    if (kernelSize % 2 === 0) {
        throw new Error('The kernel size must be an odd number.');
    }
    const kernelHalfSize = Math.floor(kernelSize / 2);
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const morphContext: MorphologicalContext = {
            originalPixels: new Uint8ClampedArray(imgData.data),
            pixels: imgData.data,
            width: imgData.width,
            height: imgData.height,
            kernelHalfSize,
            comparator
        };

        for (let y = 0; y < morphContext.height; y++) {
            for (let x = 0; x < morphContext.width; x++) {
                const i = (y * morphContext.width + x) * 4;
                applyMorphologicalOperation(morphContext, i, x, y);
            }
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};

function applyMorphologicalOperation(ctx: MorphologicalContext, pixelIndex: number, x: number, y: number): void {
    for (let c = 0; c < 3; c++) {
        let value = ctx.originalPixels[pixelIndex + c];
        for (let ky = -ctx.kernelHalfSize; ky <= ctx.kernelHalfSize; ky++) {
            for (let kx = -ctx.kernelHalfSize; kx <= ctx.kernelHalfSize; kx++) {
                const pixelY = y + ky;
                const pixelX = x + kx;
                if (isPixelInBounds(pixelX, pixelY, ctx.width, ctx.height)) {
                    const neighborIndex = (pixelY * ctx.width + pixelX) * 4;
                    value = ctx.comparator(value, ctx.originalPixels[neighborIndex + c]);
                }
            }
        }
        ctx.pixels[pixelIndex + c] = value;
    }
}

interface ConvolutionContext {
    originalPixels: Uint8ClampedArray;
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
    kernel: number[];
    kernelSize: number;
    kernelHalfSize: number;
}

export const CONVOLUTION = (kernel: number[]): FilterProcessor => {
    const kernelSize = Math.sqrt(kernel.length);
    if (kernelSize % 2 === 0) {
        throw new Error('The kernel must have an odd size.');
    }
    const kernelHalfSize = Math.floor(kernelSize / 2);
    return (context, callback) => {
        const imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        const convContext: ConvolutionContext = {
            originalPixels: new Uint8ClampedArray(imgData.data),
            pixels: imgData.data,
            width: imgData.width,
            height: imgData.height,
            kernel,
            kernelSize,
            kernelHalfSize
        };

        for (let y = 0; y < convContext.height; y++) {
            for (let x = 0; x < convContext.width; x++) {
                const i = (y * convContext.width + x) * 4;
                applyConvolutionToPixel(convContext, i, x, y);
            }
        }
        context.putImageData(imgData, 0, 0);
        callback?.();
    };
};

function applyConvolutionToPixel(ctx: ConvolutionContext, pixelIndex: number, x: number, y: number): void {
    for (let c = 0; c < 3; c++) {
        ctx.pixels[pixelIndex + c] = computeConvolutionValue(ctx, x, y, c);
    }
}

function computeConvolutionValue(ctx: ConvolutionContext, x: number, y: number, channel: number): number {
    let value = 0;
    for (let ky = -ctx.kernelHalfSize; ky <= ctx.kernelHalfSize; ky++) {
        for (let kx = -ctx.kernelHalfSize; kx <= ctx.kernelHalfSize; kx++) {
            const pixelY = y + ky;
            const pixelX = x + kx;
            if (isPixelInBounds(pixelX, pixelY, ctx.width, ctx.height)) {
                const pixelIndex = (pixelY * ctx.width + pixelX) * 4;
                const kernelIndex = (ky + ctx.kernelHalfSize) * ctx.kernelSize + (kx + ctx.kernelHalfSize);
                value += ctx.originalPixels[pixelIndex + channel] * ctx.kernel[kernelIndex];
            }
        }
    }
    return value;
}

function isPixelInBounds(x: number, y: number, width: number, height: number): boolean {
    return y >= 0 && y < height && x >= 0 && x < width;
}

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