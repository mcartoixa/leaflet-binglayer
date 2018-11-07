// cf. https://github.com/umdjs/umd/blob/master/templates/amdWeb.js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([ 'leaflet' ], function (L) {
      return (root.L.BingLayer = factory(L))
    })
  } else {
    // Browser globals
    root.L.BingLayer = factory(root.L)
  }
}(typeof self !== 'undefined' ? self : this, function (L) {
  // Inspired by:
  //  https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.js
  //  https://github.com/digidem/leaflet-bing-layer/blob/gh-pages/leaflet-bing-layer.js

  var bingMetadata = {
  }

  var coordsToQuadkey = function (coords, zoom) {
    var quad = ''
    for (var i = zoom; i > 0; i--) {
      var digit = 0
      var mask = 1 << (i - 1)
      if ((coords.x & mask) !== 0) digit += 1
      if ((coords.y & mask) !== 0) digit += 2
      quad = quad + digit
    }
    return quad
  }

  var BingLayer = L.TileLayer.extend({
    options: {
      culture: 'en-US',
      imagerySet: 'Road',
      maxZoom: 21,
      minZoom: 1,
      subdomains: []
    },

    initialize: function (bingKey, options) {
      L.Util.setOptions(this, options)

      this.bingKey = bingKey
      this._providers = []
      this._url = null

      this._currentProtocol = document.location.protocol.startsWith('http') ? document.location.protocol.slice(0, -1) : 'https'
      this._mdCallbackName = L.Util.template(
        '_bing_metadata_{imagerySet}_{culture}_{uriScheme}', {
          culture: this.options.culture.replace(/[^a-zA-Z]/g, ''),
          imagerySet: this.options.imagerySet,
          uriScheme: this._currentProtocol
        }
      )
      this._mdEventName = this._mdCallbackName + ':completed'

      this._loadMetadata()
    },

    createTile: function (coords, done) {
      // cf. https://github.com/Leaflet/Leaflet/blob/v1.3.1/src/layer/tile/TileLayer.js#L128
      var tile = document.createElement('img')
      L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile))
      L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError, this, done, tile))
      if (this.options.crossOrigin) {
        tile.crossOrigin = ''
      }
      tile.alt = ''
      tile.setAttribute('role', 'presentation')

      var src = this.getTileUrl(coords)
      // If the metadata have not been fetched yet, try again when they have
      if (!src) {
        var self = this
        window.addEventListener(this._mdEventName, function () {
          // Make sure the metadata have been loaded first
          BingLayer.prototype._loadMetadata.call(self)
          tile.src = BingLayer.prototype.getTileUrl.call(self, coords)
        }, false)
      } else {
        tile.src = src
      }

      return tile
    },

    getTileUrl: function (coords) {
      // cf. https://github.com/Leaflet/Leaflet/blob/v1.3.1/src/layer/tile/TileLayer.js#L161

      if (!this._url) {
        return undefined
      }

      var zoom = this._getZoomForUrl()
      var data = {
        culture: encodeURIComponent(this.options.culture ? this.options.culture : 'en-US'),
        quadkey: encodeURIComponent(coordsToQuadkey(coords, zoom)),
        subdomain: encodeURIComponent(this._getSubdomain(coords))
      }

      return L.Util.template(this._url, data)
    },

    onAdd: function (map) {
      if (map.attributionControl) {
        map.on('moveend', this._updateAttribution, this)
      }
      L.TileLayer.prototype.onAdd.call(this, map)
    },

    onRemove: function (map) {
      if (map.attributionControl) {
        map.off('moveend', this._updateAttribution, this)
        for (var i = 0; i < this._providers.length; i++) {
          var p = this._providers[ i ]
          if (p.active && map.attributionControl) {
            map.attributionControl.removeAttribution(p.attrib)
            p.active = false
          }
        }
      }

      L.TileLayer.prototype.onRemove.call(this, map)
    },

    _loadMetadata: function () {
      if (this._url) {
        return
      }

      var self = this
      var parseMetadata = function (data) {
        if (data.errorDetails) {
          throw new Error(data.errorDetails)
        }

        var r = data.resourceSets[ 0 ].resources[ 0 ]
        self._url = r.imageUrl
        self.options.subdomains = r.imageUrlSubdomains

        // Init providers: will be used for attributions
        if (r.imageryProviders) {
          for (var i = 0; i < r.imageryProviders.length; i++) {
            var p = r.imageryProviders[ i ]
            for (var j = 0; j < p.coverageAreas.length; j++) {
              var c = p.coverageAreas[ j ]
              var coverage = {
                zoomMin: c.zoomMin,
                zoomMax: c.zoomMax,
                active: false
              }
              var bounds = new L.LatLngBounds(
                new L.LatLng(c.bbox[ 0 ] + 0.01, c.bbox[ 1 ] + 0.01),
                new L.LatLng(c.bbox[ 2 ] - 0.01, c.bbox[ 3 ] - 0.01)
              )
              coverage.bounds = bounds
              coverage.attrib = p.attribution
              self._providers.push(coverage)
            }
          }
        }

        if (!bingMetadata[ self.options.imagerySet ]) {
          bingMetadata[ self.options.imagerySet ] = {
          }
        }
        if (!bingMetadata[ self.options.imagerySet ][ self.options.culture ]) {
          bingMetadata[ self.options.imagerySet ][ self.options.culture ] = {
          }
        }
        bingMetadata[ self.options.imagerySet ][ self.options.culture ][ self._currentProtocol ] = data
      }
      var useCachedMetadata = function () {
        if (bingMetadata[ self.options.imagerySet ] && bingMetadata[ self.options.imagerySet ][ self.options.culture ]) {
          var metadata = bingMetadata[ self.options.imagerySet ][ self.options.culture ][ self._currentProtocol ]
          if (metadata) {
            parseMetadata(metadata)
            return true
          }
        }
        return false
      }

      if (useCachedMetadata()) {
        return
      }

      if (!window[ this._mdCallbackName ]) {
        window[ this._mdCallbackName ] = function (data) {
          window[ self._mdCallbackName ] = undefined
          parseMetadata(data)

          var event = document.createEvent('Event')
          event.initEvent(self._mdEventName, true, false)
          event.metadata = data
          window.dispatchEvent(event)
        }

        // cf. https://msdn.microsoft.com/en-us/library/ff701716.aspx
        var src = L.Util.template(
          '{uriScheme}://dev.virtualearth.net/REST/v1/Imagery/Metadata/{imagerySet}?culture={culture}&include=ImageryProviders&jsonp={jsonp}&key={key}&output=json&uriScheme={uriScheme}',
          {
            culture: encodeURIComponent(this.options.culture),
            include: 'ImageryProviders',
            imagerySet: this.options.imagerySet,
            jsonp: encodeURIComponent(this._mdCallbackName),
            key: encodeURIComponent(this.bingKey),
            output: 'json',
            uriScheme: this._currentProtocol
          }
        )

        var head = document.getElementsByTagName('head')[ 0 ]
        var script = L.DomUtil.create('script', '', head)
        script.type = 'text/javascript'
        script.async = true
        script.src = src

        document.getElementsByTagName('head')[ 0 ].appendChild(script)
      }
      window.addEventListener(this._mdEventName, function () {
        BingLayer.prototype._loadMetadata.call(self)
        BingLayer.prototype._updateAttribution.call(self)
      }, false)
    },

    _updateAttribution: function () {
      if (this._map && this._map.attributionControl) {
        var bounds = L.latLngBounds(this._map.getBounds().getSouthWest().wrap(), this._map.getBounds().getNorthEast().wrap())
        var zoom = this._map.getZoom()
        for (var i = 0; i < this._providers.length; i++) {
          var p = this._providers[ i ]
          if ((zoom <= p.zoomMax && zoom >= p.zoomMin) && bounds.intersects(p.bounds)) {
            if (!p.active && this._map.attributionControl) { this._map.attributionControl.addAttribution(p.attrib) }
            p.active = true
          } else {
            if (p.active && this._map.attributionControl) { this._map.attributionControl.removeAttribution(p.attrib) }
            p.active = false
          }
        }
      }
    }
  })

  L.bingLayer = function (key, options) {
    return new BingLayer(key, options)
  }

  return BingLayer
}))
