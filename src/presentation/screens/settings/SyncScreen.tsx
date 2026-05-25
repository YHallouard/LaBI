import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SyncDevicesUseCase } from '../../../domain/usecases/SyncDevicesUseCase';
import { SyncingServiceFactory } from '../../../infrastructure/service/SyncingServiceFactory';
import {
  SyncDeviceInfo,
  SyncProgress,
  SyncRole,
  SyncStatus,
} from '../../../ports/services/SyncingServicePort';
import { RetrieveUserProfileUseCase } from '../../../domain/usecases/RetrieveUserProfileUseCase';
import { ProfileService } from '../../../domain/services/ProfileService';
import { RepositoryFactory } from '../../../infrastructure/repositories/RepositoryFactory';
import { getDatabaseStorage } from '../../../infrastructure/database/DatabaseInitializer';
import {
  colors, spacing, radii, elevation, typography,
  ScreenHeader, ListSection, PrimaryButton,
  SyncHeroCard, DeviceDiscoveryRow,
} from '../../../design-system';

export function SyncScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [syncRole, setSyncRole] = useState<SyncRole | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<SyncDeviceInfo[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ status: SyncStatus.IDLE, progress: 0 });
  const [deviceName, setDeviceName] = useState('Héméa Device');
  const [isLoading, setIsLoading] = useState(true);

  const ucRef = useRef<SyncDevicesUseCase | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load profile for device display name
  useEffect(() => {
    (async () => {
      try {
        const repo = await RepositoryFactory.getUserProfileRepository();
        const profile = await new RetrieveUserProfileUseCase(repo).execute();
        if (profile) setDeviceName(`${profile.firstName} - Héméa`);
      } catch { /* keep default */ }
      finally { setIsLoading(false); }
    })();
  }, []);

  // Initialize use case once profile is known
  useEffect(() => {
    if (isLoading) return;
    let uc: SyncDevicesUseCase | null = null;
    const initialize = async () => {
      try {
        const syncingService = SyncingServiceFactory.createSyncingService();
        const dbAdapter = await getDatabaseStorage();
        const analysisRepo = await RepositoryFactory.getBiologicalAnalysisRepository();
        const profileRepo = await RepositoryFactory.getUserProfileRepository();
        const profileService = ProfileService.getInstance();
        profileService.initialize(profileRepo);
        uc = new SyncDevicesUseCase(syncingService, dbAdapter, analysisRepo, profileRepo, profileService, deviceName);
        await uc.initialize();
        uc.setProgressCallback(setSyncProgress);
        ucRef.current = uc;
      } catch (e) {
        Alert.alert('Erreur', `Impossible d'initialiser la synchronisation : ${e}`);
      }
    };
    initialize();
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      uc?.stopListening().catch(() => {});
    };
  }, [deviceName, isLoading]);

  const startPolling = (uc: SyncDevicesUseCase) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      setDiscoveredDevices([...uc.getDiscoveredDevices()]);
    }, 1000);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleToggle = async (val: boolean) => {
    const uc = ucRef.current;
    if (!uc) return;
    setActive(val);
    if (val) {
      try {
        await uc.startListening();
        startPolling(uc);
      } catch (e) {
        setActive(false);
        Alert.alert('Erreur', `${e}`);
      }
    } else {
      stopPolling();
      try {
        await uc.stopListening();
        setDiscoveredDevices([]);
        setSyncRole(null);
        setSyncProgress({ status: SyncStatus.IDLE, progress: 0 });
      } catch (e) {
        Alert.alert('Erreur', `${e}`);
      }
    }
  };

  const handleRefresh = () => {
    if (!active || scanning) return;
    setScanning(true);
    setTimeout(() => setScanning(false), 1600);
  };

  const handleDevicePress = (device: SyncDeviceInfo) => {
    Alert.alert(
      device.name,
      'Choisissez le rôle de cet appareil dans cette synchronisation.',
      [
        { text: 'Envoyer mes données', onPress: () => startAsSender() },
        { text: 'Recevoir les données', onPress: () => startAsReceiver(device.id) },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const startAsSender = async () => {
    const uc = ucRef.current;
    if (!uc) return;
    try {
      setSyncRole(SyncRole.SENDER);
      stopPolling();
      await uc.startAsSender();
    } catch (e) {
      setSyncRole(null);
      Alert.alert('Erreur', `${e}`);
    }
  };

  const startAsReceiver = async (deviceId: string) => {
    const uc = ucRef.current;
    if (!uc) return;
    try {
      setSyncRole(SyncRole.RECEIVER);
      stopPolling();
      await uc.startAsReceiver();
      const ok = await uc.connectToDevice(deviceId);
      if (!ok) {
        setSyncRole(null);
        Alert.alert('Erreur', 'Connexion échouée.');
      }
    } catch (e) {
      setSyncRole(null);
      Alert.alert('Erreur', `${e}`);
    }
  };

  const startSync = async () => {
    const uc = ucRef.current;
    if (!uc) return;
    try { await uc.startSync(); }
    catch (e) { Alert.alert('Erreur', `${e}`); }
  };

  const cancelSync = async () => {
    try {
      await ucRef.current?.stopListening();
      setSyncRole(null);
      setSyncProgress({ status: SyncStatus.IDLE, progress: 0 });
      // Resume listening if hero toggle is still on
      if (active && ucRef.current) {
        await ucRef.current.startListening();
        startPolling(ucRef.current);
      }
    } catch (e) {
      Alert.alert('Erreur', `${e}`);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScreenHeader title="Synchronisation" subtitle="Pair-à-pair · réseau local" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[typography.small, { color: colors.textBody, marginTop: spacing[3] }]}>
            Initialisation…
          </Text>
        </View>
      </View>
    );
  }

  const isCompleted = syncProgress.status === SyncStatus.COMPLETED;
  const isError = syncProgress.status === SyncStatus.ERROR;
  const isTransferring = syncProgress.status === SyncStatus.TRANSFERRING;
  const isConnected = syncProgress.status === SyncStatus.CONNECTED;
  const isSenderWaiting = syncRole === SyncRole.SENDER && syncProgress.status === SyncStatus.IDLE;
  const showProgress = syncRole !== null && !isSenderWaiting && syncProgress.status !== SyncStatus.IDLE;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Synchronisation"
        subtitle="Pair-à-pair · réseau local"
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroWrap}>
          <SyncHeroCard active={active} onToggle={handleToggle} deviceName={deviceName} />
        </View>

        {/* Sender: waiting for receiver to connect */}
        {isSenderWaiting && (
          <View style={styles.statusCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[typography.small, styles.statusText]}>
              Cet appareil est prêt à envoyer.{'\n'}En attente de connexion du destinataire…
            </Text>
            <PrimaryButton onPress={cancelSync} variant="ghost" size="md" style={{ marginTop: spacing[3] }}>
              Annuler
            </PrimaryButton>
          </View>
        )}

        {/* Connected / transferring / result */}
        {showProgress && (
          <View style={styles.statusCard}>
            {isConnected ? (
              <>
                <Ionicons
                  name={syncRole === SyncRole.RECEIVER ? 'cloud-download-outline' : 'cloud-upload-outline'}
                  size={48}
                  color={colors.primary}
                />
                {syncRole === SyncRole.SENDER ? (
                  <>
                    <Text style={[typography.small, styles.statusText]}>
                      Destinataire connecté. Prêt à envoyer.
                    </Text>
                    <PrimaryButton onPress={startSync} size="lg" style={{ marginTop: spacing[3] }}>
                      Démarrer la synchronisation
                    </PrimaryButton>
                  </>
                ) : (
                  <Text style={[typography.small, styles.statusText]}>
                    Connecté. En attente du démarrage de l&apos;envoi…
                  </Text>
                )}
                <PrimaryButton onPress={cancelSync} variant="ghost" size="md" style={{ marginTop: spacing[2] }}>
                  Annuler
                </PrimaryButton>
              </>
            ) : (
              <>
                <View style={styles.progressIconWrap}>
                  <Ionicons
                    name={
                      isCompleted ? 'checkmark-circle'
                      : isError ? 'alert-circle'
                      : syncRole === SyncRole.RECEIVER ? 'cloud-download'
                      : 'cloud-upload'
                    }
                    size={52}
                    color={isError ? colors.danger : isCompleted ? colors.successDeep : colors.primary}
                  />
                  {isTransferring && (
                    <ActivityIndicator size="large" color={colors.primary} style={StyleSheet.absoluteFillObject} />
                  )}
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      width: `${syncProgress.progress}%` as `${number}%`,
                      backgroundColor: isError ? colors.danger : colors.primary,
                    },
                  ]} />
                </View>
                <Text style={[typography.small, { color: colors.textBody, textAlign: 'center' }]}>
                  {syncProgress.message ?? `${syncProgress.progress}%`}
                </Text>
                {(isCompleted || isError) ? (
                  <PrimaryButton
                    onPress={() => {
                      setSyncRole(null);
                      setSyncProgress({ status: SyncStatus.IDLE, progress: 0 });
                      if (active && ucRef.current) startPolling(ucRef.current);
                    }}
                    size="lg"
                    style={{ marginTop: spacing[3] }}
                  >
                    {isCompleted ? 'Terminé' : 'Fermer'}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton onPress={cancelSync} variant="ghost" size="md" style={{ marginTop: spacing[3] }}>
                    Annuler
                  </PrimaryButton>
                )}
              </>
            )}
          </View>
        )}

        {/* Discovery section — hidden while a sync role is active */}
        {!isSenderWaiting && !showProgress && (
          <ListSection
            title="APPAREILS DÉTECTÉS SUR LE RÉSEAU"
            right={
              <Pressable onPress={handleRefresh} disabled={!active || scanning} hitSlop={8}>
                {scanning
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : (
                    <Text style={[styles.refreshText, (!active) && { color: colors.textMuted }]}>
                      Actualiser
                    </Text>
                  )
                }
              </Pressable>
            }
          >
            {!active && (
              <View style={styles.emptyRow}>
                <Text style={[typography.small, { color: colors.textMuted, textAlign: 'center' }]}>
                  Activez la synchronisation pour rechercher des appareils.
                </Text>
              </View>
            )}
            {active && discoveredDevices.length === 0 && (
              <View style={styles.emptyRow}>
                <ActivityIndicator size="small" color={colors.textMuted} />
                <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing[2], textAlign: 'center' }]}>
                  Aucun appareil détecté sur ce réseau.
                </Text>
              </View>
            )}
            {active && discoveredDevices.map((d, i) => (
              <DeviceDiscoveryRow
                key={d.id}
                name={d.name}
                onPress={() => handleDevicePress(d)}
                isLast={i === discoveredDevices.length - 1}
              />
            ))}
          </ListSection>
        )}

        {/* Privacy footer */}
        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.textMuted} style={{ marginTop: 1 }} />
          <Text style={styles.privacyText}>
            La synchronisation se fait{' '}
            <Text style={{ color: colors.textStrong, fontWeight: '600' }}>directement entre vos appareils</Text>
            , sur le même réseau Wi-Fi. Les données sont chiffrées de bout en bout ; aucun serveur Héméa n'est impliqué.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: spacing[2] },
  heroWrap: {
    marginHorizontal: spacing[4],
    marginBottom: 22,
  },
  statusCard: {
    marginHorizontal: spacing[4],
    marginBottom: 22,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[5],
    alignItems: 'center',
    ...elevation[1],
  },
  statusText: {
    color: colors.textBody,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  progressIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: spacing[3],
  },
  progressBarFill: { height: '100%', borderRadius: 999 },
  emptyRow: {
    padding: spacing[5],
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.textBody,
    lineHeight: 18,
  },
});
