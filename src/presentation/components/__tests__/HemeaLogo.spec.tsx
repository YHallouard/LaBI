import React from 'react';
import { render } from '@testing-library/react-native';
import { HemeaLogo } from '../HemeaLogo';

describe('HemeaLogo Component', () => {
  it('should render correctly with default size', () => {
    // Given
    const { getByText, getByTestId } = render(<HemeaLogo />);

    // When
    const logoText = getByText('Héméa');
    const dropIcon = getByTestId('water-icon');

    // Then
    expect(logoText).toBeTruthy();
    expect(dropIcon).toBeTruthy();
  });

  it('should render correctly with small size', () => {
    // Given
    const { getByText, getByTestId } = render(<HemeaLogo size="small" />);

    // When
    const logoText = getByText('Héméa');
    const dropIcon = getByTestId('water-icon');

    // Then
    expect(logoText).toBeTruthy();
    expect(dropIcon).toBeTruthy();
  });

  it('should render correctly with large size', () => {
    // Given
    const { getByText, getByTestId } = render(<HemeaLogo size="large" />);

    // When
    const logoText = getByText('Héméa');
    const dropIcon = getByTestId('water-icon');

    // Then
    expect(logoText).toBeTruthy();
    expect(dropIcon).toBeTruthy();
  });
}); 