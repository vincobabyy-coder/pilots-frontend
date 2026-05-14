import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import SignatureCanvas from 'react-native-signature-canvas';
import { mobileApi } from '@/services/api';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';
import { Delivery, ConfirmDeliveryPayload } from '@/types/delivery';
import { getCurrentLocation } from '@/services/geolocation';
import { enqueue } from '@/services/offlineQueue';

interface Props {
  delivery: Delivery;
  onClose: () => void;
  onConfirmed: () => void;
}

type Step = 'photo' | 'signature' | 'confirm';

export default function DeliveryConfirmScreen({ delivery, onClose, onConfirmed }: Props) {
  const [step, setStep] = useState<Step>('photo');
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState(delivery.notes ?? '');
  const [goodCondition, setGoodCondition] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    if (!cameraRef.current) return;
    const pic = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
    if (pic?.base64) setPhoto(pic.base64);
  };

  const handleSignature = (sig: string) => {
    // Strip data URL prefix
    const base64 = sig.replace(/^data:image\/\w+;base64,/, '');
    setSignature(base64);
  };

  const handleSubmit = async () => {
    if (!photo || !signature) {
      Alert.alert('Missing info', 'Photo and signature are required.');
      return;
    }

    setSubmitting(true);
    try {
      const loc = await getCurrentLocation();
      const payload: ConfirmDeliveryPayload = {
        photo_base64: photo,
        signature_base64: signature,
        notes: notes,
        lat: loc?.lat ?? 0,
        lng: loc?.lng ?? 0,
      };

      try {
        await mobileApi.post(`/drivers/me/deliveries/${delivery.id}/confirm`, payload);
      } catch {
        // Queue for offline retry
        await enqueue('POST', `/drivers/me/deliveries/${delivery.id}/confirm`, payload);
      }

      Alert.alert('✅ Confirmed', 'Delivery confirmed successfully!', [
        { text: 'OK', onPress: onConfirmed },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to confirm delivery. It has been queued for retry.');
      onConfirmed();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'photo' ? 'Step 1: Photo' : step === 'signature' ? 'Step 2: Signature' : 'Step 3: Confirm'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Step indicators */}
        <View style={styles.stepRow}>
          {(['photo', 'signature', 'confirm'] as Step[]).map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                { backgroundColor: s === step ? Colors.primary : step > s ? Colors.success : Colors.border },
              ]}
            />
          ))}
        </View>

        {/* Step 1: Photo */}
        {step === 'photo' && (
          <View style={styles.stepContent}>
            {photo ? (
              <View style={styles.photoPreview}>
                <Text style={{ fontSize: 60 }}>📷</Text>
                <Text style={styles.photoCaption}>Photo captured ✓</Text>
                <TouchableOpacity onPress={() => setPhoto(null)} style={styles.retakeBtn}>
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <CameraView ref={cameraRef} style={styles.camera} facing="back">
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>
              </CameraView>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, !photo && styles.nextBtnDisabled]}
              disabled={!photo}
              onPress={() => setStep('signature')}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Signature */}
        {step === 'signature' && (
          <View style={styles.stepContent}>
            <Text style={styles.sigInstruction}>Please ask the customer to sign below</Text>
            <View style={styles.sigCanvas}>
              <SignatureCanvas
                onOK={handleSignature}
                style={{ flex: 1 }}
                webStyle=".m-signature-pad--footer { display: none; margin: 0px; } body { background: #fff; }"
              />
            </View>
            {signature && <Text style={styles.sigOk}>Signature captured ✓</Text>}
            <View style={styles.sigActions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setSignature(null)}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, !signature && styles.nextBtnDisabled]}
                disabled={!signature}
                onPress={() => setStep('confirm')}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Notes + confirm */}
        {step === 'confirm' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent}>
            <Text style={styles.confirmLabel}>Delivery Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes about this delivery..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
            />
            <View style={styles.checkRow}>
              <Switch
                value={goodCondition}
                onValueChange={setGoodCondition}
                trackColor={{ true: Colors.success }}
                thumbColor={Colors.white}
              />
              <Text style={styles.checkLabel}>Customer received goods in good condition</Text>
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryItem}>📷 Photo: {photo ? '✓ Captured' : '✗ Missing'}</Text>
              <Text style={styles.summaryItem}>✍️ Signature: {signature ? '✓ Captured' : '✗ Missing'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>✅ Confirm Delivery</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep('signature')}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelText: { fontSize: 15, color: Colors.danger, fontWeight: '500' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  stepRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepContent: { flex: 1, padding: 20, gap: 16 },
  camera: { flex: 1, borderRadius: 16, overflow: 'hidden', minHeight: 300 },
  captureBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white + '50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.white,
  },
  photoPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  photoCaption: { fontSize: 16, fontWeight: '600', color: Colors.success },
  retakeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retakeBtnText: { color: Colors.textPrimary, fontWeight: '500' },
  nextBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  sigInstruction: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  sigCanvas: { flex: 1, minHeight: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  sigOk: { fontSize: 13, color: Colors.success, textAlign: 'center', fontWeight: '500' },
  sigActions: { flexDirection: 'row', gap: 12 },
  clearBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { color: Colors.textSecondary, fontWeight: '500' },
  confirmLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  summary: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  summaryItem: { fontSize: 14, color: Colors.textSecondary },
  submitBtn: {
    height: 56,
    backgroundColor: Colors.success,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backBtnText: { color: Colors.textMuted, fontWeight: '500' },
});
