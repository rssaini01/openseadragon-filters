import { h } from 'preact';
import Slider from './components/Slider';
import * as Filters from '../src/openseadragon-filter';

export const availableFilters = [
    {
        name: 'Brightness',
        help: 'Brightness must be between -255 (darker) and 255 (brighter).',
        sync: true,
        defaultValue: 50,
        renderControl: (onChange, value) => h(Slider, {
            value: value || 50,
            min: -255,
            max: 255,
            step: 1,
            onChange
        }),
        getFilter: (value) => Filters.BRIGHTNESS(value || 50)
    },
    {
        name: 'Contrast',
        help: 'Range is from 0 to 4. Values between 0 and 1 lessen contrast, values > 1 increase it.',
        sync: true,
        defaultValue: 1.3,
        renderControl: (onChange, value) => h(Slider, {
            value: value || 1.3,
            min: 0,
            max: 4,
            step: 0.1,
            onChange
        }),
        getFilter: (value) => Filters.CONTRAST(value || 1.3)
    },
    {
        name: 'Gamma',
        help: 'Range is from 0 to 5. Values between 0 and 1 lessen contrast, values > 1 increase it.',
        defaultValue: 0.5,
        renderControl: (onChange, value) => h(Slider, {
            value: value || 0.5,
            min: 0,
            max: 5,
            step: 0.1,
            onChange
        }),
        getFilter: (value) => Filters.GAMMA(value || 0.5)
    },
    {
        name: 'Greyscale',
        sync: true,
        getFilter: () => Filters.GREYSCALE()
    },
    {
        name: 'Invert',
        sync: true,
        getFilter: () => Filters.INVERT()
    },
    {
        name: 'Thresholding',
        help: 'The threshold must be between 0 and 255.',
        sync: true,
        defaultValue: 127,
        renderControl: (onChange, value) => h(Slider, {
            value: value || 127,
            min: 0,
            max: 255,
            step: 1,
            onChange
        }),
        getFilter: (value) => Filters.THRESHOLDING(value || 127)
    },
    {
        name: 'Dilation',
        help: 'The dilation kernel size must be an odd number.',
        sync: true,
        defaultValue: 3,
        renderControl: (onChange, value) => h(Slider, {
            value: value || 3,
            min: 3,
            max: 51,
            step: 2,
            onChange
        }),
        getFilter: (value) => Filters.MORPHOLOGICAL_OPERATION(value || 3, Math.max)
    },
    {
        name: 'Erosion',
        help: 'The erosion kernel size must be an odd number.',
        sync: true,
        defaultValue: 3,
        renderControl: (onChange, value) => h(Slider, {
            value: value || 3,
            min: 3,
            max: 51,
            step: 2,
            onChange
        }),
        getFilter: (value) => Filters.MORPHOLOGICAL_OPERATION(value || 3, Math.min)
    }
].sort((a, b) => a.name.localeCompare(b.name));
