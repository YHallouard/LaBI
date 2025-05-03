import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnalysisCard } from '../AnalysisCard';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';

describe('AnalysisCard', () => {
  const mockAnalysis: BiologicalAnalysis = {
    id: '1',
    date: new Date('2023-10-01'),
    "Proteine C Reactive": { value: 5.5, unit: 'mg/L' },
    // Add other necessary fields if required
  };
  
  const mockAnalysisWithoutCRP: BiologicalAnalysis = {
    id: '2',
    date: new Date('2023-10-02'),
    // No Proteine C Reactive data
  };

  test('Given an AnalysisCard component When it renders Then it displays the formatted date and CRP value', () => {
    // When
    const { getByText } = render(<AnalysisCard analysis={mockAnalysis} />);

    // Then
    expect(getByText('01/10/2023')).toBeDefined();
    expect(getByText('CRP')).toBeDefined();
    expect(getByText('5.50 mg/L')).toBeDefined();
  });
  
  test('Given an AnalysisCard component without CRP data When it renders Then it displays "-.--" for the CRP value', () => {
    // When
    const { getByText } = render(<AnalysisCard analysis={mockAnalysisWithoutCRP} />);

    // Then
    expect(getByText('02/10/2023')).toBeDefined();
    expect(getByText('CRP')).toBeDefined();
    expect(getByText('-.-- mg/L')).toBeDefined();
  });

  test('Given an AnalysisCard component with onPress prop When it is pressed Then it calls the onPress function', () => {
    // Given
    const onPressMock = jest.fn();

    // When
    const { getByRole } = render(<AnalysisCard analysis={mockAnalysis} onPress={onPressMock} />);
    fireEvent.press(getByRole('button'));

    // Then
    expect(onPressMock).toHaveBeenCalledWith(mockAnalysis);
  });

  test('Given an AnalysisCard component without onPress prop When it is rendered Then it is not pressable', () => {
    // When
    const { getByRole } = render(<AnalysisCard analysis={mockAnalysis} />);

    // Then
    expect(getByRole('button').props.accessibilityState.disabled).toBe(true);
  });
}); 