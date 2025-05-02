import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { ScreenLayout } from '../ScreenLayout';

describe('ScreenLayout', () => {
  test('Given a ScreenLayout component When it renders with children Then the children are visible', () => {
    // Given
    const testId = 'test-child';
    const testText = 'Test Child';
    
    // When
    const { getByTestId } = render(
      <ScreenLayout>
        <View testID={testId}>
          <Text>{testText}</Text>
        </View>
      </ScreenLayout>
    );
    
    // Then
    expect(getByTestId(testId)).toBeDefined();
  });
  
  test('Given a ScreenLayout component When it has scrollable=true and onRefresh prop Then it renders a ScrollView with RefreshControl', () => {
    // Given
    const onRefreshMock = jest.fn();
    
    // When
    const { getByTestId } = render(
      <ScreenLayout scrollable={true} refreshing={false} onRefresh={onRefreshMock}>
        <Text>Content</Text>
      </ScreenLayout>
    );
    
    // Then
    const scrollView = getByTestId('scroll-view');
    expect(scrollView).toBeDefined();
    
    // Simulate pull to refresh
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: -100 },
        contentSize: { height: 500, width: 100 },
        layoutMeasurement: { height: 100, width: 100 }
      }
    });
    
    // Check if onRefresh was called
    expect(onRefreshMock).toHaveBeenCalled();
  });
  
  test('Given a ScreenLayout component When backgroundColor is provided Then the container has the correct background color', () => {
    // Given
    const backgroundColor = '#ff0000';
    
    // When
    const { getByTestId } = render(
      <ScreenLayout backgroundColor={backgroundColor}>
        <Text>Content</Text>
      </ScreenLayout>
    );
    
    // Then
    const safeAreaView = getByTestId('safe-area-view');
    expect(safeAreaView.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor })
      ])
    );
  });
}); 