# leaflet-binglayer
Yet another Leaflet plugin that handles Bing Maps layers.

[![Build status](https://travis-ci.org/mcartoixa/leaflet-binglayer.svg?branch=master)](https://travis-ci.org/mcartoixa/leaflet-binglayer)

This plugin is loosely based on [leaflet-bing-layer](https://github.com/digidem/leaflet-bing-layer/blob/gh-pages/leaflet-bing-layer.js) and
[leaflet-plugins](https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js). Check them out, you might find there is better
support there ;-)

The main difference here is that :
* this plugin has no dependency (outside of [leaflet](http://leafletjs.com/) v1+ of course).
* it caches Bing metadata in memory, which should result in fewer [Bing Maps transactions](https://msdn.microsoft.com/en-us/library/ff859477.aspx) when:
  * you need more than 1 map in the same page.
  * your maps are part of a Single Page Application.

## Usage

## Development
You can live test the plugin:
* create a `.env` file (cf. [dotenv](https://github.com/motdotla/dotenv)) at the root of your project that defines the `BING_KEY` variable with your Bing Maps key.
* run `npm run-script debug`.
* open your browser at http://localhost:8000.