# React Native Super Cluster
This module wraps [AirBnB's react-native-maps](https://github.com/airbnb/react-native-maps) and uses [MapBox's SuperCluster](https://github.com/mapbox/supercluster) as clustering engine.

## Example

[See the showcase application](https://github.com/novalabio/react-native-maps-super-cluster-example).

<center>
<img src="https://github.com/novalabio/react-native-maps-super-cluster-example/blob/master/assets/demo.gif?raw=true" width="240">
</center>

## Rationale
This module wants to provide a stable and performing solution for maps clustering in React Native. In particular, our efforts are focused on integrating SuperCluster methods into React's state/lifecycle events, ensuring stability, compatibility and great performance.

## Install
`npm i --save react-native-maps-super-cluster`

## Usage

**NOTES:**

* the prop `key` of the markers rendered through `renderMarker` should not be left up to React. Instead, we strongly suggest to use an `id` in order the have unique keys while still taking advantage of React's recycling
* `ClusteredMapView` supports usual React children. Those children **won't be affected by clustering**, i.e. the behavior for those children is exactly the same as wrapping them around an [AirBnB's react-native-maps](https://github.com/airbnb/react-native-maps) instance
* Use `onMarkerPress` event on MapView instead of using `onPress` directly on Markers whenever possibile, in particular if you have a lot of pins and clusters. Within `onMarkerPress` you have access to the marker identifier through the `event.nativeEvent` attribute, hence you should be able to do everything you would do within an `onPress` function of a Marker

```JSX
import React, { Component } from 'react'
import { Marker, Callout } from 'react-native-maps'
import ClusteredMapView from 'react-native-maps-super-cluster'

const INIT_REGION = {
  latitude: 41.8962667,
  longitude: 11.3340056,
  latitudeDelta: 12,
  longitudeDelta: 12
}

export default class MyClusteredMapView extends Component {
  
  ...

  renderCluster = (cluster, onPress) => {
    const pointCount = cluster.pointCount,
          coordinate = cluster.coordinate,
          clusterId = cluster.clusterId

    // use pointCount to calculate cluster size scaling
    // and apply it to "style" prop below

    // eventually get clustered points by using
    // underlying SuperCluster instance
    // Methods ref: https://github.com/mapbox/supercluster
    const clusteringEngine = this.map.getClusteringEngine(),
          clusteredPoints = clusteringEngine.getLeaves(clusterId, 100)

    return (
      <Marker coordinate={coordinate} onPress={onPress}>
        <View style={styles.myClusterStyle}>
          <Text style={styles.myClusterTextStyle}>
            {pointCount}
          </Text>
        </View>
        {
          /*
            Eventually use <Callout /> to
            show clustered point thumbs, i.e.:
            <Callout>
              <ScrollView>
                {
                  clusteredPoints.map(p => (
                    <Image source={p.image}>
                  ))
                }
              </ScrollView>
            </Callout>

            IMPORTANT: be aware that Marker's onPress event isn't really consistent when using Callout.
           */
        }
      </Marker>
    )
  }

  renderMarker = (data) => <Marker key={data.id || Math.random()} coordinate={data.location} />

  ...

  render() {
    return (
      <ClusteredMapView
        style={{flex: 1}}
        data={this.state.data}
        initialRegion={INIT_REGION}
        ref={(r) => { this.map = r }}
        renderMarker={this.renderMarker}
        renderCluster={this.renderCluster} />
    )
  }
}
```

## Props

**Name** | **Type** | **Required** | **Default** | **Note**
---------|----------|--------------|-------------|---------
radius | Number | false | window width * 4,5% | [SuperCluster radius](https://github.com/mapbox/supercluster#options).
extent | Number | false | 512 | [SuperCluster extent](https://github.com/mapbox/supercluster#options).
minZoom | Number | false | 1 | [SuperCluster minZoom](https://github.com/mapbox/supercluster#options).
maxZoom | Number | false | 16 | [SuperCluster maxZoom](https://github.com/mapbox/supercluster#options).
width | Number | false | window width | map's width.
height | Number | false | window height | map's height.
data | Array <Object> | true | undefined | Objects must have an attribute `location` representing a `GeoPoint`, i.e. `{ latitude: x, longitude: y }`.
onExplode | Function | false | undefined | TODO
onImplode | Function | false | undefined | TODO
onClusterPress(clusterId, ?children) | Function | false |  | Add (or completey override) behaviours to the clusterPress handler. `children` is passed when default behavior is preserved (see `preserveClusterPressBehavior` prop).
preserveClusterPressBehavior | Bool | false | true | Whether `onClusterPress` prop should completely override module's behavior rather than integrate it.
clusterPressMaxChildren | Function | false | 100 | Max number of cluster leaves returned as second parameter of `onClusterPress`.
edgePadding | Object | false | { top: 10, left: 10, bottom: 10, right: 10 } | Edge padding for [react-native-maps's](https://github.com/react-community/react-native-maps/blob/master/docs/mapview.md#methods) `fitToCoordinates` method, called in `onClusterPress` for fitting to pressed cluster children.
renderMarker | Function | false | undefined | Must return a react-native-maps' Marker component.
animateClusters | Bool | false | true | Animate imploding/exploding of clusters' markers and clusters size change. **Works only on iOS**.
layoutAnimationConf | LayoutAnimationConfig | false | `LayoutAnimation.Presets.spring` | Custom Layout animation configuration object for clusters animation during implode / explode **Works only on iOS**.
clusteringEnabled | Bool | false | true | Dynamically set whether to pass through clustering functions or immediately render markers as a normal mapview.
accessor | String\|Func | true | "location" | Accessor for item coordinate values. Could be a **string** (field name of an item object with latitude and longitude values) or a **function** (that describes how to access to coordinate data).

## Methods
**Name** | **Params** | **Description** | **Note**
---------|------------|-----------------|---------
getMapRef | none | Getter for underlying react-native-maps instance | [Official Doc](https://github.com/react-community/react-native-maps#component-api)
getClusteringEngine | none | Getter for underlying SuperCluster instance | [Official Doc](https://github.com/mapbox/supercluster)

## Production usage
If you are using this module in a production application, please submit a PR or contact us to add it here.
* [Varee on Google Play](https://play.google.com/store/apps/details?id=com.vareemobile)
* [Varee on App Store](https://itunes.apple.com/us/app/varee/id1330151010?mt=8)
* [Our Voice USA on Google Play](https://play.google.com/store/apps/details?id=org.ourvoiceinitiative.ourvoice)
* [Our Voice USA on App Store](https://itunes.apple.com/us/app/our-voice-usa/id1275301651?ls=1&mt=8)
* [Metropolíque on Google Play](https://play.google.com/store/apps/details?id=com.metropolique.app)
* [Metropolíque on App Store](https://itunes.apple.com/us/app/metropolique/id1314473652?ls=1&mt=8)
* [Outside - Post and do tasks! on Google Play](https://play.google.com/store/apps/details?id=com.outsideapp)
* [Outside - Post and do tasks! on App Store](https://itunes.apple.com/us/app/outside-post-and-do-tasks/id1444603208?ls=1&mt=8)
* [Luceverde - ACI Infomobilità on Google Play](https://play.google.com/store/apps/details?id=it.aci.luceverde.client.mobileapp)
* [Luceverde - ACI Infomobilità on App Store](https://itunes.apple.com/it/app/luceverde/id1357722780?l=en&mt=8)
* [Own The Spot on Google Play](https://play.google.com/store/apps/details?id=com.ownthespot)
* [Own The Spot on App Store](https://itunes.apple.com/us/app/own-the-spot/id1403095767)

## TODO

#### features
* improve `scaleUpRatio` math for fontSize
* trigger events on cluster implode/explode

# Support
As an open source project, we provide free support over Github. However, our daily job may increase response time to days or even weeks. If you need dedicated support, feel free to [contact us](mailto:info@novalab.io) for a quote.

# Contributors

* [Leonardo Lusoli](https://github.com/leolusoli)
* [Alberto Dallaporta](https://github.com/39otrebla)

# License
See [our License](https://github.com/novalabio/react-native-maps-super-cluster/blob/master/LICENSE) for more information.
