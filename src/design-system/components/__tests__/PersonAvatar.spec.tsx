import React from 'react';
import { render } from '@testing-library/react-native';
import { PersonAvatar } from '../PersonAvatar';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: (props: any) =>
      React.createElement(View, { testID: 'linear-gradient', ...props }),
  };
});

describe('PersonAvatar', () => {
  describe('given no imageUri', () => {
    it('when name is provided, then renders initials', () => {
      const { getByText } = render(<PersonAvatar name="Yann Hallouard" />);
      expect(getByText('YH')).toBeTruthy();
    });

    it('when name is undefined, then renders fallback initials', () => {
      const { getByText } = render(<PersonAvatar />);
      expect(getByText('?')).toBeTruthy();
    });

    it('when single word name, then renders single initial', () => {
      const { getByText } = render(<PersonAvatar name="Yann" />);
      expect(getByText('Y')).toBeTruthy();
    });
  });

  describe('given imageUri is provided', () => {
    it('when imageUri is set, then renders Image instead of initials', () => {
      const { queryByText, UNSAFE_getByType } = render(
        <PersonAvatar name="Yann Hallouard" imageUri="file:///photo.jpg" />
      );
      const { Image } = require('react-native');
      expect(UNSAFE_getByType(Image)).toBeTruthy();
      expect(queryByText('YH')).toBeNull();
    });

    it('when imageUri is set, then Image has correct uri source', () => {
      const uri = 'file:///photo.jpg';
      const { UNSAFE_getByType } = render(
        <PersonAvatar name="Yann" imageUri={uri} />
      );
      const { Image } = require('react-native');
      const image = UNSAFE_getByType(Image);
      expect(image.props.source).toEqual({ uri });
    });

    it('when imageUri is set, then gradient border is still rendered', () => {
      const { getByTestId } = render(
        <PersonAvatar name="Yann" imageUri="file:///photo.jpg" />
      );
      expect(getByTestId('linear-gradient')).toBeTruthy();
    });
  });

  describe('given size prop', () => {
    it('when size is provided, then outer container uses that size', () => {
      const { getByTestId } = render(<PersonAvatar name="AB" size={80} />);
      const gradient = getByTestId('linear-gradient');
      expect(gradient.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: 80, height: 80 }),
        ])
      );
    });
  });
});
