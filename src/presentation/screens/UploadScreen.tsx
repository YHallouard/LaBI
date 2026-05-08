import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { UploadStackParamList } from "../../types/navigation";
import { AnalyzePdfUseCase } from "../../application/usecases/AnalyzePdfUseCase";
import { CreateManualAnalysisUseCase } from "../../application/usecases/CreateManualAnalysisUseCase";
import { ReferenceRangeService } from "../../application/services/ReferenceRangeService";
import { ScreenLayout } from "../components/ScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import { ManualImportModal } from "../components/ManualImportModal";

type UploadScreenProps = {
  navigation: StackNavigationProp<UploadStackParamList, "UploadScreen">;
  analyzePdfUseCase: AnalyzePdfUseCase | null;
  isLoadingApiKey: boolean;
  apiKeyError: string | null;
  checkAndLoadApiKey: () => Promise<void>;
  createManualAnalysisUseCase: CreateManualAnalysisUseCase | null;
  referenceRangeService: ReferenceRangeService | null;
};

export const UploadScreen: React.FC<UploadScreenProps> = ({
  navigation,
  analyzePdfUseCase,
  isLoadingApiKey,
  apiKeyError,
  checkAndLoadApiKey,
  createManualAnalysisUseCase,
  referenceRangeService,
}) => {
  const [manualVisible, setManualVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasCheckedApiKey = useRef<boolean>(false);

  useEffect(() => {
    if (!isLoadingApiKey && !hasCheckedApiKey.current && !analyzePdfUseCase) {
      hasCheckedApiKey.current = true;
      checkAndLoadApiKey();
    }
  }, [isLoadingApiKey, analyzePdfUseCase]);

  const hasValidApiKey = (): boolean => {
    return !apiKeyError && Boolean(analyzePdfUseCase);
  };

  const handleAiImport = (): void => {
    if (!hasValidApiKey()) {
      (navigation as any).navigate("Home", { screen: "ApiKeySettingsScreen" });
      return;
    }
    navigation.navigate("AiImportScreen");
  };

  const handleManualSaved = (): void => {
    setSuccessMessage("Analyse enregistrée avec succès");
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <ScreenLayout scrollable={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Comment veux-tu importer ?</Text>
        <Text style={styles.subtitle}>
          Choisis la méthode qui te convient.
        </Text>

        {successMessage && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#00a86b" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {!hasValidApiKey() && !isLoadingApiKey && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color="#856404" />
            <Text style={styles.warningText}>
              {apiKeyError || "Clé API Mistral non configurée."}
            </Text>
          </View>
        )}

        <ImportOptionCard
          iconName="sparkles"
          iconBgColor="#7c3aed"
          title="Import par IA"
          description="Importez un PDF, l'IA Mistral extrait automatiquement toutes les valeurs."
          badge="★ Recommandé"
          badgeColor="#00d97e"
          footer="~30 sec"
          footerIcon="time-outline"
          onPress={handleAiImport}
          disabled={isLoadingApiKey}
        />

        <ImportOptionCard
          iconName="pencil"
          iconBgColor="#0d9488"
          title="Import manuel"
          description="Saisissez les valeurs vous-même, catégorie par catégorie."
          badge="Plein contrôle"
          badgeColor="#2c7be5"
          footer={undefined}
          footerIcon={undefined}
          onPress={() => setManualVisible(true)}
          disabled={!createManualAnalysisUseCase || !referenceRangeService}
        />
      </View>

      {createManualAnalysisUseCase && referenceRangeService && (
        <ManualImportModal
          visible={manualVisible}
          onClose={() => setManualVisible(false)}
          onSaved={handleManualSaved}
          createManualAnalysisUseCase={createManualAnalysisUseCase}
          referenceRangeService={referenceRangeService}
        />
      )}
    </ScreenLayout>
  );
};

type ImportOptionCardProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  footer?: string;
  footerIcon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
};

const ImportOptionCard: React.FC<ImportOptionCardProps> = ({
  iconName,
  iconBgColor,
  title,
  description,
  badge,
  badgeColor,
  footer,
  footerIcon,
  onPress,
  disabled,
}) => (
  <TouchableOpacity
    style={[styles.card, disabled && styles.cardDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
  >
    <View style={styles.cardTop}>
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor + "22" }]}>
        <Ionicons name={iconName} size={24} color={iconBgColor} />
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeColor + "22" }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      )}
    </View>

    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>

    <View style={styles.cardBottom}>
      {footer && footerIcon && (
        <View style={styles.footer}>
          <Ionicons name={footerIcon} size={14} color="#5a7184" />
          <Text style={styles.footerText}>{footer}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#95aac9" style={styles.chevron} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#12263f",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#5a7184",
    marginBottom: 24,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 217, 126, 0.1)",
    borderColor: "#00d97e",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: "#00a86b",
    fontSize: 14,
    flex: 1,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderColor: "#ffeeba",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#12263f",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#5a7184",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 13,
    color: "#5a7184",
  },
  chevron: {
    marginLeft: "auto",
  },
});
