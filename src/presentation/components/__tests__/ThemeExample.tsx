import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../Button';
import { colorPalette } from '../../../config/themes';
import { Ionicons } from '@expo/vector-icons';

export const ThemeExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Theme Colors</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Colors</Text>
        <View style={styles.colorRow}>
          <ColorSwatch color={colorPalette.primary.main} name="Main" />
          <ColorSwatch color={colorPalette.primary.light} name="Light" />
          <ColorSwatch color={colorPalette.primary.dark} name="Dark" />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Secondary Colors</Text>
        <View style={styles.colorRow}>
          <ColorSwatch color={colorPalette.secondary.main} name="Main" />
          <ColorSwatch color={colorPalette.secondary.light} name="Light" />
          <ColorSwatch color={colorPalette.secondary.dark} name="Dark" />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gradient Colors</Text>
        <View style={styles.colorRow}>
          <ColorSwatch color={colorPalette.gradient.red} name="Red" />
          <ColorSwatch color={colorPalette.gradient.redPurple} name="Red Purple" />
          <ColorSwatch color={colorPalette.gradient.purple} name="Purple" />
          <ColorSwatch color={colorPalette.gradient.purpleLight} name="Purple Light" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button Variants</Text>
        
        <View style={styles.buttonRow}>
          <Button title="Primary" variant="primary" style={styles.buttonExample} />
          <Button title="Secondary" variant="secondary" style={styles.buttonExample} />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Outline" variant="outline" style={styles.buttonExample} />
          <Button title="Disabled" disabled style={styles.buttonExample} />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Success" variant="success" style={styles.buttonExample} />
          <Button title="Danger" variant="danger" style={styles.buttonExample} />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Info" variant="info" style={styles.buttonExample} />
          <Button 
            title="With Icon" 
            variant="primary" 
            style={styles.buttonExample} 
            leftIcon={<Ionicons name="star" size={16} color="white" />} 
          />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Small" size="small" style={styles.buttonExample} />
          <Button title="Medium" size="medium" style={styles.buttonExample} />
          <Button title="Large" size="large" style={styles.buttonExample} />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Loading" loading style={styles.buttonExample} />
        </View>
      </View>
    </ScrollView>
  );
};

interface ColorSwatchProps {
  color: string;
  name: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, name }) => (
  <View style={styles.colorSwatch}>
    <View style={[styles.colorCircle, { backgroundColor: color }]} />
    <Text style={styles.colorName}>{name}</Text>
    <Text style={styles.colorHex}>{color}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colorPalette.neutral.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colorPalette.neutral.main,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: colorPalette.neutral.main,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorSwatch: {
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 15,
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: colorPalette.neutral.lighter,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '500',
    color: colorPalette.neutral.main,
  },
  colorHex: {
    fontSize: 12,
    color: colorPalette.neutral.light,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  buttonExample: {
    marginRight: 10,
    marginBottom: 10,
  },
}); 