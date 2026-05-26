import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { UserProfile, Gender } from '../../../domain/UserProfile';
import { SaveUserProfileUseCase } from '../../../domain/usecases/SaveUserProfileUseCase';
import { EditUserProfileUseCase } from '../../../domain/usecases/EditUserProfileUseCase';
import { RepositoryFactory } from '../../../infrastructure/repositories/RepositoryFactory';
import {
  colors, spacing, radii, elevation,
  typography, ScreenHeader, PersonAvatar, Banner, PrimaryButton,
} from '../../../design-system';

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    birthDate: new Date(),
    gender: 'male' as Gender,
    profileImage: undefined,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [saveUC, setSaveUC] = useState<SaveUserProfileUseCase | null>(null);
  const [editUC, setEditUC] = useState<EditUserProfileUseCase | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const repo = await RepositoryFactory.getUserProfileRepository();
        const saveCase = new SaveUserProfileUseCase(repo);
        const editCase = new EditUserProfileUseCase(repo);
        setSaveUC(saveCase);
        setEditUC(editCase);

        const existing = await new (await import('../../../domain/usecases/RetrieveUserProfileUseCase')).RetrieveUserProfileUseCase(repo).execute();
        if (existing) {
          setProfile(existing);
          setProfileExists(true);
        } else {
          setIsEditMode(true);
        }
      } catch {
        setErrorMsg('Impossible de charger le profil.');
        setIsEditMode(true);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!profile.firstName.trim()) { setErrorMsg('Le prénom est requis.'); return; }
    if (!profile.lastName.trim()) { setErrorMsg('Le nom est requis.'); return; }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const validated = {
        ...profile,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
      };
      if (profileExists) {
        await editUC?.execute(validated);
      } else {
        await saveUC?.execute(validated);
      }
      setProfile(validated);
      setProfileExists(true);
      setIsEditMode(false);
      setSuccessMsg('Profil enregistré.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setErrorMsg(`Erreur lors de la sauvegarde : ${e instanceof Error ? e.message : 'inconnue'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d?: Date) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const calcAge = (d?: Date) => {
    if (!d) return null;
    const today = new Date();
    const bd = new Date(d);
    let age = today.getFullYear() - bd.getFullYear();
    if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
    return age;
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || undefined;
  const age = calcAge(profile.birthDate);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="Profil"
        subtitle="Informations personnelles"
        onBack={() => router.back()}
        right={
          profileExists && !isEditMode ? (
            <Pressable onPress={() => setIsEditMode(true)} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + name display */}
        <View style={styles.avatarSection}>
          <PersonAvatar name={displayName} size={80} />
          {profileExists && (
            <View style={styles.avatarInfo}>
              <Text style={[typography.h2, { textAlign: 'center' }]}>{displayName || '—'}</Text>
              {age !== null && (
                <Text style={[typography.small, { color: colors.textBody, marginTop: 2 }]}>
                  {age} ans · {profile.gender === 'female' ? 'Femme' : 'Homme'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Banners */}
        {successMsg && <Banner kind="success">{successMsg}</Banner>}
        {errorMsg && <Banner kind="error">{errorMsg}</Banner>}

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={[typography.label, styles.sectionLabel]}>Informations personnelles</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing[3] }]}>
            Utilisées pour calculer les plages de référence adaptées à votre profil.
          </Text>

          {/* First name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Prénom</Text>
            {isEditMode ? (
              <TextInput
                style={styles.input}
                value={profile.firstName}
                onChangeText={t => setProfile(p => ({ ...p, firstName: t }))}
                placeholder="Votre prénom"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.firstName || '—'}</Text>
            )}
          </View>

          {/* Last name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nom</Text>
            {isEditMode ? (
              <TextInput
                style={styles.input}
                value={profile.lastName}
                onChangeText={t => setProfile(p => ({ ...p, lastName: t }))}
                placeholder="Votre nom"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.lastName || '—'}</Text>
            )}
          </View>

          {/* Date of birth */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date de naissance</Text>
            {isEditMode ? (
              <>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateBtn}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.dateBtnText}>{formatDate(profile.birthDate)}</Text>
                  {age !== null && <Text style={[typography.caption, { color: colors.textMuted }]}>({age} ans)</Text>}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
                {showDatePicker && (
                  <View style={styles.datePicker}>
                    <DateTimePicker
                      value={profile.birthDate ? new Date(profile.birthDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, d) => {
                        if (d) setProfile(p => ({ ...p, birthDate: d }));
                        if (Platform.OS === 'android') setShowDatePicker(false);
                      }}
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      style={Platform.OS === 'ios' ? { height: 180 } : undefined}
                    />
                    {Platform.OS === 'ios' && (
                      <Pressable onPress={() => setShowDatePicker(false)} style={styles.datePickerDone}>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Confirmer</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.fieldValue}>{formatDate(profile.birthDate)}</Text>
            )}
          </View>

          {/* Gender */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sexe biologique</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing[2] }]}>
              Pour le calcul des plages de référence médicales uniquement.
            </Text>
            {isEditMode ? (
              <View style={styles.genderRow}>
                {(['male', 'female'] as Gender[]).map(g => (
                  <Pressable
                    key={g}
                    onPress={() => setProfile(p => ({ ...p, gender: g }))}
                    style={[styles.genderOpt, profile.gender === g && styles.genderOptActive]}
                  >
                    <Text style={[styles.genderOptText, profile.gender === g && styles.genderOptTextActive]}>
                      {g === 'male' ? 'Homme' : 'Femme'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{profile.gender === 'female' ? 'Femme' : 'Homme'}</Text>
            )}
          </View>
        </View>

        {/* Save / Cancel buttons */}
        {isEditMode && (
          <View style={styles.actions}>
            <PrimaryButton
              onPress={handleSave}
              size="lg"
              loading={isSaving}
            >
              Enregistrer
            </PrimaryButton>
            {profileExists && (
              <PrimaryButton
                onPress={() => { setIsEditMode(false); setErrorMsg(null); }}
                variant="ghost"
                size="md"
              >
                Annuler
              </PrimaryButton>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[2], gap: spacing[4] },
  avatarSection: { alignItems: 'center', paddingVertical: spacing[4], gap: spacing[3] },
  avatarInfo: { alignItems: 'center', gap: 2 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { marginBottom: spacing[1] },
  formSection: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: 0,
    ...elevation[1],
  },
  field: { marginBottom: spacing[4] },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textBody,
    marginBottom: spacing[1],
  },
  fieldValue: {
    fontSize: 16,
    color: colors.textStrong,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    fontSize: 16,
    color: colors.textStrong,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dateBtnText: { flex: 1, fontSize: 16, color: colors.textStrong },
  datePicker: {
    marginTop: spacing[2],
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  datePickerDone: {
    alignItems: 'center',
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  genderRow: { flexDirection: 'row', gap: spacing[3] },
  genderOpt: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderOptActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderOptText: { fontSize: 16, fontWeight: '500', color: colors.textStrong },
  genderOptTextActive: { color: colors.textOnColor },
  actions: { gap: spacing[3] },
});
