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

```JSX
import React, { Component } from 'react'
import { Marker } from 'react-native-maps'
import ClusteredMapView from 'react-native-maps-super-cluster'

const INIT_REGION = {
  latitude: 41.8962667,
  longitude: 11.3340056,
  latitudeDelta: 12,
  longitudeDelta: 12
}

export default class MyClusteredMapView extends Component {
  
  ...

  renderMarker = (data) => <Marker key={data.id || Math.random()} coordinate={data.location} />

  ...

  render() {
    return (
      <ClusteredMapView
        style={{flex: 1}}
        data={this.state.data}
        initialRegion={INIT_REGION}
        renderMarker={this.renderMarker}
        {/* cluster text */}
        textStyle={{ color: '#65bc46' }}
        {/* cluster container */}
        containerStyle={{backgroundColor: 'white', borderColor: '#65bc46'}} />
    )
  }
}
```

## Props

**Name** | **Type** | **Required** | **Default** | **Note**
---------|----------|--------------|-------------|---------
radius | Number | false | window width * 4,5% | SuperCluster radius
extent | Number | false | 512 | SuperCluster extent
minZoom | Number | false | 1 | SuperCluster minZoom
maxZoom | Number | false | 20 | SuperCluster maxZoom
width | Number | false | window width | map's width
height | Number | false | window height | map's height
scaleUpRatio(markersCount: Number); | Function | false | undefined | Must return a number, used to multiply clusters and font sizes based on `markersCount`
clusterInitialFontSize | Number | false | 12 | font base size for cluster counter. Scales up proportionally to clustered markers
clusterInitialDimension | Number | false | 30 | cluster view base dimension in dpi/ppi. Scales up proportionally to clustered markers
data | Array <Object> | true | undefined | Objects must have an attribute `location` representing a `GeoPoint`, i.e. `{ latitude: x, longitude: y }`
onExplode | Function | false | undefined | TODO
onImplode | Function | false | undefined | TODO
onClusterPress | Function | false |  | Add additional behaviours to the clusterPress handler. (onClusterPress automatically moves the map to the cluster region and zoomes on the cluster explode zoom level)
renderMarker | Function | false | undefined | Must return a react-native-maps' Marker component
animateClusters | Bool | false | true | Animate imploding/exploding of clusters' markers and clusters size change. **Works only on iOS**.
clusteringEnabled | Bool | true | Dynamically set whether to pass through clustering functions or immediately render markers as a normal mapview
textStyle | Object | false | NovaLab Brand colors | Style of the `Text` component used for clusters counters
containerStyle | Object | false | NovaLab Brand colors | Style of the clusters `View`

## Methods
**Name** | **Params** | **Description** | **Note**
---------|------------|-----------------|---------
getMapRef | none | Getter for underlying react-native-maps instance


## Production usage
If you are using this module in a production application, please submit a PR or contact us to add it here.

## TODO

#### features
* improve `scaleUpRatio` math for fontSize
* trigger events on cluster implode/explode

# Contributors

* [Leonardo Lusoli](https://github.com/leolusoli)
* [Alberto Dallaporta](https://github.com/39otrebla)

# License
See [our License](https://github.com/novalabio/react-native-maps-super-cluster/blob/master/LICENSE) for more information.
