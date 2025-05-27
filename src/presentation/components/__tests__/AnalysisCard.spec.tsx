import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnalysisCard } from '../AnalysisCard';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';

describe('AnalysisCard', () => {
  const mockAnalysis: BiologicalAnalysis = {
    id: '1',
    date: new Date('2023-10-01'),
    "Protéine C Reactive": { value: 5.5, unit: 'mg/L' },
    // Add other necessary fields if required
  };
  
  const mockAnalysisWithoutCRP: BiologicalAnalysis = {
    id: '2',
    date: new Date('2023-10-02'),
    // No Protéine C Reactive data
  };

  test('Given an AnalysisCard component When it renders Then it displays the formatted date and out-of-range count', () => {
    // When
    const { getByText } = render(<AnalysisCard analysis={mockAnalysis} />);

    // Then
    expect(getByText('01/10/2023')).toBeDefined();
    expect(getByText('1')).toBeDefined(); // out-of-range count (CRP value 5.5 is above range of 0-5)
  });
  
  test('Given an AnalysisCard component without any out-of-range values When it renders Then it displays "0"', () => {
    // When
    const { getByText } = render(<AnalysisCard analysis={mockAnalysisWithoutCRP} />);

    // Then
    expect(getByText('02/10/2023')).toBeDefined();
    expect(getByText('0')).toBeDefined(); // no out-of-range values
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