import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';
import { mobileApi } from '@/services/api';
import { mobileWs } from '@/services/websocket';
import { ConfirmDeliveryPayload } from '@/types/delivery';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Colors } from '@/styles/colors';
import { Theme } from '@/styles/theme';

interface DeliveryProofScreenProps {
  shipmentId: string;
  destination: string;
  customer: string;
  onComplete?: () => void;
}

type ProofStep = 'details' | 'photo' | 'signature' | 'review' | 'submitting';

export default function DeliveryProofScreen({
  shipmentId,
  destination,
  customer,
  onComplete,
}: DeliveryProofScreenProps) {
  const [step, setStep] = useState<ProofStep>('details');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { location } = useGeolocation({ interval: 1000 });
  const cameraRef = useRef(null);
  const signatureRef = useRef<any>(null);

  const currentLat = location?.coords.latitude ?? 6.5244;
  const currentLng = location?.coords.longitude ?? 3.3792;

  // Request camera permission
  const requestCameraPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setCameraMode(true);
  };

  // Camera photo confirmation
  const handleCameraCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true });
      if (photo) {
        setPhoto(photo.uri);
        setPhotoBase64(photo.base64 || null);
        setCameraMode(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  // Pick photo from library
  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhoto(asset.uri);
        setPhotoBase64(asset.base64 || null);
        setStep('signature');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  // Handle signature completion
  const handleSignatureEnd = () => {
    signatureRef.current?.readSignature();
  };

  // Process signature
  const onSignatureComplete = (signature: string) => {
    setSignatureBase64(signature);
    setSignature(signature);
    setStep('review');
  };

  // Submit delivery proof
  const handleSubmit = async () => {
    if (!photoBase64 || !signatureBase64) {
      Alert.alert('Missing Information', 'Please provide both photo and signature');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ConfirmDeliveryPayload = {
        photo_base64: photoBase64,
        signature_base64: signatureBase64,
        notes: notes.trim(),
        lat: currentLat,
        lng: currentLng,
      };

      // Send proof to backend
      await mobileApi.post(`/shipments/${shipmentId}/confirm`, payload);

      // Broadcast via WebSocket
      mobileWs.send({
        action: 'delivery_confirmed',
        shipmentId,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Success', 'Delivery confirmed!', [
        {
          text: 'OK',
          onPress: () => onComplete?.(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', (err as Error).message || 'Failed to submit delivery proof');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Details & Notes
  if (step === 'details') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Confirm Delivery</Text>
          <Text style={styles.headerSubtitle}>{customer}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Destination</Text>
          <Text style={styles.infoValue}>{destination}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Add any notes about the delivery (damage, special circumstances, etc.)
          </Text>
        </View>

        <View style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            editable={true}
            multiline={true}
            placeholder="E.g., Item was slightly damaged but accepted by customer"
            placeholderTextColor={Colors.textMuted}
            onChangeText={setNotes}
            value={notes}
          />
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => setStep('photo')}
        >
          <Text style={styles.nextBtnText}>Next: Take Photo →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  // Step 2: Photo Capture
  if (step === 'photo') {
    if (cameraMode) {
      return (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraCancelBtn}
              onPress={() => setCameraMode(false)}
            >
              <Text style={styles.cameraCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraShutterBtn}
              onPress={handleCameraCapture}
            >
              <View style={styles.cameraShutterCircle} />
            </TouchableOpacity>
            <View style={{ width: 60 }} />
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Photo Proof</Text>
          <Text style={styles.headerSubtitle}>Take a photo of the delivered items</Text>
        </View>

        {photo ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo }} style={styles.photoImage} />
            <TouchableOpacity
              style={styles.photoRemoveBtn}
              onPress={() => {
                setPhoto(null);
                setPhotoBase64(null);
              }}
            >
              <Text style={styles.photoRemoveBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderEmoji}>📸</Text>
            <Text style={styles.placeholderText}>No photo taken yet</Text>
          </View>
        )}

        <View style={styles.photoButtonsContainer}>
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={handleTakePhoto}
          >
            <Text style={styles.photoBtnText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={handlePickPhoto}
          >
            <Text style={styles.photoBtnText}>🖼️ Choose from Library</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, !photo && styles.nextBtnDisabled]}
          onPress={() => photo && setStep('signature')}
          disabled={!photo}
        >
          <Text style={styles.nextBtnText}>Next: Get Signature →</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  // Step 3: Signature
  if (step === 'signature') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Customer Signature</Text>
          <Text style={styles.headerSubtitle}>Get the customer to sign below</Text>
        </View>

        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={onSignatureComplete}
            onEmpty={() => {}}
            descriptionText=""
            webStyle={`
              .m-signature-pad--body canvas {
                border: 1px solid #ddd;
                border-radius: 8px;
              }
              .m-signature-pad {
                padding: 0;
              }
            `}
            clearText="Clear"
            confirmText="Confirm"
            style={{ height: 300, width: '100%' }}
          />
        </View>

        <View style={styles.signatureButtonsContainer}>
          <TouchableOpacity
            style={styles.signatureBtn}
            onPress={() => signatureRef.current?.clearSignature()}
          >
            <Text style={styles.signatureBtnText}>🔄 Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signatureBtnPrimary}
            onPress={handleSignatureEnd}
          >
            <Text style={styles.signatureBtnText}>✓ Confirm</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </View>
    );
  }

  // Step 4: Review
  if (step === 'review') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Delivery Proof</Text>
          <Text style={styles.headerSubtitle}>Verify all information before submission</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Photo</Text>
          {photo && (
            <Image
              source={{ uri: photo }}
              style={styles.reviewImage}
            />
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Signature</Text>
          {signature && (
            <Image
              source={{ uri: `data:image/png;base64,${signatureBase64}` }}
              style={styles.reviewImage}
            />
          )}
        </View>

        {notes && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>Delivery Notes</Text>
            <View style={styles.notesReview}>
              <Text style={styles.notesReviewText}>{notes}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextBtnText}>✓ Submit Delivery Proof</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.white + 'CC',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: -32,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    ...Theme.shadow.card,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  notesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.textPrimary,
    ...Theme.shadow.card,
  },
  nextBtn: {
    marginHorizontal: 20,
    marginBottom: 20,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    backgroundColor: Colors.black,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cameraCancelBtnText: {
    color: Colors.white,
    fontWeight: '600',
  },
  cameraShutterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraShutterCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.danger,
  },
  photoPlaceholder: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  placeholderEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  photoPreview: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    ...Theme.shadow.card,
  },
  photoImage: {
    width: '100%',
    height: 300,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  photoButtonsContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  photoBtn: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  signatureContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...Theme.shadow.card,
  },
  signatureButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  signatureBtn: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signatureBtnPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signatureBtnText: {
    fontWeight: '600',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  reviewSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  reviewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  notesReview: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesReviewText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
});
