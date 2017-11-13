'use-strict'

// base libs
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {
  Platform,
  Dimensions,
  PixelRatio,
  LayoutAnimation
} from 'react-native'
// map-related libs
import MapView from 'react-native-maps'
import SuperCluster from 'supercluster'
import GeoViewport from '@mapbox/geo-viewport'
// components / views
import CustomMarker from './CustomMarker'

const itemToGeoJSONFeature = (item) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [item.location.longitude, item.location.latitude]
  },
  properties: { point_count: 0, item } // eslint-disable-line camelcase
})

const getBoundingBox = (region) => ([
  region.longitude - region.longitudeDelta, // westLng - min lng
  region.latitude - region.latitudeDelta, // southLat - min lat
  region.longitude + region.longitudeDelta, // eastLng - max lng
  region.latitude + region.latitudeDelta // northLat - max lat
])

const isRelevantChange = (prevRegion, region) => region.longitudeDelta <= 80

export default class ClusteredMapView extends Component {

  constructor(props) {
    super(props)

    this.state = {
      data: [], // helds renderable clusters and markers
      region: {}, // helds current map region
    }

    this.mapRef = this.mapRef.bind(this)
    this.onClusterPress = this.onClusterPress.bind(this)
    this.onRegionChangeComplete = this.onRegionChangeComplete.bind(this)
  }

  componentWillMount() {
    const { width, height } = Dimensions.get('window')

    this.width = this.props.width || width
    this.height = this.props.height || height
    this.isAndroid = Platform.OS === 'android'

    this.index = SuperCluster({ // eslint-disable-line new-cap
      extent: 256,
      maxZoom: this.props.maxZoom,
      radius: PixelRatio.roundToNearestPixel(this.props.clusterRadius)
    })

    this.setState({ region: this.props.region || this.props.initialRegion })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data) {
      // get formatted GeoPoints for cluster
      const rawData = nextProps.data.map(itemToGeoJSONFeature)
      // load geopoints into SuperCluster
      this.index.load(rawData)

      const data = this.getClusters(this.state.region)
      this.setState({ data })
    }
  }

  componentWillUpdate(nextProps, nextState) {
    !this.isAndroid && this.props.animateClusters
                    && this.clustersChanged(nextState)
                    && LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
  }

  mapRef(ref) {
    this.mapview = ref
  }

  clustersChanged = (nextState) =>
    Object.keys(this.state.data).length !== Object.keys(nextState.data).length

  onRegionChangeComplete(region) {
    if (this.state.data.length > 0 && isRelevantChange(this.state.region, region)) {
      const data = this.getClusters(region)
      this.setState({ region, data })
    }
  }

  getClusters(region) {
    const bbox = getBoundingBox(region),
          viewport = (region.longitudeDelta) >= 40 ? 0 : GeoViewport.viewport(bbox, [this.width, this.height])

    return this.index.getClusters(bbox, viewport.zoom || 0)
  }

  onClusterPress(cluster) {
    const center = {
      latitude: cluster.geometry.coordinates[1],
      longitude: cluster.geometry.coordinates[0],
      latitudeDelta: this.state.region.latitudeDelta / 4,
      longitudeDelta: this.state.region.longitudeDelta / 4
    }

    this.mapview && this.mapview.animateToRegion(center)
  }

  render() {
    return (
      <MapView
        { ...this.props}
        ref={this.mapRef}
        onRegionChangeComplete={this.onRegionChangeComplete}>
        {
          this.state.data.map((d, i) => {
            return (
              <CustomMarker
                {...d}
                key={`cluster-marker${i}`}
                onPress={this.onClusterPress}
                renderMarker={this.props.renderMarker} />
            )
          })
        }
      </MapView>
    )
  }
}
ClusteredMapView.defaultProps = {
  maxZoom: 40,
  clusterRadius: 20,
  animateClusters: true,
  clusteringEnabled: true
}

ClusteredMapView.propTypes = {
  ...MapView.propTypes,
  // number
  width: PropTypes.number,
  height: PropTypes.number,
  clusterRadius: PropTypes.number.isRequired, // ppi
  // array
  data: PropTypes.array.isRequired,
  // func
  onExplode: PropTypes.func,
  onImplode: PropTypes.func,
  onClusterPress: PropTypes.func,
  renderMarker: PropTypes.func.isRequired,
  // bool
  animateClusters: PropTypes.bool.isRequired,
  clusteringEnabled: PropTypes.bool.isRequired,
  // string
}
