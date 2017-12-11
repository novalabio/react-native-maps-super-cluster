'use-strict'

// base libs
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import {
  Platform,
  Dimensions,
  // PixelRatio,
  LayoutAnimation
} from 'react-native'
// map-related libs
import MapView from 'react-native-maps'
import SuperCluster from 'supercluster'
import GeoViewport from '@mapbox/geo-viewport'
// components / views
import ClusterMarker from './ClusterMarker'

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
    this.dimensions = [this.props.width, this.props.height]
    this.isAndroid = Platform.OS === 'android'

    this.setState({ region: this.props.region || this.props.initialRegion })
  }

  componentDidMount() {
    this.clusterize(this.props.data)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data !== nextProps.data)
      this.clusterize(nextProps.data)
  }

  componentWillUpdate(nextProps, nextState) {
    !this.isAndroid && this.props.animateClusters
                    && this.clustersChanged(nextState)
                    && LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
  }

  mapRef = (ref) => {
    this.mapview = ref
  }

  getMapRef = () => this.mapview

  clusterize = (dataset) => {
    this.index = SuperCluster({ // eslint-disable-line new-cap
      extent: this.props.extent,
      minZoom: this.props.minZoom,
      maxZoom: this.props.maxZoom,
      radius: this.props.radius || (this.dimensions[0] * .045), // 4.5% of screen width
    })

    // get formatted GeoPoints for cluster
    const rawData = dataset.map(itemToGeoJSONFeature)

    // load geopoints into SuperCluster
    this.index.load(rawData)

    const data = this.getClusters(this.state.region)
    this.setState({ data })
  }

  clustersChanged = (nextState) => this.state.data.length !== nextState.data.length

  onRegionChangeComplete = (region) => {
    if (region.longitudeDelta <= 80) {
      const data = this.getClusters(region)
      this.setState({ region, data })
    }
    this.props.onRegionChangeComplete && this.props.onRegionChangeComplete(region)
  }

  getClusters = (region) => {
    const bbox = getBoundingBox(region),
          viewport = (region.longitudeDelta) >= 40 ? { zoom: this.props.minZoom } : GeoViewport.viewport(bbox, this.dimensions)

    return this.index.getClusters(bbox, viewport.zoom)
  }

  onClusterPress = (cluster) => {
    this.props.onClusterPress && this.props.onClusterPress(cluster)

    let expansionZoom = this.index.getClusterExpansionZoom(cluster.properties.cluster_id)

    // fix strange behavior on exspansionZoom calcs
    expansionZoom === 1 && expansionZoom++

    const newBbox = GeoViewport.bounds([cluster.geometry.coordinates[1], cluster.geometry.coordinates[0]], expansionZoom, this.dimensions)

    const latitudeDelta = (newBbox[3] - newBbox[1]) / 2,
          longitudeDelta = (newBbox[2] - newBbox[0]) / 2

    const center = {
      latitude: cluster.geometry.coordinates[1],
      longitude: cluster.geometry.coordinates[0],
      latitudeDelta: latitudeDelta / 2,
      longitudeDelta: longitudeDelta / 2,
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
          this.props.clusteringEnabled && this.state.data.map((d) => {
            if (d.properties.point_count === 0)
              return this.props.renderMarker(d.properties.item)

            return (
              <ClusterMarker
                {...d}
                onPress={this.onClusterPress}
                textStyle={this.props.textStyle}
                scaleUpRatio={this.props.scaleUpRatio}
                renderMarker={this.props.renderMarker}
                key={`cluster-${d.properties.cluster_id}`}
                containerStyle={this.props.containerStyle}
                clusterInitialFontSize={this.props.clusterInitialFontSize}
                clusterInitialDimension={this.props.clusterInitialDimension} />
            )
          })
        }
        {
          !this.props.clusteringEnabled && this.props.data.map(d => this.props.renderMarker(d))
        }
        {this.props.children}
      </MapView>
    )
  }
}

ClusteredMapView.defaultProps = {
  minZoom: 1,
  maxZoom: 20,
  extent: 512,
  animateClusters: true,
  clusteringEnabled: true,
  clusterInitialFontSize: 12,
  clusterInitialDimension: 30,
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height
}

ClusteredMapView.propTypes = {
  ...MapView.propTypes,
  // number
  radius: PropTypes.number,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  extent: PropTypes.number.isRequired,
  minZoom: PropTypes.number.isRequired,
  maxZoom: PropTypes.number.isRequired,
  clusterInitialFontSize: PropTypes.number.isRequired,
  clusterInitialDimension: PropTypes.number.isRequired,
  // array
  data: PropTypes.array.isRequired,
  // func
  onExplode: PropTypes.func,
  onImplode: PropTypes.func,
  scaleUpRatio: PropTypes.func,
  onClusterPress: PropTypes.func,
  renderMarker: PropTypes.func.isRequired,
  // bool
  animateClusters: PropTypes.bool.isRequired,
  clusteringEnabled: PropTypes.bool.isRequired,
  // object
  textStyle: PropTypes.object.isRequired,
  containerStyle: PropTypes.object.isRequired,
  // string
}
