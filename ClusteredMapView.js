'use-strict'

// base libs
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import {
  Platform,
  Dimensions,
  LayoutAnimation
} from 'react-native'
// map-related libs
import { MapView } from 'expo'
import SuperCluster from 'supercluster'
import GeoViewport from '@mapbox/geo-viewport'
// components / views
import ClusterMarker from './ClusterMarker'
// libs / utils
import {
  regionToBoundingBox,
  boundingBoxToRegion,
  itemToGeoJSONFeature
} from './util'

export default class ClusteredMapView extends PureComponent {

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

  mapRef = (ref) => this.mapview = ref

  getMapRef = () => this.mapview

  getClusteringEngine = () => this.index

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
    const bbox = regionToBoundingBox(region),
          viewport = (region.longitudeDelta) >= 40 ? { zoom: this.props.minZoom } : GeoViewport.viewport(bbox, this.dimensions)

    return this.index.getClusters(bbox, viewport.zoom)
  }

  onClusterPress = (cluster) => {

    // cluster press behavior might be extremely custom.
    if (!this.props.preserveClusterPressBehavior) {
      this.props.onClusterPress && this.props.onClusterPress(cluster.properties.cluster_id)
      return
    }

    if (this.props.onClusterPress) {
        console.warn("you can't preserve the original cluster press behaviour and perform a custom onClusterPress function, using original cluster press method")
    }

    // //////////////////////////////////////////////////////////////////////////////////
    // NEW IMPLEMENTATION (with fitToCoordinates)
    // //////////////////////////////////////////////////////////////////////////////////
    // get cluster children
    const children = this.index.getLeaves(cluster.properties.cluster_id, this.props.clusterPressMaxChildren),
          markers = children.map(c => c.properties.item)

    // fit right around them, keeping edge padding into account
    this.mapview.fitToCoordinates(markers.map(m => m.location), { edgePadding: this.props.edgePadding })

    this.props.onClusterPress && this.props.onClusterPress(cluster.properties.cluster_id, markers)

    // //////////////////////////////////////////////////////////////////////////////////
    // OLD, LESS ACCURATE, IMPLEMENTATION (with animateToRegion)
    // //////////////////////////////////////////////////////////////////////////////////
    // let ne = { latitude: 0, longitude: 0 },
    //     sw = { latitude: 1000, longitude: 1000 }

    // children.forEach(c => {
    //   const location = c.properties.item.location

    //   ne.latitude = Math.max(ne.latitude, location.latitude)
    //   ne.longitude = Math.max(ne.longitude, location.longitude)

    //   sw.latitude = Math.min(sw.latitude, location.latitude)
    //   sw.longitude = Math.min(sw.longitude, location.longitude)
    // })

    // this.mapview.animateToRegion(boundingBoxToRegion({ ne, sw }))
    // this.props.onClusterPress && this.props.onClusterPress(cluster.properties.cluster_id, children)
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
                renderCluster={this.props.renderCluster}
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
  clusterPressMaxChildren: 100,
  preserveClusterPressBehavior: true,
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  edgePadding: { top: 10, left: 10, right: 10, bottom: 10 }
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
  clusterPressMaxChildren: PropTypes.number.isRequired,
  clusterInitialDimension: PropTypes.number.isRequired,
  // array
  data: PropTypes.array.isRequired,
  // func
  onExplode: PropTypes.func,
  onImplode: PropTypes.func,
  scaleUpRatio: PropTypes.func,
  renderCluster: PropTypes.func,
  onClusterPress: PropTypes.func,
  renderMarker: PropTypes.func.isRequired,
  // bool
  animateClusters: PropTypes.bool.isRequired,
  clusteringEnabled: PropTypes.bool.isRequired,
  preserveClusterPressBehavior: PropTypes.bool.isRequired,
  // object
  textStyle: PropTypes.object.isRequired,
  edgePadding: PropTypes.object.isRequired,
  containerStyle: PropTypes.object.isRequired,
  // string
}
