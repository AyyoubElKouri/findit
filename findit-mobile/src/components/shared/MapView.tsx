import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ImageSourcePropType, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { colors } from '../../constants/theme';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  onPress?: () => void;
  color?: string;
  imageUri?: string | null;
  imageSource?: ImageSourcePropType;
  fallbackIcon?: string;
}

export interface ReusableMapViewProps {
  initialRegion?: Region;
  markers?: MapMarker[];
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: any) => void;
  showUserLocation?: boolean;
  style?: ViewStyle;
}

export interface ReusableMapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
}

function CustomMapMarker({ marker }: { marker: MapMarker }) {
  const hasCustomImage = Boolean(marker.imageUri || marker.imageSource);
  const [tracksViewChanges, setTracksViewChanges] = useState(hasCustomImage);

  const stopTracking = () => setTracksViewChanges(false);

  if (!hasCustomImage && !marker.fallbackIcon) {
    return (
      <Marker
        key={marker.id}
        coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
        title={marker.title}
        description={marker.description}
        onPress={marker.onPress}
        pinColor={marker.color ?? colors.primary}
        tracksViewChanges={false}
      />
    );
  }

  return (
    <Marker
      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
      title={marker.title}
      description={marker.description}
      onPress={marker.onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.markerWrap} collapsable={false}>
        <View
          style={[
            styles.markerCircle,
            { borderColor: marker.color ?? colors.primary },
          ]}
        >
          {marker.imageUri ? (
            <Image
              source={{ uri: marker.imageUri }}
              style={styles.markerImage}
              contentFit="cover"
              onLoad={stopTracking}
              onError={stopTracking}
            />
          ) : marker.imageSource ? (
            <Image
              source={marker.imageSource}
              style={styles.markerImage}
              contentFit="cover"
              onLoad={stopTracking}
              onError={stopTracking}
            />
          ) : (
            <View style={styles.markerFallback}>
              <Text style={styles.markerFallbackIcon}>{marker.fallbackIcon ?? '📦'}</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.markerPointer,
            { backgroundColor: marker.color ?? colors.primary },
          ]}
        />
      </View>
    </Marker>
  );
}

export const ReusableMapView = forwardRef<ReusableMapViewRef, ReusableMapViewProps>(
  ({ initialRegion, markers = [], onRegionChangeComplete, onPress, showUserLocation = true, style }, ref) => {
    const mapRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration = 1000) => {
        mapRef.current?.animateToRegion(region, duration);
      },
      fitToCoordinates: (coordinates, options = { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }) => {
        mapRef.current?.fitToCoordinates(coordinates, options);
      },
    }));

    return (
      <View style={[styles.container, style]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={false}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={onPress}
        >
          {markers.map((marker) => (
            <CustomMapMarker key={marker.id} marker={marker} />
          ))}
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerWrap: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    backgroundColor: colors.background.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  markerFallbackIcon: {
    fontSize: 22,
  },
  markerPointer: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: -3,
  },
});
