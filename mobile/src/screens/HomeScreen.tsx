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
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useJobs } from '@/hooks/useJobs';
import { useRoute } from '@/hooks/useRoute';
import { JobCard } from '@/components/JobCard';
import { AvailableJob } from '@/types/delivery';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

export default function HomeScreen() {
  const { state } = useAuth();
  const { availableJobs, loading, refreshJobs } = useJobs();
  const { currentRoute } = useRoute();
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshJobs();
    } finally {
      setRefreshing(false);
    }
  }, [refreshJobs]);

  const handleAcceptJob = useCallback(
    async (jobId: string) => {
      setAcceptingJobId(jobId);
      try {
        const routeId = await useJobs().acceptJob(jobId);
        Alert.alert('Success', 'Job accepted! Check your route for next steps.', [
          {
            text: 'OK',
            onPress: () => {
              // In a real app, you'd navigate to the route screen
            },
          },
        ]);
      } catch (err) {
        Alert.alert('Error', (err as Error).message || 'Failed to accept job');
      } finally {
        setAcceptingJobId(null);
      }
    },
    []
  );

  const handleViewDetails = useCallback((job: AvailableJob) => {
    // In a real app, this would navigate to a detailed view
    Alert.alert(
      job.destination,
      `Distance: ${job.distance.toFixed(1)} km\nTime: ${Math.round(job.estimatedMinutes)} min\nPay: ₦${job.pay.toLocaleString()}\n\nSpecial Instructions: ${job.specialInstructions || 'None'}`,
      [{ text: 'Close' }]
    );
  }, []);

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
        <Text style={styles.date}>
          {now.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Current route summary */}
      {currentRoute && currentRoute.stops && currentRoute.stops.length > 0 && (
        <View style={styles.routeSummarySection}>
          <Text style={styles.sectionTitle}>Your Active Route</Text>
          <View style={styles.routeSummaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Stops</Text>
              <Text style={styles.summaryValue}>{currentRoute.stops.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Distance</Text>
              <Text style={styles.summaryValue}>{(currentRoute.totalDistance ?? 0).toFixed(1)} km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={[styles.summaryValue, { color: Colors.primary }]}>
                {currentRoute.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Available jobs section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Jobs</Text>
          {availableJobs.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{availableJobs.length}</Text>
            </View>
          )}
        </View>

        {loading && availableJobs.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding available jobs...</Text>
          </View>
        ) : availableJobs.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyEmoji}>😴</Text>
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptySubtitle}>
              {currentRoute?.stops && currentRoute.stops.length > 0
                ? 'Focus on completing your current route'
                : 'Check back soon for new delivery opportunities'}
            </Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={availableJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <JobCard
                job={item}
                onAccept={handleAcceptJob}
                onViewDetails={handleViewDetails}
                isAccepting={acceptingJobId === item.id}
              />
            )}
            contentContainerStyle={styles.jobsList}
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
  hero: {
    backgroundColor: Colors.secondary,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  date: {
    fontSize: 13,
    color: Colors.white + 'CC',
    marginTop: 2,
  },
  routeSummarySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 8,
  },
  routeSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    ...Theme.shadow.card,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  jobsList: {
    paddingBottom: 16,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 20,
    ...Theme.shadow.card,
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
    lineHeight: 18,
  },
});
