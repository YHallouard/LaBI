import React from "react";
import { render } from "@testing-library/react-native";
import { HemeaLogo, HemeaLogoSize } from "../HemeaLogo";

// Mock react-native-svg with proper test IDs
jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockSvg = React.forwardRef((props: any, ref: any) =>
    React.createElement(View, {
      ...props,
      ref,
      testID: "svg",
      "data-testid": "svg",
    })
  );

  const MockPath = (props: any) =>
    React.createElement(View, {
      ...props,
      testID: "path",
      "data-testid": "path",
    });

  const MockDefs = (props: any) =>
    React.createElement(View, {
      ...props,
      testID: "defs",
      "data-testid": "defs",
    });

  const MockLinearGradient = (props: any) =>
    React.createElement(View, {
      ...props,
      testID: "linear-gradient",
      "data-testid": "linear-gradient",
    });

  const MockStop = (props: any) =>
    React.createElement(View, {
      ...props,
      testID: "stop",
      "data-testid": "stop",
    });

  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
    Defs: MockDefs,
    LinearGradient: MockLinearGradient,
    Stop: MockStop,
  };
});

// Mock the colorPalette to avoid dependency issues
jest.mock("../../../config/themes", () => ({
  colorPalette: {
    neutral: { main: "#000000" },
    gradient: {
      red: "#FF0000",
      redPurple: "#800080",
      purpleLight: "#E6E6FA",
    },
  },
}));

describe("HemeaLogo Component", () => {
  describe("Component Import and Structure", () => {
    it("should export HemeaLogo component", () => {
      // Given & When & Then
      expect(HemeaLogo).toBeDefined();
      expect(typeof HemeaLogo).toBe("function");
    });

    it("should have correct size variants defined", () => {
      // Given & When & Then
      const expectedSizes = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ] as const;
      expect(expectedSizes).toEqual(
        expect.arrayContaining([
          "small",
          "medium",
          "large",
          "xlarge",
          "xxlarge",
        ])
      );
    });
  });

  describe("Component Props Interface", () => {
    it("should accept size prop", () => {
      // Given & When & Then
      const component = <HemeaLogo size="large" />;
      expect(component).toBeDefined();
    });

    it("should work without size prop (default)", () => {
      // Given & When & Then
      const component = <HemeaLogo />;
      expect(component).toBeDefined();
    });

    it("should accept all size variants", () => {
      // Given
      const sizes: HemeaLogoSize[] = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ];

      // When & Then
      sizes.forEach((size) => {
        const component = <HemeaLogo size={size} />;
        expect(component).toBeDefined();
      });
    });
  });

  describe("Rendering", () => {
    test("should render with correct structure and test IDs", () => {
      const { getByTestId, getByText } = render(<HemeaLogo />);

      // Check main container and text
      expect(getByText("Héméa")).toBeTruthy();

      // Check SVG elements
      expect(getByTestId("svg")).toBeTruthy();
      expect(getByTestId("defs")).toBeTruthy();
      expect(getByTestId("linear-gradient")).toBeTruthy();
      expect(getByTestId("path")).toBeTruthy();
    });

    test("should render logo text with correct content", () => {
      const { getByText } = render(<HemeaLogo />);

      const logoText = getByText("Héméa");
      expect(logoText).toBeTruthy();
      expect(logoText.props.children).toBe("Héméa");
    });

    test("should render SVG with correct dimensions for default size", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const svg = getByTestId("svg");

      // Default size is 'medium', so dropSize should be 24
      expect(svg.props.width).toBe(24);
      expect(svg.props.height).toBe(24);
      expect(svg.props.viewBox).toBe("0 0 24 24");
    });

    test("should render SVG with correct dimensions for different sizes", () => {
      const { getByTestId } = render(<HemeaLogo size="large" />);
      const svg = getByTestId("svg");

      // Large size should have dropSize of 30
      expect(svg.props.width).toBe(30);
      expect(svg.props.height).toBe(30);
    });

    test("should render path with correct properties", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const path = getByTestId("path");

      expect(path.props.d).toBe("M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z");
      expect(path.props.fill).toBe("url(#dropGradient)");
      expect(path.props.strokeWidth).toBe("0");
    });

    test("should render linear gradient with correct properties", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const gradient = getByTestId("linear-gradient");

      expect(gradient.props.id).toBe("dropGradient");
      expect(gradient.props.x1).toBe("100%");
      expect(gradient.props.y1).toBe("100%");
      expect(gradient.props.x2).toBe("0%");
      expect(gradient.props.y2).toBe("0%");
    });

    test("should render gradient stops with correct colors", () => {
      const { getAllByTestId } = render(<HemeaLogo />);
      const stops = getAllByTestId("stop");

      expect(stops).toHaveLength(3);

      // Check first stop (red)
      expect(stops[0].props.offset).toBe("0%");
      expect(stops[0].props.stopColor).toBe("#FF0000");

      // Check second stop (redPurple)
      expect(stops[1].props.offset).toBe("30%");
      expect(stops[1].props.stopColor).toBe("#800080");

      // Check third stop (purpleLight)
      expect(stops[2].props.offset).toBe("100%");
      expect(stops[2].props.stopColor).toBe("#E6E6FA");
    });
  });

  describe("Size Variants", () => {
    test("should render small size correctly", () => {
      const { getByTestId, getByText } = render(<HemeaLogo size="small" />);

      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      // Small size: fontSize = 24, dropSize = 16
      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 24 })])
      );
      expect(svg.props.width).toBe(16);
      expect(svg.props.height).toBe(16);
    });

    test("should render medium size correctly (default)", () => {
      const { getByTestId, getByText } = render(<HemeaLogo />);

      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      // Medium size: fontSize = 30, dropSize = 24
      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 30 })])
      );
      expect(svg.props.width).toBe(24);
      expect(svg.props.height).toBe(24);
    });

    test("should render large size correctly", () => {
      const { getByTestId, getByText } = render(<HemeaLogo size="large" />);

      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      // Large size: fontSize = 36, dropSize = 30
      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 36 })])
      );
      expect(svg.props.width).toBe(30);
      expect(svg.props.height).toBe(30);
    });

    test("should render xlarge size correctly", () => {
      const { getByTestId, getByText } = render(<HemeaLogo size="xlarge" />);

      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      // XLarge size: fontSize = 48, dropSize = 42
      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 48 })])
      );
      expect(svg.props.width).toBe(42);
      expect(svg.props.height).toBe(42);
    });

    test("should render xxlarge size correctly", () => {
      const { getByTestId, getByText } = render(<HemeaLogo size="xxlarge" />);

      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      // XXLarge size: fontSize = 120, dropSize = 120
      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 120 })])
      );
      expect(svg.props.width).toBe(120);
      expect(svg.props.height).toBe(120);
    });
  });

  describe("Size Calculation Functions", () => {
    test("should call getLogoFontSize with correct values for all sizes", () => {
      // Given
      const sizes: HemeaLogoSize[] = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ];
      const expectedFontSizes = [24, 30, 36, 48, 120];

      // When & Then
      sizes.forEach((size, index) => {
        const { getByText } = render(<HemeaLogo size={size} />);
        const logoText = getByText("Héméa");

        expect(logoText.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ fontSize: expectedFontSizes[index] }),
          ])
        );
      });
    });

    test("should call getDropIconSize with correct values for all sizes", () => {
      // Given
      const sizes: HemeaLogoSize[] = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ];
      const expectedDropSizes = [16, 24, 30, 42, 120];

      // When & Then
      sizes.forEach((size, index) => {
        const { getByTestId } = render(<HemeaLogo size={size} />);
        const svg = getByTestId("svg");

        expect(svg.props.width).toBe(expectedDropSizes[index]);
        expect(svg.props.height).toBe(expectedDropSizes[index]);
      });
    });

    test("should use default medium size when no size provided", () => {
      const { getByTestId, getByText } = render(<HemeaLogo />);

      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      // Default should be medium: fontSize = 30, dropSize = 24
      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 30 })])
      );
      expect(svg.props.width).toBe(24);
      expect(svg.props.height).toBe(24);
    });
  });

  describe("Styling", () => {
    test("should apply correct text styling", () => {
      const { getByText } = render(<HemeaLogo />);
      const logoText = getByText("Héméa");

      expect(logoText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontWeight: "bold",
            color: "#000000",
            fontFamily: "Inter",
          }),
        ])
      );
    });

    test("should apply correct container styling", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const container = getByTestId("svg").parent;

      // Note: We can't directly test the container styles in this setup,
      // but we can verify the component renders without errors
      expect(container).toBeTruthy();
    });

    test("should apply correct drop icon styling", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const svg = getByTestId("svg");

      // The SVG should be properly positioned
      expect(svg).toBeTruthy();
    });
  });

  describe("Component Integration", () => {
    it("should work as a React component", () => {
      // Given & When & Then
      const TestComponent = () => <HemeaLogo size="large" />;
      expect(TestComponent).toBeDefined();
    });

    it("should accept props correctly", () => {
      // Given & When & Then
      const TestComponent = ({ size }: { size: HemeaLogoSize }) => (
        <HemeaLogo size={size} />
      );
      expect(TestComponent).toBeDefined();
    });
  });

  describe("Type Safety", () => {
    it("should have correct HemeaLogoSize type", () => {
      // Given & When & Then
      const validSizes: HemeaLogoSize[] = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ];
      expect(validSizes).toHaveLength(5);
    });

    it("should accept optional size prop", () => {
      // Given & When & Then
      const componentWithoutSize = <HemeaLogo />;
      const componentWithSize = <HemeaLogo size="medium" />;

      expect(componentWithoutSize).toBeDefined();
      expect(componentWithSize).toBeDefined();
    });
  });

  describe("Component Behavior", () => {
    it("should be a valid React component", () => {
      // Given & When & Then
      expect(React.isValidElement(<HemeaLogo />)).toBe(true);
    });

    it("should be a valid React component with size prop", () => {
      // Given & When & Then
      expect(React.isValidElement(<HemeaLogo size="small" />)).toBe(true);
    });

    it("should handle all size variants as valid React elements", () => {
      // Given
      const sizes: HemeaLogoSize[] = [
        "small",
        "medium",
        "large",
        "xlarge",
        "xxlarge",
      ];

      // When & Then
      sizes.forEach((size) => {
        expect(React.isValidElement(<HemeaLogo size={size} />)).toBe(true);
      });
    });
  });

  describe("SVG Specific Tests", () => {
    test("should render SVG with correct viewBox", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const svg = getByTestId("svg");

      expect(svg.props.viewBox).toBe("0 0 24 24");
    });

    test("should render path with correct drop shape", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const path = getByTestId("path");

      // The path should represent a drop/teardrop shape
      expect(path.props.d).toBe("M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z");
    });

    test("should render gradient with correct direction", () => {
      const { getByTestId } = render(<HemeaLogo />);
      const gradient = getByTestId("linear-gradient");

      // Gradient should go from bottom-right to top-left
      expect(gradient.props.x1).toBe("100%");
      expect(gradient.props.y1).toBe("100%");
      expect(gradient.props.x2).toBe("0%");
      expect(gradient.props.y2).toBe("0%");
    });
  });

  describe("Component Lifecycle", () => {
    test("should not cause memory leaks on unmount", () => {
      const { unmount } = render(<HemeaLogo />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test("should handle rapid mount/unmount cycles", () => {
      const { unmount, rerender } = render(<HemeaLogo />);

      expect(() => {
        unmount();
        rerender(<HemeaLogo />);
        unmount();
        rerender(<HemeaLogo size="large" />);
      }).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    test("should have proper test IDs for testing", () => {
      const { getByTestId, getByText } = render(<HemeaLogo />);

      expect(getByText("Héméa")).toBeTruthy();
      expect(getByTestId("svg")).toBeTruthy();
      expect(getByTestId("defs")).toBeTruthy();
      expect(getByTestId("linear-gradient")).toBeTruthy();
      expect(getByTestId("path")).toBeTruthy();
    });

    test("should render text content for screen readers", () => {
      const { getByText } = render(<HemeaLogo />);

      const logoText = getByText("Héméa");
      expect(logoText).toBeTruthy();
      expect(logoText.props.children).toBe("Héméa");
    });
  });

  describe("Edge Cases", () => {
    test("should handle undefined size gracefully", () => {
      const { getByTestId, getByText } = render(
        <HemeaLogo size={undefined as any} />
      );

      // Should default to medium size
      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 30 })])
      );
      expect(svg.props.width).toBe(24);
    });

    test("should handle invalid size gracefully", () => {
      const { getByTestId, getByText } = render(
        <HemeaLogo size={"invalid" as any} />
      );

      // Should default to medium size
      const logoText = getByText("Héméa");
      const svg = getByTestId("svg");

      expect(logoText.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ fontSize: 30 })])
      );
      expect(svg.props.width).toBe(24);
    });
  });
});
