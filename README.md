# OpenSeadragon Filters

[![codecov](https://codecov.io/github/rssaini01/openseadragon-filters/graph/badge.svg?token=MU0kWouujb)](https://codecov.io/github/rssaini01/openseadragon-filters)
[![npm version](https://img.shields.io/npm/v/openseadragon-filters.svg)](https://www.npmjs.com/package/openseadragon-filters)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/rssaini01/openseadragon-filters/ci.yml?branch=main)](https://github.com/rssaini01/openseadragon-filters/actions)
[![Downloads](https://img.shields.io/npm/dm/openseadragon-filters.svg)](https://www.npmjs.com/package/openseadragon-filters)

A high-performance [OpenSeadragon](http://openseadragon.github.io/) plugin that provides real-time image filtering capabilities using WebGL acceleration.

🎨 [**Live Demo**](https://rssaini01.github.io/openseadragon-filters/) | 📦 [**NPM Package**](https://www.npmjs.com/package/openseadragon-filters)

## Features

- ⚡ **WebGL-accelerated** filtering for optimal performance
- 🎯 **Multiple built-in filters**: brightness, contrast, gamma, threshold, invert, greyscale
- 🔧 **Customizable**: create your own filters
- 🎭 **Per-item filtering**: apply different filters to different images
- 🔄 **Sync/Async modes**: choose between immediate or progressive rendering
- 📦 **TypeScript support**: full type definitions included
- 🌐 **Modern ESM/CJS**: supports both module formats

## Requirements

- OpenSeadragon 5.0+
- Node.js 20+ (for development)

## Installation

```bash
npm install openseadragon-filters
```

or

```bash
yarn add openseadragon-filters
```

## Quick Start

```javascript
import OpenSeadragon from 'openseadragon';
import { initializeFiltering, BRIGHTNESS } from 'openseadragon-filters';

const viewer = OpenSeadragon({
  id: 'viewer',
  tileSources: 'path/to/image.dzi'
});

const filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: BRIGHTNESS(50)
  }
});
```

## Usage

### Single Filter

```javascript
import { initializeFiltering, BRIGHTNESS } from 'openseadragon-filters';

const filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: BRIGHTNESS(50)
  }
});
```

### Multiple Filters

Filters are applied in the order specified:

```javascript
import { initializeFiltering, BRIGHTNESS, INVERT, CONTRAST } from 'openseadragon-filters';

filterPlugin.setFilterOptions({
  filters: {
    processors: [
      BRIGHTNESS(-50),
      CONTRAST(1.5),
      INVERT()
    ]
  }
});
```

### Per-Item Filtering

Apply different filters to specific images:

```javascript
import { initializeFiltering, BRIGHTNESS, INVERT } from 'openseadragon-filters';

filterPlugin.setFilterOptions({
  filters: [
    {
      items: viewer.world.getItemAt(0),
      processors: [BRIGHTNESS(50)]
    },
    {
      items: [viewer.world.getItemAt(1), viewer.world.getItemAt(2)],
      processors: [INVERT()]
    }
  ]
});
```

> **Note:** If the `items` property is not specified, filters are applied to all items in the viewer.

### Load Modes

The plugin supports two rendering modes:

#### Async Mode (Default)

Tiles are progressively filtered as they load, preventing browser freezing:

```javascript
filterPlugin.setFilterOptions({
  filters: { processors: BRIGHTNESS(50) },
  loadMode: 'async' // default
});
```

#### Sync Mode

Filters are applied immediately for faster rendering with simple filters:

```javascript
filterPlugin.setFilterOptions({
  filters: { processors: BRIGHTNESS(50) },
  loadMode: 'sync'
});
```

> **Tip:** Use sync mode for fast, synchronous filters. Use async mode for complex or slow filters to maintain UI responsiveness.

## Built-in Filters

### BRIGHTNESS(adjustment)

Adjusts pixel intensity.

- **Range:** -255 to 255
- **Effect:** Negative values darken, positive values brighten

```javascript
BRIGHTNESS(50)  // Increase brightness
BRIGHTNESS(-50) // Decrease brightness
```

### CONTRAST(adjustment)

Adjusts image contrast.

- **Range:** 0 to ∞ (typically 0-3)
- **Effect:** Values < 1 reduce contrast, values > 1 increase contrast

```javascript
CONTRAST(1.5) // Increase contrast
CONTRAST(0.5) // Decrease contrast
```

### GAMMA(adjustment)

Applies gamma correction.

- **Range:** 0 to 5
- **Effect:** Values < 1 darken, values > 1 brighten

```javascript
GAMMA(2.2) // Standard gamma correction
GAMMA(0.5) // Darken image
```

### THRESHOLDING(threshold)

Converts image to black and white based on threshold.

- **Range:** 0 to 255
- **Effect:** Pixels ≥ threshold become white, others become black

```javascript
THRESHOLDING(128) // Standard threshold
```

### GREYSCALE()

Converts image to greyscale.

```javascript
GREYSCALE()
```

### INVERT()

Inverts all colors.

```javascript
INVERT()
```

## Custom Filters

Create custom filters by implementing a function that processes canvas context:

```javascript
function customFilter(context, callback) {
  const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const pixels = imageData.data;
  
  // Modify pixels (RGBA format)
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255 - pixels[i];     // Red
    pixels[i + 1] = 255 - pixels[i + 1]; // Green
    pixels[i + 2] = 255 - pixels[i + 2]; // Blue
    // pixels[i + 3] is alpha
  }
  
  context.putImageData(imageData, 0, 0);
  callback();
}

// Use the custom filter
filterPlugin.setFilterOptions({
  filters: {
    processors: customFilter
  }
});
```

### Custom Filter Requirements

1. Accept a [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) as the first parameter
2. Accept a callback function as the second parameter
3. Call the callback when processing is complete
4. Use `context.getImageData()` to read pixels
5. Use `context.putImageData()` to write modified pixels

## API Reference

### initializeFiltering(viewer)

Initializes the filtering plugin for an OpenSeadragon viewer.

**Parameters:**
- `viewer` (OpenSeadragon.Viewer): The OpenSeadragon viewer instance

**Returns:** FilterPlugin instance

### filterPlugin.setFilterOptions(options)

Configures and applies filters.

**Parameters:**
- `options.filters` (Object|Array): Filter configuration
  - `processors` (Function|Array): Single filter or array of filters
  - `items` (TiledImage|Array): Optional. Specific items to filter
- `options.loadMode` (String): Optional. 'async' (default) or 'sync'

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import OpenSeadragon from 'openseadragon';
import { initializeFiltering, BRIGHTNESS, FilterPlugin } from 'openseadragon-filters';

const viewer: OpenSeadragon.Viewer = OpenSeadragon({ id: 'viewer' });
const filterPlugin: FilterPlugin = initializeFiltering(viewer);

filterPlugin.setFilterOptions({
  filters: {
    processors: BRIGHTNESS(50)
  }
});
```

## Known Limitations

### Tile Edge Effects

The plugin processes tiles independently and does not handle cross-tile boundaries. Kernel-based filters may produce visible artifacts at tile edges.

## Development

### Setup

```bash
git clone https://github.com/rssaini01/openseadragon-filters.git
cd openseadragon-filters
npm install
```

### Build

```bash
npm run build        # Build library
npm run dev          # Start demo dev server
npm run build:demo   # Build demo site
```

### Testing

```bash
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Project Structure

```
openseadragon-filters/
├── src/                 # Source code
│   ├── index.ts        # Main entry point
│   ├── predefined-filters.ts
│   └── webgl-*.ts      # WebGL implementation
├── site/               # Demo application
├── tests/              # Test suite
└── dist/               # Built output
    ├── esm/           # ES modules
    ├── cjs/           # CommonJS
    └── types/         # TypeScript definitions
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Tests pass (`npm test`)
- Code follows existing style
- TypeScript types are updated

## License

MIT © [Ravi Shankar Saini](https://github.com/rssaini01)

See [LICENSE](./LICENSE) for details.

## Acknowledgments

- Built for [OpenSeadragon](http://openseadragon.github.io/)
- Inspired by image processing needs in digital libraries and archives

## Links

- [Demo](https://rssaini01.github.io/openseadragon-filters/)
- [NPM Package](https://www.npmjs.com/package/openseadragon-filters)
- [GitHub Repository](https://github.com/rssaini01/openseadragon-filters)
- [Issue Tracker](https://github.com/rssaini01/openseadragon-filters/issues)
- [OpenSeadragon](http://openseadragon.github.io/)
