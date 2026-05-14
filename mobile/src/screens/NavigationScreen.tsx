import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoute } from '@/hooks/useRoute';
import { useGeolocation } from '@/hooks/useGeolocation';
import { RouteStop } from '@/types/delivery';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

export default function NavigationScreen() {
  const { currentRoute, nextStops } = useRoute();
  const { location } = useGeolocation({ interval: 5000 });
  const mapRef = useRef<MapView>(null);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  // Current location coordinates
  const currentLat = location?.coords.latitude ?? 6.5244;
  const currentLng = location?.coords.longitude ?? 3.3792;

  // Calculate map region to fit all stops
  const calculateRegion = () => {
    if (!nextStops || nextStops.length === 0) {
      return {
        latitude: currentLat,
        longitude: currentLng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const lats = [currentLat, ...nextStops.map((s) => s.lat)];
    const lngs = [currentLng, ...nextStops.map((s) => s.lng)];

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = Math.max(maxLat - minLat, 0.01) * 1.2;
    const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.2;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  };

  // Center map on current location
  const handleCenterMap = () => {
    mapRef.current?.animateToRegion({
      latitude: currentLat,
      longitude: currentLng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  // Handle stop marker press
  const handleStopPress = (stop: RouteStop) => {
    setSelectedStop(stop);
    mapRef.current?.animateToRegion({
      latitude: stop.lat,
      longitude: stop.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  useEffect(() => {
    // Auto-fit map to route on load
    if (nextStops.length > 0) {
      setTimeout(() => {
        mapRef.current?.fitToSuppliedMarkers(
          ['current', ...nextStops.map((_, i) => `stop-${i}`)],
          {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true,
          }
        );
      }, 500);
    }
  }, [nextStops]);

  if (!currentRoute || !nextStops || nextStops.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Route to Navigate</Text>
          <Text style={styles.emptySubtitle}>Accept a job from Home to see navigation</Text>
        </View>
      </View>
    );
  }

  // Build polyline coordinates (current location + all stops)
  const polylineCoords = [
    { latitude: currentLat, longitude: currentLng },
    ...nextStops.map((s) => ({ latitude: s.lat, longitude: s.lng })),
  ];

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={calculateRegion()}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Current location marker */}
        <Marker
          identifier="current"
          coordinate={{ latitude: currentLat, longitude: currentLng }}
          title="Your Location"
          pinColor={Colors.primary}
        />

        {/* Stop markers */}
        {nextStops.map((stop, idx) => (
          <Marker
            key={`stop-${idx}`}
            identifier={`stop-${idx}`}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`Stop ${idx + 1}`}
            description={stop.customer}
            pinColor={idx === 0 ? Colors.success : Colors.warning}
            onPress={() => handleStopPress(stop)}
          />
        ))}

        {/* Route polyline */}
        <Polyline
          coordinates={polylineCoords}
          strokeColor={Colors.primary}
          strokeWidth={3}
          geodesic={true}
        />
      </MapView>

      {/* Floating controls */}
      <TouchableOpacity style={styles.centerBtn} onPress={handleCenterMap}>
        <Text style={styles.centerBtnText}>📍</Text>
      </TouchableOpacity>

      {/* Bottom sheet with next stop info */}
      {selectedStop ? (
        <View style={styles.stopInfo}>
          <View style={styles.stopInfoContent}>
            <Text style={styles.stopCustomer} numberOfLines={1}>
              {selectedStop.customer}
            </Text>
            <Text style={styles.stopAddress} numberOfLines={2}>
              {selectedStop.address}
            </Text>
            <View style={styles.stopInfoMeta}>
              <Text style={styles.metaItem}>
                Status: <Text style={styles.metaValue}>{selectedStop.status}</Text>
              </Text>
              <Text style={styles.metaItem}>
                ETA:{' '}
                <Text style={styles.metaValue}>
                  {selectedStop.eta
                    ? new Date(selectedStop.eta).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </Text>
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedStop(null)}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : nextStops.length > 0 ? (
        <View style={styles.nextStopPreview}>
          <View>
            <Text style={styles.nextStopLabel}>Next Stop</Text>
            <Text style={styles.nextStopCustomer} numberOfLines={1}>
              {nextStops[0].customer}
            </Text>
            <Text style={styles.nextStopAddress} numberOfLines={1}>
              {nextStops[0].address}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => handleStopPress(nextStops[0])}
          >
            <Text style={styles.detailsBtnText}>Details →</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
  },
  centerBtn: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.card,
  },
  centerBtnText: {
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  stopInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...Theme.shadow.card,
  },
  stopInfoContent: {
    flex: 1,
  },
  stopCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stopAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  stopInfoMeta: {
    gap: 6,
  },
  metaItem: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  nextStopPreview: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  nextStopLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  nextStopCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  nextStopAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  detailsBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
