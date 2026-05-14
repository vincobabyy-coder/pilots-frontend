import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { mobileWs } from '@/services/websocket';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

interface Alert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

const severityConfig = {
  info:     { bg: Colors.secondary + '15', border: Colors.secondary, icon: 'ℹ️' },
  warning:  { bg: Colors.warning + '15',   border: Colors.warning,   icon: '⚠️' },
  critical: { bg: Colors.danger + '15',    border: Colors.danger,    icon: '🚨' },
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = mobileWs.subscribe('alert_new', (data) => {
      const alert = data as Alert;
      setAlerts((prev) => [{ ...alert, acknowledged: false }, ...prev]);
    });
    return unsub;
  }, []);

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const dismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {alerts.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{alerts.filter((a) => !a.acknowledged).length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={styles.emptyText}>No alerts right now</Text>
            <Text style={styles.emptySubtext}>You're all clear!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = severityConfig[item.severity];
          return (
            <View
              style={[
                styles.alertCard,
                { backgroundColor: cfg.bg, borderLeftColor: cfg.border },
                item.acknowledged && styles.alertAcknowledged,
              ]}
            >
              <View style={styles.alertTop}>
                <Text style={styles.alertIcon}>{cfg.icon}</Text>
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertMessage}>{item.message}</Text>
                  <Text style={styles.alertTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              {!item.acknowledged && (
                <View style={styles.alertActions}>
                  <TouchableOpacity
                    style={styles.ackBtn}
                    onPress={() => acknowledge(item.id)}
                  >
                    <Text style={styles.ackBtnText}>Acknowledge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => dismiss(item.id)}
                  >
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emptySubtext: { fontSize: 14, color: Colors.textMuted },
  alertCard: {
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 16,
    ...Theme.shadow.card,
  },
  alertAcknowledged: { opacity: 0.6 },
  alertTop: { flexDirection: 'row', gap: 12 },
  alertIcon: { fontSize: 22, marginTop: 2 },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  alertMessage: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  alertTime: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  alertActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  ackBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ackBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  dismissBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dismissBtnText: { color: Colors.textSecondary, fontWeight: '500', fontSize: 13 },
});
