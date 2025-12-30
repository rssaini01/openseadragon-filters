# OpenSeadragon Filters

[![codecov](https://codecov.io/github/rssaini01/openseadragon-filters/graph/badge.svg?token=MU0kWouujb)](https://codecov.io/github/rssaini01/openseadragon-filters)
[![npm version](https://img.shields.io/npm/v/openseadragon-filters.svg)](https://www.npmjs.com/package/openseadragon-filters)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/rssaini01/openseadragon-filters/deploy-demo-site.yml?branch=main)](https://github.com/rssaini01/openseadragon-filters/actions)
[![Downloads](https://img.shields.io/npm/dm/openseadragon-filters.svg)](https://www.npmjs.com/package/openseadragon-filters)

This [OpenSeadragon](http://openseadragon.github.io/) plugin provides the capability to add filters to the images.

A demo is available [here](https://rssaini01.github.io/openseadragon-filters/) and here is
the [NPM Package](https://www.npmjs.com/package/openseadragon-filters).

This plugin requires OpenSeadragon 5.0+.

### Basic usage

Increase the brightness:

`````javascript
import { initializeFiltering, BRIGHTNESS } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: BRIGHTNESS(50)
  }
});
`````

Decrease the brightness and invert the image:

`````javascript
import { initializeFiltering, BRIGHTNESS, INVERT } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: [
      BRIGHTNESS(-50),
      INVERT()
    ]
  }
});
`````

### Specify on which items (TiledImage) to apply the filters

Increase the brightness on item 0 and invert items 1 and 2:

`````javascript
import { initializeFiltering, BRIGHTNESS, INVERT } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: [{
    items: viewer.world.getItemAt(0),
    processors: [
      BRIGHTNESS(50)
    ]
  }, {
    items: [viewer.world.getItemAt(1), viewer.world.getItemAt(2)],
    processors: [
      INVERT()
    ]
  }]
});
`````

Note the items property. If it is not specified, the filter is applied to all
items.

### Load mode optimization

By default, the filters are applied asynchronously. This means that the tiles are
cleared from the canvas and re-downloaded (note that the browser probably cached
them though) before having the filter applied. This avoids to hang the browser
if the filtering operation is slow. It also allows to use asynchronous filters
like the ones provided by [CamanJS](http://camanjs.com).

However, if you have only fast and synchronous filters, you can force the
synchronous mode by setting `loadMode: 'sync'`:

`````javascript
import { initializeFiltering, BRIGHTNESS } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: BRIGHTNESS(50)
  },
  loadMode: 'sync'
});
`````

To visualize the difference between async and sync mode, one can compare how
the brightness (sync) and contrast (async) filters load in the
[demo](https://rssaini01.github.io/openseadragon-filters/).

### Provided filters

This plugin includes several built-in filters:

* Thresholding

Set all pixels equals or above the specified threshold to white and the others
to black. For colored images, the average of the 3 channels is compared to the
threshold. The specified threshold must be between 0 and 255.

`````javascript
import { initializeFiltering, THRESHOLDING } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: THRESHOLDING(threshold)
  }
});
`````

* Brightness

Shift the intensity of the pixels by the specified adjustment
(between -255 and 255).

`````javascript
import { initializeFiltering, BRIGHTNESS } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: BRIGHTNESS(adjustment)
  }
});
`````

* Contrast

Adjust the contrast of the image. Must be a positive number. Values between 0 and 1
lessen contrast, values > 1 increase it.

`````javascript
import { initializeFiltering, CONTRAST } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: CONTRAST(adjustment)
  }
});
`````

* Gamma

Apply gamma correction to the image. Range is from 0 to 5. Values between 0 and 1
darken the image, values > 1 brighten it.

`````javascript
import { initializeFiltering, GAMMA } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: GAMMA(adjustment)
  }
});
`````

* Greyscale

Convert the image to greyscale by averaging the RGB channels.

`````javascript
import { initializeFiltering, GREYSCALE } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: GREYSCALE()
  }
});
`````

* Invert

Invert the colors of the image.

`````javascript
import { initializeFiltering, INVERT } from 'openseadragon-filtering';

var viewer = new OpenSeadragon({});
var filterPlugin = initializeFiltering(viewer);
filterPlugin.setFilterOptions({
  filters: {
    processors: INVERT()
  }
});
`````

### Implementing customs filters

To implement a custom filter, one need to create a function taking a
[2D context](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
and a callback as parameters. When that function is called by the plugin,
the context will be a tile's canvas context. One should use
[context.getImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData)
to retrieve the pixels values and
[context.putImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/putImageData)
to save the modified pixels.
The callback method must be called when the filtering is done. The provided
filters are good examples for such implementations.

### Edge effects

This plugin is working on tiles and does not currently handle tiles edges.
This means that if you are using kernel based filters, you should expect
edge effects around tiles.

### Build the demo

To build the demo run `npm install` and then `npm run dev`.
The result of the build will be in the `dist` folder.
