import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Button
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import { BiologicalAnalysis, LabValue } from '../../domain/entities/BiologicalAnalysis';
import { GetAnalysisByIdUseCase } from '../../application/usecases/GetAnalysesUseCase';
import { UpdateAnalysisUseCase } from '../../application/usecases/UpdateAnalysisUseCase';
import { LAB_VALUE_KEYS, LAB_VALUE_UNITS, LAB_VALUE_REFERENCE_RANGES } from '../../config/LabConfig';

// Define the props type for the AnalysisDetails screen
interface AnalysisDetailsScreenProps extends StackScreenProps<RootStackParamList, 'AnalysisDetails'> {
  getAnalysisByIdUseCase: GetAnalysisByIdUseCase;
  updateAnalysisUseCase: UpdateAnalysisUseCase;
}

// Composant pour saisir des valeurs numériques avec point décimal
const DecimalInput = ({
  value,
  onChangeText,
  onFocus,
  style
}: {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  style?: any;
}) => {
  const inputRef = useRef<TextInput>(null);
  
  const addDecimalPoint = () => {
    // Si la valeur ne contient pas déjà un point, l'ajouter
    if (!value.includes('.')) {
      onChangeText(value + '.');
    }
    
    // Redonner le focus au champ
    inputRef.current?.focus();
  };
  
  return (
    <View style={styles.decimalInputContainer}>
      <TextInput
        ref={inputRef}
        style={[styles.valueInput, style]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        onFocus={onFocus}
      />
      <TouchableOpacity 
        style={styles.decimalButton}
        onPress={addDecimalPoint}
      >
        <Text style={styles.decimalButtonText}>.</Text>
      </TouchableOpacity>
    </View>
  );
};

const AnalysisDetailsScreen: React.FC<AnalysisDetailsScreenProps> = ({ 
  route, 
  navigation,
  getAnalysisByIdUseCase,
  updateAnalysisUseCase
}) => {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<BiologicalAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour les valeurs modifiées
  const [editedValues, setEditedValues] = useState<Record<string, LabValue>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // État pour les valeurs brutes (pendant l'édition)
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  
  // Chargement de l'analyse
  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);
  
  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const result = await getAnalysisByIdUseCase.execute(analysisId);
      setAnalysis(result);
      setError(null);
      
      // Initialiser les valeurs modifiées avec les valeurs actuelles
      if (result) {
        const initialValues: Record<string, LabValue> = {};
        const initialRawInputs: Record<string, string> = {};
        
        LAB_VALUE_KEYS.forEach(key => {
          const value = (result as any)[key] as LabValue;
          if (value) {
            initialValues[key] = { ...value };
            initialRawInputs[key] = value.value.toString();
          } else {
            // Valeur par défaut si non existante
            initialValues[key] = { value: 0, unit: LAB_VALUE_UNITS[key] || '' };
            initialRawInputs[key] = '0';
          }
        });
        
        setEditedValues(initialValues);
        setRawInputs(initialRawInputs);
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setError('Failed to load analysis details');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestionnaire de modification de valeur
  const handleValueChange = (key: string, text: string) => {
    // Stocker le texte brut pour l'affichage
    setRawInputs(prev => ({
      ...prev,
      [key]: text
    }));
    
    // Remplacer les virgules par des points
    const sanitizedText = text.replace(',', '.');
    
    // Tenter de convertir en nombre
    const numValue = parseFloat(sanitizedText);
    
    // Si c'est un nombre valide, mettre à jour la valeur
    if (!isNaN(numValue)) {
      setEditedValues(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: numValue
        }
      }));
    } else if (text === '' || text === '.') {
      // Pour les champs vides ou juste un point, on met 0 comme valeur numérique
      setEditedValues(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: 0
        }
      }));
    }
  };
  
  // Gestionnaire de modification d'unité
  const handleUnitChange = (key: string, unit: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        unit
      }
    }));
  };
  
  // Enregistrer les modifications
  const saveChanges = async () => {
    if (!analysis) return;
    
    try {
      setSaving(true);
      
      // Créer une copie de l'analyse avec les valeurs modifiées
      const updatedAnalysis: BiologicalAnalysis = {
        ...analysis
      };
      
      // Appliquer toutes les modifications
      Object.entries(editedValues).forEach(([key, value]) => {
        (updatedAnalysis as any)[key] = value;
      });
      
      // Enregistrer les modifications
      await updateAnalysisUseCase.execute(updatedAnalysis);
      
      // Mettre à jour l'analyse affichée
      setAnalysis(updatedAnalysis);
      setIsEditing(false);
      Alert.alert('Success', 'Analysis updated successfully');
    } catch (err) {
      console.error('Failed to save changes:', err);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  // Annuler les modifications
  const cancelEditing = () => {
    // Réinitialiser les valeurs modifiées
    if (analysis) {
      const resetValues: Record<string, LabValue> = {};
      const resetRawInputs: Record<string, string> = {};
      
      LAB_VALUE_KEYS.forEach(key => {
        const value = (analysis as any)[key] as LabValue;
        if (value) {
          resetValues[key] = { ...value };
          resetRawInputs[key] = value.value.toString();
        } else {
          resetValues[key] = { value: 0, unit: LAB_VALUE_UNITS[key] || '' };
          resetRawInputs[key] = '0';
        }
      });
      
      setEditedValues(resetValues);
      setRawInputs(resetRawInputs);
    }
    
    setIsEditing(false);
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2c7be5" />
        <Text style={styles.loadingText}>Loading analysis details...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={loadAnalysis}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!analysis) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Analysis not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Format date as DD/MM/YYYY
  const formattedDate = analysis.date.toLocaleDateString('fr-FR');
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100} // Ajuster selon la hauteur de l'en-tête
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Details</Text>
          <Text style={styles.date}>{formattedDate}</Text>
          
          {!isEditing ? (
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Values</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={cancelEditing}
                disabled={saving}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={saveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollViewContent}
        >
          {LAB_VALUE_KEYS.map(key => {
            const displayValue = isEditing 
              ? editedValues[key] 
              : (analysis as any)[key] as LabValue | undefined;
            
            const refRange = LAB_VALUE_REFERENCE_RANGES[key];
            const isOutOfRange = displayValue && refRange && 
              (displayValue.value < refRange.min || displayValue.value > refRange.max);
            
            return (
              <View 
                key={key} 
                style={[
                  styles.labValueContainer,
                  isOutOfRange ? styles.outOfRange : null
                ]}
              >
                <Text style={styles.labValueName}>{key}</Text>
                
                <View style={styles.valueRow}>
                  {isEditing ? (
                    <>
                      <DecimalInput
                        value={rawInputs[key] || '0'}
                        onChangeText={(text) => handleValueChange(key, text)}
                        onFocus={() => {
                          // Faire défiler jusqu'à cet élément lorsqu'il reçoit le focus
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }}
                      />
                      <TextInput
                        style={styles.unitInput}
                        value={displayValue?.unit || LAB_VALUE_UNITS[key] || ''}
                        onChangeText={(text) => handleUnitChange(key, text)}
                        onFocus={() => {
                          // Faire défiler jusqu'à cet élément lorsqu'il reçoit le focus
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }}
                      />
                    </>
                  ) : (
                    <Text style={[styles.labValueText, isOutOfRange ? styles.outOfRangeText : null]}>
                      {displayValue?.value.toFixed(2)} {displayValue?.unit || LAB_VALUE_UNITS[key] || ''}
                    </Text>
                  )}
                </View>
                
                {refRange && (
                  <Text style={styles.referenceRange}>
                    Normal range: {refRange.min} - {refRange.max} {LAB_VALUE_UNITS[key] || ''}
                  </Text>
                )}
              </View>
            );
          })}
          
          {/* Espace supplémentaire en bas pour s'assurer que le dernier élément soit visible */}
          <View style={styles.spacer} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3ebf6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#12263f',
  },
  date: {
    fontSize: 16,
    color: '#95aac9',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100, // Espace supplémentaire en bas
  },
  spacer: {
    height: 100,
  },
  labValueContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  outOfRange: {
    borderLeftWidth: 4,
    borderLeftColor: '#e63757',
  },
  labValueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#12263f',
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decimalInputContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  decimalButton: {
    width: 30,
    height: 40,
    backgroundColor: '#2c7be5',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  decimalButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  labValueText: {
    fontSize: 18,
    color: '#2c7be5',
  },
  outOfRangeText: {
    color: '#e63757',
  },
  referenceRange: {
    fontSize: 12,
    color: '#95aac9',
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#12263f',
  },
  errorText: {
    fontSize: 18,
    color: '#e63757',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2c7be5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#2c7be5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#95aac9',
  },
  saveButton: {
    backgroundColor: '#00d97e',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  valueInput: {
    flex: 1,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e3ebf6',
    borderRadius: 4,
    padding: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  unitInput: {
    width: 80,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#e3ebf6',
    borderRadius: 4,
    padding: 8,
  },
});

export default AnalysisDetailsScreen; 