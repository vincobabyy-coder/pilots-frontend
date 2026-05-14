import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AvailableJob } from '@/types/delivery';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

interface JobCardProps {
  job: AvailableJob;
  onAccept: (jobId: string) => Promise<void>;
  onViewDetails: (job: AvailableJob) => void;
  isAccepting?: boolean;
}

export function JobCard({
  job,
  onAccept,
  onViewDetails,
  isAccepting = false,
}: JobCardProps) {
  const priorityColor =
    job.priority === 'urgent'
      ? Colors.danger
      : job.priority === 'high'
        ? Colors.warning
        : Colors.textMuted;

  return (
    <View style={styles.card}>
      {/* Priority badge */}
      <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
        <Text style={[styles.priorityText, { color: priorityColor }]}>
          {job.priority.toUpperCase()}
        </Text>
      </View>

      {/* Destination */}
      <Text style={styles.destination} numberOfLines={2}>
        {job.destination}
      </Text>

      {/* Customer name if available */}
      {job.customerName && (
        <Text style={styles.customerName} numberOfLines={1}>
          Customer: {job.customerName}
        </Text>
      )}

      {/* Key metrics row */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Distance</Text>
          <Text style={styles.metricValue}>{job.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Time</Text>
          <Text style={styles.metricValue}>{Math.round(job.estimatedMinutes)} min</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pay</Text>
          <Text style={[styles.metricValue, { color: Colors.success }]}>
            ₦{job.pay.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Special instructions if available */}
      {job.specialInstructions && (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsLabel}>📝 Special Instructions</Text>
          <Text style={styles.instructionsText} numberOfLines={2}>
            {job.specialInstructions}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => onViewDetails(job)}
          disabled={isAccepting}
        >
          <Text style={styles.detailsBtnText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, isAccepting && styles.acceptBtnDisabled]}
          onPress={() => onAccept(job.id)}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acceptBtnText}>Accept Job</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Theme.shadow.card,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  destination: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  customerName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  instructionsBox: {
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  acceptBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnDisabled: {
    opacity: 0.6,
  },
  acceptBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
