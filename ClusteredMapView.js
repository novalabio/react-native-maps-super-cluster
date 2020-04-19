// base libs
import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {Dimensions, LayoutAnimation} from 'react-native'
// map-related libs
import MapView from 'react-native-maps'
// components / views
import ClusterMarker from './ClusterMarker'
// libs / utils
import {
  IS_ANDROID,
  createIndex,
  computeClusters,
  getCoordinatesFromItem,
} from './util'

export default class ClusteredMapView extends PureComponent {

  constructor(props) {
    super(props)

    this.mapview = React.createRef()
  }

  static getDerivedStateFromProps(props, state) {
    const dataChanged = state.prevDataProps !== props.data

    // `region` must be taken from `props` only at initial mount,
    // only `state` matters afterward
    const region = state.region ? state.region : props.region || props.initialRegion
    
    let index = state.index
    let data = null

    const {width, height, accessor, minZoom, maxZoom, extent, radius} = props

    // we reuse `index` when only `region` change, whereas we reset it
    // if underlying data has changed (i.e. data from `props`)
    if (!index || dataChanged) {
      index = createIndex(props.data, {
        extent,
        radius,
        minZoom,
        maxZoom,
        width,
        accessor,
      })
    }

    data = computeClusters(index, region, {width,  height}, {minZoom})

    return {
      prevRegion: region,
      prevDataProps: props.data,
      index,
      data,
      region,
    };
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    const clustersChanged = prevState.data.length !== this.state.data.length

    if (!IS_ANDROID && this.props.animateClusters && clustersChanged) {
      LayoutAnimation.configureNext(this.props.layoutAnimationConf)
    }

    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.region !== this.state.region && this.props.onRegionChangeComplete) {
      this.props.onRegionChangeComplete(this.state.region, this.state.data)
    }
  }

  getMapRef() {
    return this.mapview
  }

  getClusteringEngine() {
    return this.state.index
  }

  onRegionChangeComplete = (region) => {
    this.setState({ region })
  }

  onClusterPress = (cluster) => {

    // cluster press behavior might be extremely custom.
    if (!this.props.preserveClusterPressBehavior) {
      this.props.onClusterPress && this.props.onClusterPress(cluster.properties.cluster_id)
      return
    }

    // //////////////////////////////////////////////////////////////////////////////////
    // NEW IMPLEMENTATION (with fitToCoordinates)
    // //////////////////////////////////////////////////////////////////////////////////
    // get cluster children
    const children = this.state.index.getLeaves(cluster.properties.cluster_id, this.props.clusterPressMaxChildren)
    const markers = children.map(c => c.properties.item)

    const coordinates = markers.map(item => getCoordinatesFromItem(item, this.props.accessor, false))

    // fit right around them, considering edge padding
    if (this.mapview.current) {
      this.mapview.current.fitToCoordinates(coordinates, { edgePadding: this.props.edgePadding })
    }

    this.props.onClusterPress && this.props.onClusterPress(cluster.properties.cluster_id, markers)
  }

  render() {
    const { style, ...props } = this.props

    return (
      <MapView
        {...props}
        style={style}
        ref={this.mapview}
        onRegionChangeComplete={this.onRegionChangeComplete}>
        {
          this.props.clusteringEnabled && this.state.data.map((d) => {
            if (d.properties.point_count === 0)
              return this.props.renderMarker(d.properties.item)

            return (
              <ClusterMarker
                {...d}
                onPress={this.onClusterPress}
                renderCluster={this.props.renderCluster}
                key={`cluster-${d.properties.cluster_id}`} />
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
  maxZoom: 16,
  extent: 512,
  accessor: 'location',
  animateClusters: true,
  clusteringEnabled: true,
  clusterPressMaxChildren: 100,
  preserveClusterPressBehavior: true,
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
  layoutAnimationConf: LayoutAnimation.Presets.spring,
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
  clusterPressMaxChildren: PropTypes.number.isRequired,
  // array
  data: PropTypes.array.isRequired,
  // func
  onExplode: PropTypes.func,
  onImplode: PropTypes.func,
  onClusterPress: PropTypes.func,
  renderMarker: PropTypes.func.isRequired,
  renderCluster: PropTypes.func.isRequired,
  // bool
  animateClusters: PropTypes.bool.isRequired,
  clusteringEnabled: PropTypes.bool.isRequired,
  preserveClusterPressBehavior: PropTypes.bool.isRequired,
  // object
  layoutAnimationConf: PropTypes.object,
  edgePadding: PropTypes.object.isRequired,
  // string
  // mutiple
  accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
}
