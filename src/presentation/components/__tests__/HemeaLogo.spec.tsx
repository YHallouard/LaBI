import React from 'react';
import renderer from 'react-test-renderer';
import { HemeaLogo } from '../HemeaLogo';

describe('HemeaLogo Component', () => {
  it('should render correctly with default size', () => {
    // Given & When
    const tree = renderer.create(<HemeaLogo />).toJSON();
    
    // Then
    expect(tree).toMatchSnapshot();
  });

  it('should render correctly with small size', () => {
    // Given & When  
    const tree = renderer.create(<HemeaLogo size="small" />).toJSON();
    
    // Then
    expect(tree).toMatchSnapshot();
  });

  it('should render correctly with large size', () => {
    // Given & When
    const tree = renderer.create(<HemeaLogo size="large" />).toJSON();
    
    // Then
    expect(tree).toMatchSnapshot();
  });
}); 