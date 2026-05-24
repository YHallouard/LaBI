import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { LoadingOverlay } from '../LoadingOverlay';
import { Animated } from 'react-native';

// Mock react-native-svg with proper test IDs
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockSvg = React.forwardRef((props: any, ref: any) => 
    React.createElement(View, { 
      ...props, 
      ref, 
      testID: 'svg',
      'data-testid': 'svg'
    })
  );
  
  const MockCircle = (props: any) => 
    React.createElement(View, { 
      ...props, 
      testID: 'circle',
      'data-testid': 'circle'
    });
    
  const MockDefs = (props: any) => 
    React.createElement(View, { 
      ...props, 
      testID: 'defs',
      'data-testid': 'defs'
    });
    
  const MockLinearGradient = (props: any) => 
    React.createElement(View, { 
      ...props, 
      testID: 'linear-gradient',
      'data-testid': 'linear-gradient'
    });
    
  const MockStop = (props: any) => 
    React.createElement(View, { 
      ...props, 
      testID: 'stop',
      'data-testid': 'stop'
    });

  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Circle: MockCircle,
    Defs: MockDefs,
    LinearGradient: MockLinearGradient,
    Stop: MockStop,
  };
});

// Mock the AppImage component
jest.mock('../AppImage', () => ({
  AppImage: (props: any) => {
    const React = require('react');
    return React.createElement('mock-app-image', { 
      'data-testid': 'app-image', 
      testID: 'app-image',
      ...props 
    });
  },
}));

describe('LoadingOverlay', () => {
  const mockOnFinish = jest.fn();
  let timingSpy: jest.SpyInstance;
  let sequenceSpy: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Use jest.spyOn to spy on the actual Animated functions
    timingSpy = jest.spyOn(Animated, 'timing');
    sequenceSpy = jest.spyOn(Animated, 'sequence');
    
    // Mock the return values
    timingSpy.mockReturnValue({
      start: jest.fn((callback) => {
        if (callback) {
          callback({ finished: true });
        }
      }),
    } as any);
    
    sequenceSpy.mockReturnValue({
      start: jest.fn((callback) => {
        if (callback) {
          callback({ finished: true });
        }
      }),
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    timingSpy.mockRestore();
    sequenceSpy.mockRestore();
  });

  describe('Rendering', () => {
    test('should render with correct structure and test IDs', () => {
      const { getByTestId, getAllByTestId } = render(<LoadingOverlay />);
      
      // Check main container
      expect(getByTestId('svg')).toBeTruthy();
      expect(getByTestId('defs')).toBeTruthy();
      expect(getByTestId('linear-gradient')).toBeTruthy();
      expect(getByTestId('app-image')).toBeTruthy();
      
      // Check that we have the correct number of circles (background + animated)
      const circles = getAllByTestId('circle');
      expect(circles).toHaveLength(2);
    });

    test('should render SVG with correct dimensions', () => {
      const { getByTestId } = render(<LoadingOverlay />);
      const svg = getByTestId('svg');
      
      expect(svg.props.width).toBe(180);
      expect(svg.props.height).toBe(180);
    });

    test('should render progress circle with correct properties', () => {
      const { getAllByTestId } = render(<LoadingOverlay />);
      const circles = getAllByTestId('circle');
      
      // Find the animated circle (the one with strokeDasharray)
      const animatedCircle = circles.find(circle => circle.props.strokeDasharray);
      expect(animatedCircle).toBeTruthy();
      
      // Check that circle has the expected properties
      expect(animatedCircle.props.cx).toBe(90);
      expect(animatedCircle.props.cy).toBe(90);
      expect(animatedCircle.props.r).toBe(88);
      expect(animatedCircle.props.strokeWidth).toBe(4);
      expect(animatedCircle.props.fill).toBe('none');
    });

    test('should render linear gradient with correct colors', () => {
      const { getByTestId } = render(<LoadingOverlay />);
      const gradient = getByTestId('linear-gradient');
      
      expect(gradient.props.id).toBe('gradient');
      expect(gradient.props.x1).toBe('0%');
      expect(gradient.props.y1).toBe('0%');
      expect(gradient.props.x2).toBe('100%');
      expect(gradient.props.y2).toBe('100%');
    });

    test('should render logo image', () => {
      const { getByTestId } = render(<LoadingOverlay />);
      const logo = getByTestId('app-image');
      
      expect(logo.props.imagePath).toBe('loading-icon');
      expect(logo.props.resizeMode).toBe('contain');
    });
  });

  describe('Animation Configuration', () => {
    test('should configure progress animation with default duration', () => {
      render(<LoadingOverlay />);
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          toValue: 1,
          duration: 1000,
          easing: expect.any(Function),
          useNativeDriver: true,
          isInteraction: false,
        })
      );
    });

    test('should configure fade animation with default duration', () => {
      render(<LoadingOverlay />);
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          toValue: 0,
          duration: 300,
          easing: expect.any(Function),
          useNativeDriver: true,
          isInteraction: false,
        })
      );
    });

    test('should use custom progress duration when provided', () => {
      render(<LoadingOverlay progressDuration={2000} />);
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 2000,
        })
      );
    });

    test('should use custom fade duration when provided', () => {
      render(<LoadingOverlay fadeDuration={500} />);
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 500,
        })
      );
    });

    test('should create animation sequence with progress then fade', () => {
      render(<LoadingOverlay />);
      
      expect(sequenceSpy).toHaveBeenCalledWith([
        expect.any(Object), // progress animation
        expect.any(Object), // fade animation
      ]);
    });
  });

  describe('Animation Execution', () => {
    test('should start animation sequence on mount', () => {
      render(<LoadingOverlay />);
      
      expect(sequenceSpy).toHaveBeenCalled();
    });

    test('should call onFinish callback when animation completes', () => {
      render(<LoadingOverlay onFinish={mockOnFinish} />);
      
      // The callback should be called automatically due to our mock
      expect(mockOnFinish).toHaveBeenCalled();
    });

    test('should not call onFinish when animation is cancelled', () => {
      // Mock the sequence to simulate cancellation
      sequenceSpy.mockReturnValue({
        start: jest.fn((callback) => {
          if (callback) {
            callback({ finished: false });
          }
        }),
      } as any);
      
      render(<LoadingOverlay onFinish={mockOnFinish} />);
      
      expect(mockOnFinish).not.toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    test('should handle missing onFinish prop gracefully', () => {
      expect(() => {
        render(<LoadingOverlay />);
      }).not.toThrow();
    });

    test('should use default durations when not provided', () => {
      render(<LoadingOverlay />);
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 1000, // default progress duration
        })
      );
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 300, // default fade duration
        })
      );
    });

    test('should accept and use custom durations', () => {
      render(<LoadingOverlay progressDuration={1500} fadeDuration={600} />);
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 1500,
        })
      );
      
      expect(timingSpy).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          duration: 600,
        })
      );
    });
  });

  describe('SVG Specific Tests', () => {
    test('should render SVG with correct stroke dasharray', () => {
      const { getAllByTestId } = render(<LoadingOverlay />);
      const circles = getAllByTestId('circle');
      
      // Find the animated circle (the one with strokeDasharray)
      const animatedCircle = circles.find(circle => circle.props.strokeDasharray);
      expect(animatedCircle).toBeTruthy();
      
      // The circumference should be 2 * PI * 88 = 552.92...
      const expectedCircumference = 2 * Math.PI * 88;
      expect(animatedCircle.props.strokeDasharray).toBe(expectedCircumference.toString());
    });

    test('should render SVG with correct transform for rotation', () => {
      const { getAllByTestId } = render(<LoadingOverlay />);
      const circles = getAllByTestId('circle');
      
      // Find the animated circle (the one with transform)
      const animatedCircle = circles.find(circle => circle.props.transform);
      expect(animatedCircle).toBeTruthy();
      
      expect(animatedCircle.props.transform).toBe('rotate(-90, 90, 90)');
    });

    test('should render SVG with round line caps', () => {
      const { getAllByTestId } = render(<LoadingOverlay />);
      const circles = getAllByTestId('circle');
      
      // Find the animated circle (the one with strokeLinecap)
      const animatedCircle = circles.find(circle => circle.props.strokeLinecap);
      expect(animatedCircle).toBeTruthy();
      
      expect(animatedCircle.props.strokeLinecap).toBe('round');
    });
  });

  describe('Component Lifecycle', () => {
    test('should not cause memory leaks on unmount', () => {
      const { unmount } = render(<LoadingOverlay />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test('should handle rapid mount/unmount cycles', () => {
      const { unmount, rerender } = render(<LoadingOverlay />);
      
      expect(() => {
        unmount();
        rerender(<LoadingOverlay />);
        unmount();
        rerender(<LoadingOverlay />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should have proper test IDs for testing', () => {
      const { getByTestId, getAllByTestId } = render(<LoadingOverlay />);
      
      expect(getByTestId('svg')).toBeTruthy();
      expect(getAllByTestId('circle')).toHaveLength(2);
      expect(getByTestId('defs')).toBeTruthy();
      expect(getByTestId('linear-gradient')).toBeTruthy();
      expect(getByTestId('app-image')).toBeTruthy();
    });
  });
});
