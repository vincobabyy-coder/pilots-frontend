import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

const GPS_INTERVALS = [
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '15 seconds', value: 15000 },
  { label: '30 seconds', value: 30000 },
];

export default function ProfileScreen() {
  const { state, logout } = useAuth();
  const user = state.user;

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [gpsInterval, setGpsInterval] = useState(10000);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Avatar + info */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.charAt(0) ?? 'D'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Driver'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.vehicle}>{user?.vehicleType} · {user?.vehiclePlate}</Text>

        {/* Star rating */}
        <View style={styles.rating}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 18, color: i < Math.round(user?.rating ?? 0) ? Colors.warning : Colors.border }}>
              ★
            </Text>
          ))}
          <Text style={styles.ratingText}>{user?.rating?.toFixed(1) ?? '—'}</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingDesc}>Delivery and route alerts</Text>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={setNotificationsOn}
            trackColor={{ true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Data Saver Mode</Text>
            <Text style={styles.settingDesc}>Reduce data usage</Text>
          </View>
          <Switch
            value={dataSaver}
            onValueChange={setDataSaver}
            trackColor={{ true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>GPS Update Interval</Text>
          <View style={styles.intervalRow}>
            {GPS_INTERVALS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.intervalBtn,
                  gpsInterval === opt.value && styles.intervalBtnActive,
                ]}
                onPress={() => setGpsInterval(opt.value)}
              >
                <Text
                  style={[
                    styles.intervalBtnText,
                    gpsInterval === opt.value && styles.intervalBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionLabel}>View Delivery History</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🎧</Text>
          <Text style={styles.actionLabel}>Contact Dispatcher</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  profileCard: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Theme.shadow.card,
  },
  avatarText: { color: Colors.white, fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  vehicle: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  ratingText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginLeft: 4 },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...Theme.shadow.card,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  settingDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  settingGroup: { paddingVertical: 10 },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  intervalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  intervalBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  intervalBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  intervalBtnTextActive: { color: Colors.primary },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  actionChevron: { fontSize: 20, color: Colors.textMuted },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.danger + '15',
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: Colors.danger, fontWeight: '600', fontSize: 15 },
});
