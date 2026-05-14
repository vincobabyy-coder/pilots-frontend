import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRoute } from '@/hooks/useRoute';
import { RouteStop } from '@/types/delivery';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

interface StopWithDistance extends RouteStop {
  distanceToHere?: number;
  durationMinutes?: number;
}

export default function RouteScreen() {
  const { currentRoute, nextStops, loading, refreshRoute } = useRoute();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshRoute();
    } finally {
      setRefreshing(false);
    }
  }, [refreshRoute]);

  const handleNavigateToStop = useCallback((stop: StopWithDistance) => {
    const url = `https://maps.google.com/?q=${stop.lat},${stop.lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  }, []);

  const handleStartNavigation = useCallback(() => {
    if (nextStops.length === 0) return;
    const firstStop = nextStops[0];
    const url = `https://maps.google.com/?q=${firstStop.lat},${firstStop.lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  }, [nextStops]);

  const stopsWithMetrics: StopWithDistance[] = (nextStops || []).map((stop, idx) => ({
    ...stop,
    distanceToHere: Math.random() * 30 + 5 * (idx + 1), // Placeholder distances
    durationMinutes: Math.random() * 60 + 15 * (idx + 1), // Placeholder durations
  }));

  if (!currentRoute) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.emptyContainer}>
          {loading ? (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your route...</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTitle}>No Active Route</Text>
              <Text style={styles.emptySubtitle}>
                Accept a job from the Home tab to start your route
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Route header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.routeLabel}>Route ID</Text>
          <Text style={styles.routeId} numberOfLines={1}>
            {currentRoute.id.substring(0, 8)}...
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{currentRoute.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Route summary cards */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Stops</Text>
          <Text style={styles.summaryValue}>{currentRoute.stops?.length ?? 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Distance</Text>
          <Text style={styles.summaryValue}>
            {(currentRoute.totalDistance ?? 0).toFixed(1)} km
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>
            {Math.floor((currentRoute.totalDuration ?? 0) / 60)}h{' '}
            {Math.round((currentRoute.totalDuration ?? 0) % 60)}m
          </Text>
        </View>
      </View>

      {/* Start navigation button */}
      {nextStops.length > 0 && (
        <TouchableOpacity style={styles.startNavBtn} onPress={handleStartNavigation}>
          <Text style={styles.startNavBtnText}>🧭 Start Navigation to Next Stop</Text>
        </TouchableOpacity>
      )}

      {/* Next 3 stops */}
      <View style={styles.stopsSection}>
        <Text style={styles.stopsTitle}>Next 3 Stops</Text>

        {nextStops.length === 0 ? (
          <View style={styles.emptyStops}>
            <Text style={styles.emptyStopsText}>No upcoming stops</Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={stopsWithMetrics}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.stopCard}>
                {/* Stop number and marker */}
                <View style={styles.stopNumberContainer}>
                  <View style={styles.stopNumberCircle}>
                    <Text style={styles.stopNumber}>{index + 1}</Text>
                  </View>
                  {index < stopsWithMetrics.length - 1 && <View style={styles.stopConnector} />}
                </View>

                {/* Stop details */}
                <View style={styles.stopContent}>
                  <View style={styles.stopHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopCustomer} numberOfLines={1}>
                        {item.customer}
                      </Text>
                      <Text style={styles.stopAddress} numberOfLines={2}>
                        {item.address}
                      </Text>
                    </View>
                    <View style={styles.etaBadge}>
                      <Text style={styles.etaText}>
                        {item.eta
                          ? new Date(item.eta).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Distance and duration */}
                  <View style={styles.stopMeta}>
                    <Text style={styles.metaItem}>
                      📍 {item.distanceToHere?.toFixed(1) ?? '—'} km away
                    </Text>
                    <Text style={styles.metaItem}>
                      🕐 {item.durationMinutes ? Math.round(item.durationMinutes) : '—'} min
                    </Text>
                  </View>

                  {/* Status and action */}
                  <View style={styles.stopFooter}>
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor:
                            item.status === 'delivered'
                              ? Colors.success
                              : item.status === 'arrived'
                                ? Colors.warning
                                : Colors.textMuted,
                        },
                      ]}
                    >
                      <Text style={styles.statusIndicatorText}>{item.status}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.navigateBtn}
                      onPress={() => handleNavigateToStop(item)}
                    >
                      <Text style={styles.navigateBtnText}>Navigate →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  routeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  routeId: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  summarySection: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  startNavBtn: {
    marginHorizontal: 20,
    marginBottom: 16,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.card,
  },
  startNavBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  stopsSection: {
    paddingHorizontal: 20,
  },
  stopsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  emptyStops: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  emptyStopsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stopCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...Theme.shadow.card,
  },
  stopNumberContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary + '10',
  },
  stopNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumber: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  stopConnector: {
    width: 2,
    height: 32,
    backgroundColor: Colors.secondary,
    marginTop: 4,
  },
  stopContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  stopCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stopAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  etaBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minHeight: 28,
    justifyContent: 'center',
  },
  etaText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  stopMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  stopFooter: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusIndicatorText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  navigateBtn: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.primary + '20',
    borderRadius: 6,
    alignItems: 'center',
  },
  navigateBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
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
});
