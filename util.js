'use-strict'

/**
 * Compute bounding box for the given region
 * @param {Object} region - Google Maps/MapKit region
 * @returns {Object} - Region's bounding box as WSEN array
 */
export const regionToBoundingBox = (region) => ([
  region.longitude - region.longitudeDelta, // westLng - min lng
  region.latitude - region.latitudeDelta, // southLat - min lat
  region.longitude + region.longitudeDelta, // eastLng - max lng
  region.latitude + region.latitudeDelta // northLat - max lat
])

/**
 * Calculate region from the given bounding box.
 * Bounding box must be represented as WSEN:
 * {
 *   ws: { longitude: minLon, latitude: minLat }
 *   en: { longitude: maxLon, latitude: maxLat }
 * }
 * @param {Object} bbox - Bounding box
 * @returns {Object} - Google Maps/MapKit compliant region
 */
export const boundingBoxToRegion = (bbox) => {
  const minLon = bbox.ws.longitude * Math.PI / 180,
      maxLon = bbox.en.longitude * Math.PI / 180

  const minLat = bbox.ws.latitude * Math.PI / 180,
      maxLat = bbox.en.latitude * Math.PI / 180

  const dLon = maxLon - minLon,
      dLat = maxLat - minLat

  const x = Math.cos(maxLat) * Math.cos(dLon),
      y = Math.cos(maxLat) * Math.sin(dLon)

  const latRad = Math.atan2(Math.sin(minLat) + Math.sin(maxLat), Math.sqrt((Math.cos(minLat) + x) * (Math.cos(minLat) + x) + y * y )),
      lonRad = minLon + Math.atan2(y, Math.cos(minLat) + x)

  const latitude = latRad * 180 / Math.PI,
      longitude = lonRad * 180 / Math.PI

  return {
    latitude,
    longitude,
    latitudeDelta: dLat * 180 / Math.PI,
    longitudeDelta: dLon * 180 / Math.PI
  }
}

/**
 * Compute a RFC-compliant GeoJSON Feature object
 * from the given JS object
 * RFC7946: https://tools.ietf.org/html/rfc7946#section-3.2
 * @param {Object} item - JS object containing marker data
 * @returns {Object} - GeoJSON Feature object
 */
export const itemToGeoJSONFeature = (item) => {
  const point = Array.isArray(item) ? item[0] : item // support multi points at the same address

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.location.longitude, point.location.latitude]
    },
    properties: { point_count: 0, item } // eslint-disable-line camelcase
  }
}
