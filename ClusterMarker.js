'use-strict'

// base libs
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Marker } from 'react-native-maps'
import { Text, View, StyleSheet } from  'react-native'
// constants
import { COLORS } from '../../constants'

export default class ClusterMarker extends Component {
  constructor(props) {
    super(props)

    this.onPress = this.onPress.bind(this)
  }

  onPress() {
    this.props.onPress(this.props)
  }

  render() {
    if (this.props.properties.item)
      return this.props.renderMarker(this.props.properties.item)

    const pointCount = this.props.properties.point_count // eslint-disable-line camelcase
    const latitude = this.props.geometry.coordinates[1],
          longitude = this.props.geometry.coordinates[0]

    let textForCluster = '1'

    const width = Math.floor(30 * (1 + pointCount / 10)),
          height = Math.floor(30 * (1 + pointCount / 10)),
          fontSize = 12 * (1 + pointCount / 20),
          borderRadius = Math.floor(width / 2)

    if (pointCount >= 2 && pointCount <= 10) {
      textForCluster = pointCount.toString()
    } if (pointCount >10 && pointCount <= 25) {
      textForCluster = '10+'
    } if (pointCount > 25 && pointCount <= 50) {
      textForCluster = '25+'
    } if (pointCount > 50 && pointCount <= 100) {
      textForCluster = '50+'
    } if (pointCount > 100) {
      textForCluster = '100+'
    }

    const { containerStyle, textStyle } = this.props

    return (
      <Marker coordinate={{ latitude, longitude }} onPress={this.onPress}>
        <View style={[styles.container, containerStyle, { width, height, borderRadius }]}>
          <Text style={[styles.counterText, textStyle, { fontSize }]}>{textForCluster}</Text>
        </View>
      </Marker>
    )
  }
}

ClusterMarker.defaultProps = {
  textStyle: {},
  containerStyle: {}
}

ClusterMarker.propTypes = {
  onPress: PropTypes.func.isRequired,
  geometry: PropTypes.object.isRequired,
  textStyle: PropTypes.object.isRequired,
  properties: PropTypes.object.isRequired,
  renderMarker: PropTypes.func.isRequired,
  containerStyle: PropTypes.object.isRequired,
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.brandFirst,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.brandFirst,
  }
})
