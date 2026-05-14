import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
  Linking,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { mobileApi } from '@/services/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';
import { Delivery, DriverSummary } from '@/types/delivery';

export default function DashboardScreen() {
  const { state } = useAuth();
  const [summary, setSummary] = useState<DriverSummary | null>(null);
  const [current, setCurrent] = useState<Delivery | null>(null);
  const [upcoming, setUpcoming] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { location } = useGeolocation({ interval: 10000 });

  const loadData = useCallback(async () => {
    try {
      const deliveries = await mobileApi.get<Delivery[]>('/drivers/me/deliveries');
      const active = deliveries.find((d) => d.status === 'en_route' || d.status === 'pending');
      setCurrent(active ?? null);
      setUpcoming(deliveries.filter((d) => d.id !== active?.id && d.status === 'pending').slice(0, 3));

      const perf = await mobileApi.get<DriverSummary>('/drivers/me/performance');
      setSummary(perf);
    } catch {
      // fail silently — offline scenario
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = state.user?.name.split(' ')[0] ?? 'Driver';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Hero header */}
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
        <Text style={styles.date}>{now.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

        {/* KPI row */}
        <View style={styles.kpiRow}>
          {[
            { label: 'Remaining', value: summary?.remainingDeliveries ?? '—', unit: 'stops' },
            { label: 'Distance', value: summary ? `${summary.totalDistance.toFixed(0)}` : '—', unit: 'km' },
            { label: 'ETA', value: summary ? `${Math.floor((summary.etaMinutes ?? 0) / 60)}h ${(summary.etaMinutes ?? 0) % 60}m` : '—', unit: '' },
          ].map(({ label, value, unit }) => (
            <View key={label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{value}</Text>
              {unit ? <Text style={styles.kpiUnit}>{unit}</Text> : null}
              <Text style={styles.kpiLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Current delivery card */}
      {current ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Delivery</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.deliveryHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deliveryAddress}>{current.address}</Text>
                <Text style={styles.deliveryCustomer}>{current.customer}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: current.isOnTime ? Colors.success + '20' : Colors.warning + '20' }]}>
                <Text style={[styles.statusText, { color: current.isOnTime ? Colors.success : Colors.warning }]}>
                  {current.isOnTime ? 'On-time' : 'At-risk'}
                </Text>
              </View>
            </View>

            <View style={styles.deliveryMeta}>
              <Text style={styles.metaItem}>🕐 ETA: {new Date(current.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <Text style={styles.metaItem}>📍 {current.distance.toFixed(1)} km away</Text>
            </View>

            <View style={styles.deliveryActions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  const url = `https://maps.google.com/?q=${current.lat},${current.lng}`;
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.primaryBtnText}>🧭 Navigate</Text>
              </TouchableOpacity>
              {current.customerPhone && (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => Linking.openURL(`tel:${current.customerPhone}`)}
                >
                  <Text style={styles.secondaryBtnText}>📞 Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>✅</Text>
          <Text style={styles.emptyText}>All deliveries complete!</Text>
        </View>
      )}

      {/* Upcoming stops */}
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Up Next</Text>
          <FlatList
            horizontal
            data={upcoming}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item, index }) => (
              <View style={styles.upcomingCard}>
                <View style={styles.upcomingNum}>
                  <Text style={styles.upcomingNumText}>{index + 2}</Text>
                </View>
                <Text style={styles.upcomingAddress} numberOfLines={2}>{item.address}</Text>
                <Text style={styles.upcomingMeta}>{item.distance.toFixed(1)} km</Text>
              </View>
            )}
          />
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.secondary,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.white },
  date: { fontSize: 13, color: Colors.white + 'CC', marginTop: 2, marginBottom: 20 },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white + '20',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  kpiValue: { fontSize: 20, fontWeight: '700', color: Colors.white },
  kpiUnit: { fontSize: 11, color: Colors.white + 'BB', marginTop: -2 },
  kpiLabel: { fontSize: 10, color: Colors.white + '99', marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  deliveryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...Theme.shadow.card,
  },
  deliveryHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  deliveryAddress: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  deliveryCustomer: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  deliveryMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { fontSize: 13, color: Colors.textSecondary },
  deliveryActions: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  secondaryBtn: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: Colors.textPrimary, fontWeight: '500', fontSize: 15 },
  emptyCard: {
    margin: 20,
    padding: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  emptyText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  upcomingCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    ...Theme.shadow.card,
  },
  upcomingNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  upcomingNumText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  upcomingAddress: { fontSize: 12, color: Colors.textPrimary, lineHeight: 16, marginBottom: 6 },
  upcomingMeta: { fontSize: 11, color: Colors.textMuted },
});
