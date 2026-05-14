import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useGeolocation } from '@/hooks/useGeolocation';
import { mobileApi } from '@/services/api';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';
import { Delivery } from '@/types/delivery';

const { height } = Dimensions.get('window');

export default function MyRouteMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { location } = useGeolocation({ interval: 10000 });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selected, setSelected] = useState<Delivery | null>(null);

  useEffect(() => {
    mobileApi
      .get<Delivery[]>('/drivers/me/deliveries')
      .then(setDeliveries)
      .catch(() => null);
  }, []);

  // Pan map to current location
  useEffect(() => {
    if (location) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        800
      );
    }
  }, [location]);

  const routeCoords = deliveries.map((d) => ({ latitude: d.lat, longitude: d.lng }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        followsUserLocation={!selected}
        initialRegion={{
          latitude: location?.lat ?? 6.5244,
          longitude: location?.lng ?? 3.3792,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.secondary}
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}

        {/* Delivery markers */}
        {deliveries.map((d, i) => (
          <Marker
            key={d.id}
            coordinate={{ latitude: d.lat, longitude: d.lng }}
            onPress={() => setSelected(d)}
          >
            <View
              style={[
                styles.markerBubble,
                {
                  backgroundColor:
                    d.status === 'delivered'
                      ? Colors.success
                      : d.status === 'en_route'
                      ? Colors.primary
                      : Colors.secondary,
                  width: d.status === 'en_route' ? 36 : 28,
                  height: d.status === 'en_route' ? 36 : 28,
                  borderRadius: d.status === 'en_route' ? 18 : 14,
                },
              ]}
            >
              <Text style={styles.markerText}>{i + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Recenter button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={() => {
          setSelected(null);
          if (location) {
            mapRef.current?.animateToRegion({
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }, 600);
          }
        }}
      >
        <Text style={{ fontSize: 20 }}>📍</Text>
      </TouchableOpacity>

      {/* Bottom sheet for selected marker */}
      {selected && (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetAddress}>{selected.address}</Text>
          <Text style={styles.sheetCustomer}>{selected.customer}</Text>
          <View style={styles.sheetMeta}>
            <Text style={styles.sheetMetaItem}>
              🕐 {new Date(selected.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.sheetMetaItem}>📍 {selected.distance.toFixed(1)} km</Text>
          </View>
          <TouchableOpacity style={styles.sheetClose} onPress={() => setSelected(null)}>
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Theme.shadow.card,
  },
  markerText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
  recenterBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.card,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    ...Theme.shadow.modal,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetAddress: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  sheetCustomer: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },
  sheetMeta: { flexDirection: 'row', gap: 16 },
  sheetMetaItem: { fontSize: 13, color: Colors.textSecondary },
  sheetClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { fontSize: 14, color: Colors.textSecondary },
});
