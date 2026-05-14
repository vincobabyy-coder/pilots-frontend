import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mobileApi } from '@/services/api';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';
import { Delivery } from '@/types/delivery';
import DeliveryConfirmScreen from './DeliveryConfirmScreen';

export default function DeliveryDetailScreen() {
  const navigation = useNavigation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    mobileApi
      .get<Delivery[]>('/drivers/me/deliveries')
      .then((d) => {
        setDeliveries(d.filter((x) => x.status !== 'delivered'));
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const current = deliveries[currentIndex];

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading deliveries…</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
        <Text style={styles.doneText}>All deliveries complete!</Text>
        <Text style={styles.doneSubtext}>Great work today.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery {currentIndex + 1} of {deliveries.length}</Text>
          <View style={[styles.statusBadge, { backgroundColor: current.isOnTime ? Colors.success + '20' : Colors.warning + '20' }]}>
            <Text style={[styles.statusText, { color: current.isOnTime ? Colors.success : Colors.warning }]}>
              {current.isOnTime ? 'On-time ✓' : 'At-risk ⚠'}
            </Text>
          </View>
        </View>

        {/* Main card */}
        <View style={styles.card}>
          <Text style={styles.address}>{current.address}</Text>
          <Text style={styles.customer}>{current.customer}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={styles.metaLabel}>ETA</Text>
              <Text style={styles.metaValue}>
                {new Date(current.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaLabel}>Distance</Text>
              <Text style={styles.metaValue}>{current.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🏷️</Text>
              <Text style={styles.metaLabel}>Stop</Text>
              <Text style={styles.metaValue}>#{current.sequence}</Text>
            </View>
          </View>

          {current.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{current.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              Linking.openURL(`https://maps.google.com/?q=${current.lat},${current.lng}`);
            }}
          >
            <Text style={styles.primaryBtnText}>🧭 Navigate</Text>
          </TouchableOpacity>

          {current.customerPhone ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => Linking.openURL(`tel:${current.customerPhone}`)}
            >
              <Text style={styles.secondaryBtnText}>📞 Call Customer</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.success }]}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={styles.primaryBtnText}>✅ Confirm Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* Prev / Next */}
        {deliveries.length > 1 && (
          <View style={styles.nav}>
            <TouchableOpacity
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <Text style={styles.navBtnText}>← Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, currentIndex === deliveries.length - 1 && styles.navBtnDisabled]}
              onPress={() => setCurrentIndex((i) => Math.min(deliveries.length - 1, i + 1))}
              disabled={currentIndex === deliveries.length - 1}
            >
              <Text style={styles.navBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Confirmation modal */}
      {confirmVisible && (
        <DeliveryConfirmScreen
          delivery={current}
          onClose={() => setConfirmVisible(false)}
          onConfirmed={() => {
            setConfirmVisible(false);
            setDeliveries((prev) => prev.filter((d) => d.id !== current.id));
            setCurrentIndex((i) => Math.min(i, deliveries.length - 2));
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: Colors.textSecondary, fontSize: 15 },
  doneText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  doneSubtext: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  card: {
    margin: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    ...Theme.shadow.card,
  },
  address: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, lineHeight: 24 },
  customer: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  metaGrid: { flexDirection: 'row', gap: 12 },
  metaItem: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, padding: 12, alignItems: 'center' },
  metaIcon: { fontSize: 20, marginBottom: 4 },
  metaLabel: { fontSize: 10, color: Colors.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  notesBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.surface2,
    borderRadius: 10,
  },
  notesLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  notesText: { fontSize: 13, color: Colors.textSecondary },
  actions: { paddingHorizontal: 16, gap: 10 },
  primaryBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  secondaryBtn: {
    height: 52,
    backgroundColor: Colors.surface2,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: Colors.textPrimary, fontWeight: '500', fontSize: 15 },
  nav: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  navBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: Colors.textPrimary, fontWeight: '500', fontSize: 14 },
});
