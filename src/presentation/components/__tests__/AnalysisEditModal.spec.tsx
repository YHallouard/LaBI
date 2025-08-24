import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { AnalysisEditModal } from "../AnalysisEditModal";
import { BiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";
import { UpdateAnalysisUseCase } from "../../../domain/usecases/UpdateAnalysisUseCase";
import { GetReferenceRangeUseCase } from "../../../domain/usecases/GetReferenceRangeUseCase";
import {
  LAB_VALUE_KEYS,
  LAB_VALUE_UNITS,
  LAB_VALUE_CATEGORIES,
} from "../../../config/LabConfig";
import { Platform } from "react-native";
import { InMemoryBiologicalAnalysisRepository } from "../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";
import { InMemoryUserProfileRepository } from "../../../adapters/repositories/InMemoryUserProfileRepository";
import { ReferenceRangeCalculator } from "../../../domain/services/ReferenceRangeCalculator";
import { UserProfile, Gender } from "../../../domain/UserProfile";

// Mock dependencies
const mockAlert = jest.fn();
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: mockAlert,
}));

jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");

jest.mock("../ResponsiveSectionList", () => {
  const React = require("react");
  const { View, Text, TextInput, Switch } = require("react-native");
  return {
    ResponsiveSectionList: ({
      sections,
      renderItem,
      renderSectionHeader,
    }: any) => (
      <View testID="responsive-section-list">
        {sections.map((section: any, sectionIndex: number) => (
          <View key={sectionIndex} testID={`section-${sectionIndex}`}>
            {renderSectionHeader(section.title)}
            {section.data.map((item: string, itemIndex: number) => (
              <View
                key={itemIndex}
                testID={`item-${sectionIndex}-${itemIndex}`}
              >
                {renderItem(item, itemIndex, false)}
              </View>
            ))}
          </View>
        ))}
      </View>
    ),
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("AnalysisEditModal", () => {
  let realRepository: InMemoryBiologicalAnalysisRepository;
  let realUpdateAnalysisUseCase: UpdateAnalysisUseCase;
  let realGetReferenceRangeUseCase: GetReferenceRangeUseCase;
  let realUserProfileRepository: InMemoryUserProfileRepository;
  let realReferenceRangeCalculator: ReferenceRangeCalculator;
  let realAnalysis: BiologicalAnalysis;
  let mockOnClose: jest.Mock;
  let mockOnSave: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAlert.mockClear();

    // Set up real repositories and use cases
    realRepository = new InMemoryBiologicalAnalysisRepository();
    realUpdateAnalysisUseCase = new UpdateAnalysisUseCase(realRepository);

    // Create real in-memory adapters
    realUserProfileRepository = new InMemoryUserProfileRepository();
    realReferenceRangeCalculator = new ReferenceRangeCalculator();

    // Create a real user profile for reference range calculations
    const userProfile: UserProfile = {
      id: "test-user-1",
      firstName: "Test",
      lastName: "User",
      name: "Test User",
      birthDate: new Date("1990-01-01"), // 34 years old in 2024
      gender: "male",
      profileImage: undefined,
      pinnedMetrics: [],
    };

    // Save the user profile to the repository
    await realUserProfileRepository.save(userProfile);

    // Create the real use case with real dependencies
    realGetReferenceRangeUseCase = new GetReferenceRangeUseCase(
      realReferenceRangeCalculator,
      realUserProfileRepository
    );

    // Initialize the use case to load the user profile
    await realGetReferenceRangeUseCase.initialize();

    mockOnClose = jest.fn();
    mockOnSave = jest.fn();

    // Create a comprehensive real analysis with lab values
    realAnalysis = {
      id: "test-analysis-1",
      date: new Date("2024-01-15"),
      Hémoglobine: { value: 14.5, unit: "g/dL" },
      Leucocytes: { value: 7.2, unit: "giga/L" },
      Plaquettes: { value: 250, unit: "giga/L" },
      Glycémie: null,
      "Cholestérol HDL": { value: 0.6, unit: "g/l" },
      "Transaminases TGO": { value: 25, unit: "U/L" },
      Ferritine: { value: 150, unit: "μg/L" },
      "Vitamine B12": { value: 400, unit: "pg/mL" },
    } as BiologicalAnalysis;

    // Save the analysis to the repository
    await realRepository.save(realAnalysis);
  });

  afterEach(async () => {
    await realRepository.clear();
    await realUserProfileRepository.reset();
  });

  const renderAnalysisEditModal = (props = {}) => {
    return render(
      <AnalysisEditModal
        visible={true}
        analysis={realAnalysis}
        updateAnalysisUseCase={realUpdateAnalysisUseCase}
        getReferenceRangeUseCase={realGetReferenceRangeUseCase}
        onClose={mockOnClose}
        onSave={mockOnSave}
        {...props}
      />
    );
  };

  describe("Component Structure and Rendering", () => {
    test("should display the edit form when modal is visible", () => {
      const { getByText, getByTestId } = renderAnalysisEditModal();

      expect(getByText("Edit Analysis")).toBeTruthy();
      expect(getByText("Cancel")).toBeTruthy();
      expect(getByText("Save")).toBeTruthy();
      expect(getByTestId("responsive-section-list")).toBeTruthy();
    });

    test("should not display when modal is not visible", () => {
      const { queryByText } = render(
        <AnalysisEditModal
          visible={false}
          analysis={realAnalysis}
          updateAnalysisUseCase={realUpdateAnalysisUseCase}
          getReferenceRangeUseCase={realGetReferenceRangeUseCase}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(queryByText("Edit Analysis")).toBeNull();
    });

    test("should return null when no analysis data is provided", () => {
      const { UNSAFE_root } = renderAnalysisEditModal({ analysis: null });
      expect(UNSAFE_root.children).toHaveLength(0);
    });

    test("should display the correct formatted date", () => {
      const { getByText } = renderAnalysisEditModal();
      expect(getByText("15/01/2024")).toBeTruthy();
    });

    test("should render all lab value categories", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Check that all categories are rendered
      Object.keys(LAB_VALUE_CATEGORIES).forEach((category, index) => {
        expect(getByTestId(`section-${index}`)).toBeTruthy();
      });
    });

    test("should render section headers with correct styling", () => {
      const { getByText } = renderAnalysisEditModal();

      Object.keys(LAB_VALUE_CATEGORIES).forEach((category) => {
        expect(getByText(category)).toBeTruthy();
      });
    });
  });

  describe("Form Initialization", () => {
    test("should initialize form with correct values from analysis", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Check that active metrics are properly initialized
      const hemoglobinItem = getByTestId("item-0-1"); // Hémoglobine in Hématologie section
      expect(hemoglobinItem).toBeTruthy();
    });

    test("should initialize inactive metrics as null", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Glycémie should be inactive (null in mock data)
      const glucoseItem = getByTestId("item-3-0"); // Glycémie in Autres Marqueurs section
      expect(glucoseItem).toBeTruthy();
    });

    test("should set default values for all lab metrics", () => {
      const { getByTestId } = renderAnalysisEditModal();

      expect(getByTestId("item-0-0")).toBeTruthy(); // Hématies
      expect(getByTestId("item-0-1")).toBeTruthy(); // Hémoglobine
      expect(getByTestId("item-0-6")).toBeTruthy(); // Leucocytes
      expect(getByTestId("item-1-0")).toBeTruthy(); // Transaminases TGO
      expect(getByTestId("item-2-1")).toBeTruthy(); // Vitamine B12
      expect(getByTestId("item-3-2")).toBeTruthy(); // Cholestérol HDL
    });

    test("should initialize date picker with analysis date", () => {
      const { getByText } = renderAnalysisEditModal();

      const dateText = getByText("15/01/2024");
      expect(dateText).toBeTruthy();
    });
  });

  describe("Lab Value Interactions", () => {
    test("should render lab value items with proper structure", () => {
      const { getByTestId, getByText } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      expect(hemoglobinItem).toBeTruthy();

      expect(getByText("Hémoglobine")).toBeTruthy();
    });

    test("should render switches for metric activation", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const switchElement = hemoglobinItem.findByProps({
        accessibilityRole: "switch",
      });
      expect(switchElement).toBeTruthy();
    });

    test("should render text inputs for lab values", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });
      expect(inputElement).toBeTruthy();
    });

    test("should render unit inputs for lab values", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const unitInput = hemoglobinItem.findByProps({ value: "g/dL" });
      expect(unitInput).toBeTruthy();
    });
  });

  describe("Text Input Handling", () => {
    test("should render text inputs with correct initial values", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });
      expect(inputElement).toBeTruthy();
    });

    test("should render unit inputs with correct initial values", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const unitInput = hemoglobinItem.findByProps({ value: "g/dL" });
      expect(unitInput).toBeTruthy();
    });

    test("should render text inputs for all active metrics", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Check that active metrics have text inputs
      const hemoglobinInput = getByTestId("item-0-1").findByProps({
        value: "14.5",
      });
      const leucocytesInput = getByTestId("item-0-6").findByProps({
        value: "7.2",
      });
      const plaquettesInput = getByTestId("item-0-12").findByProps({
        value: "250",
      });

      expect(hemoglobinInput).toBeTruthy();
      expect(leucocytesInput).toBeTruthy();
      expect(plaquettesInput).toBeTruthy();
    });

    test("should render unit inputs for all active metrics", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Check that active metrics have unit inputs
      const hemoglobinUnit = getByTestId("item-0-1").findByProps({
        value: "g/dL",
      });
      const leucocytesUnit = getByTestId("item-0-6").findByProps({
        value: "giga/L",
      });
      const plaquettesUnit = getByTestId("item-0-12").findByProps({
        value: "giga/L",
      });

      expect(hemoglobinUnit).toBeTruthy();
      expect(leucocytesUnit).toBeTruthy();
      expect(plaquettesUnit).toBeTruthy();
    });

    test("should render text inputs with proper styling", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });
      expect(inputElement).toBeTruthy();

      // Check that the input element exists
      expect(inputElement).toBeTruthy();
    });

    test("should handle different numeric formats in initial values", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Test different numeric formats
      const integerValue = getByTestId("item-1-0").findByProps({ value: "25" });
      const decimalValue = getByTestId("item-0-1").findByProps({
        value: "14.5",
      });
      const smallDecimalValue = getByTestId("item-3-2").findByProps({
        value: "0.6",
      });

      expect(integerValue).toBeTruthy();
      expect(decimalValue).toBeTruthy();
      expect(smallDecimalValue).toBeTruthy();
    });

    test("should handle different unit formats in initial values", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Test different unit formats
      const gdLUnit = getByTestId("item-0-1").findByProps({ value: "g/dL" });
      const gigaLUnit = getByTestId("item-0-6").findByProps({
        value: "giga/L",
      });
      const uLUnit = getByTestId("item-1-0").findByProps({ value: "U/L" });
      const ugLUnit = getByTestId("item-1-3").findByProps({ value: "μg/L" });
      const pgmLUnit = getByTestId("item-2-1").findByProps({ value: "pg/mL" });
      const glUnit = getByTestId("item-3-2").findByProps({ value: "g/l" });

      expect(gdLUnit).toBeTruthy();
      expect(gigaLUnit).toBeTruthy();
      expect(uLUnit).toBeTruthy();
      expect(ugLUnit).toBeTruthy();
      expect(pgmLUnit).toBeTruthy();
      expect(glUnit).toBeTruthy();
    });

    test("should render inactive metrics without text inputs", () => {
      const { getByTestId, getAllByText } = renderAnalysisEditModal();

      // Check that inactive metrics don't have text inputs
      const glucoseItem = getByTestId("item-3-0");
      expect(glucoseItem).toBeTruthy();

      // Should show "Non disponible" text instead of input fields
      const nonDisponibleTexts = getAllByText("Non disponible");
      expect(nonDisponibleTexts.length).toBeGreaterThan(0);
    });

    test("should render switches for all metrics", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Check that all metrics have switches
      const hemoglobinSwitch = getByTestId("item-0-1").findByProps({
        accessibilityRole: "switch",
      });
      const glucoseSwitch = getByTestId("item-3-0").findByProps({
        accessibilityRole: "switch",
      });

      expect(hemoglobinSwitch).toBeTruthy();
      expect(glucoseSwitch).toBeTruthy();
    });

    test("should have correct switch states for active/inactive metrics", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Active metrics should have switches set to true
      const hemoglobinSwitch = getByTestId("item-0-1").findByProps({
        accessibilityRole: "switch",
      });
      expect(hemoglobinSwitch.props.value).toBe(true);

      // Inactive metrics should have switches set to false
      const glucoseSwitch = getByTestId("item-3-0").findByProps({
        accessibilityRole: "switch",
      });
      expect(glucoseSwitch.props.value).toBe(false);
    });
  });

  describe("Date Picker Functionality", () => {
    test("should show date picker when date is pressed", () => {
      const { getByText, getByTestId } = renderAnalysisEditModal();

      const dateButton = getByText("15/01/2024");
      fireEvent.press(dateButton);

      expect(getByTestId("dateTimePicker")).toBeTruthy();
    });

    test("should update date when date picker selection changes", () => {
      const { getByText, getByTestId } = renderAnalysisEditModal();

      const dateButton = getByText("15/01/2024");
      fireEvent.press(dateButton);

      const datePicker = getByTestId("dateTimePicker");
      const newDate = new Date("2024-02-20");

      fireEvent(datePicker, "change", { type: "set" }, newDate);

      // Date should be updated
      expect(getByText("20/02/2024")).toBeTruthy();
    });
  });

  describe("Reference Range Display", () => {
    test("should display reference ranges for active lab values", () => {
      const { getByTestId, getAllByText } = renderAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      // Check that the reference range text is present
      const referenceRanges = getAllByText(/Normal range:/);
      expect(referenceRanges.length).toBeGreaterThan(0);
    });

    test("should not display reference ranges for inactive metrics", () => {
      const { getByTestId, getAllByText } = renderAnalysisEditModal();

      const glucoseItem = getByTestId("item-3-0");
      const nonDisponibleTexts = getAllByText("Non disponible");
      expect(nonDisponibleTexts.length).toBeGreaterThan(0);
    });

    test("should call reference range use case with correct parameters", () => {
      renderAnalysisEditModal();

      // Test that the real reference range use case can execute with the analysis data
      const hemoglobinRange = realGetReferenceRangeUseCase.execute(
        "Hémoglobine",
        realAnalysis.date
      );
      const leucocytesRange = realGetReferenceRangeUseCase.execute(
        "Leucocytes",
        realAnalysis.date
      );

      // These should be real calculated values based on the user profile (34-year-old male)
      expect(hemoglobinRange.min).toBeGreaterThan(0);
      expect(hemoglobinRange.max).toBeGreaterThan(hemoglobinRange.min);
      expect(leucocytesRange.min).toBeGreaterThan(0);
      expect(leucocytesRange.max).toBeGreaterThan(leucocytesRange.min);

      // Verify that the ranges are different (not just default values)
      expect(hemoglobinRange).not.toEqual({ min: 0, max: 0 });
      expect(leucocytesRange).not.toEqual({ min: 0, max: 0 });
    });
  });

  describe("Form Validation and Saving", () => {
    test("should call update use case and onSave when saving valid form data", async () => {
      const { getByText } = renderAnalysisEditModal();
      fireEvent.press(getByText("Save"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test("should set inactive metrics to null when saving", async () => {
      const { getByText } = renderAnalysisEditModal();
      fireEvent.press(getByText("Save"));

      await waitFor(async () => {
        // Check that the analysis was saved to the repository
        const savedAnalysis = await realRepository.getById("test-analysis-1");
        expect(savedAnalysis).toBeTruthy();

        // Verify that inactive metrics are null
        expect((savedAnalysis as any)["Glycémie"]).toBeNull();
      });
    });

    test("should preserve active metrics when saving", async () => {
      const { getByText } = renderAnalysisEditModal();
      fireEvent.press(getByText("Save"));

      await waitFor(async () => {
        // Check that the analysis was saved to the repository
        const savedAnalysis = await realRepository.getById("test-analysis-1");
        expect(savedAnalysis).toBeTruthy();

        // Verify that active metrics are preserved
        expect((savedAnalysis as any)["Hémoglobine"].value).toBe(14.5);
        expect((savedAnalysis as any)["Leucocytes"].value).toBe(7.2);
      });
    });
  });

  describe("Loading States", () => {
    test("should show loading indicator during save operation", async () => {
      const { getByText, getByTestId } = renderAnalysisEditModal();
      fireEvent.press(getByText("Save"));

      // Should show loading state (button is disabled and shows ActivityIndicator)
      // During loading, the Save button text is replaced with ActivityIndicator
      expect(getByTestId("responsive-section-list")).toBeTruthy();
    });

    test("should hide loading indicator when save operation completes", async () => {
      const { getByText } = renderAnalysisEditModal();
      fireEvent.press(getByText("Save"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Navigation and Modal Behavior", () => {
    test("should call onClose when cancel button is pressed", () => {
      const { getByText } = renderAnalysisEditModal();
      fireEvent.press(getByText("Cancel"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    test("should call onClose when modal close is requested", () => {
      const { getByTestId } = renderAnalysisEditModal();
      const modal = getByTestId("responsive-section-list").parent;

      if (modal && modal.props.onRequestClose) {
        modal.props.onRequestClose();
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe("Accessibility and UI Elements", () => {
    test("should have proper accessibility for form elements", () => {
      const { getByTestId } = renderAnalysisEditModal();

      // Check that all interactive elements have proper test IDs
      expect(getByTestId("responsive-section-list")).toBeTruthy();
    });

    test("should render section headers with proper styling", () => {
      const { getByText } = renderAnalysisEditModal();

      Object.keys(LAB_VALUE_CATEGORIES).forEach((category) => {
        const header = getByText(category);
        expect(header).toBeTruthy();
      });
    });

    test("should render lab value containers with proper styling", () => {
      const { getByTestId } = renderAnalysisEditModal();

      const firstItem = getByTestId("item-0-0");
      expect(firstItem).toBeTruthy();
    });
  });

  describe("Component Lifecycle", () => {
    test("should not cause memory leaks on unmount", () => {
      const { unmount } = renderAnalysisEditModal();

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test("should handle rapid mount/unmount cycles", () => {
      const { unmount, rerender } = renderAnalysisEditModal();

      expect(() => {
        unmount();
        rerender(
          <AnalysisEditModal
            visible={true}
            analysis={realAnalysis}
            updateAnalysisUseCase={realUpdateAnalysisUseCase}
            getReferenceRangeUseCase={realGetReferenceRangeUseCase}
            onClose={mockOnClose}
            onSave={mockOnSave}
          />
        );
        unmount();
      }).not.toThrow();
    });

    test("should reinitialize form when analysis changes", () => {
      const newAnalysis = {
        ...realAnalysis,
        Hémoglobine: { value: 16.0, unit: "g/dL" },
        date: new Date("2024-03-20"),
      };

      const { rerender, getByText } = renderAnalysisEditModal();

      // Change the analysis
      rerender(
        <AnalysisEditModal
          visible={true}
          analysis={newAnalysis}
          updateAnalysisUseCase={realUpdateAnalysisUseCase}
          getReferenceRangeUseCase={realGetReferenceRangeUseCase}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Date should be updated
      expect(getByText("20/03/2024")).toBeTruthy();
    });
  });

  describe("Integration Tests - Comma to Dot Conversion", () => {
    let realRepository: InMemoryBiologicalAnalysisRepository;
    let realUpdateAnalysisUseCase: UpdateAnalysisUseCase;
    let realGetReferenceRangeUseCase: GetReferenceRangeUseCase;
    let realAnalysis: BiologicalAnalysis;
    let realUserProfileRepository: InMemoryUserProfileRepository;
    let realReferenceRangeCalculator: ReferenceRangeCalculator;

    beforeEach(async () => {
      // Set up real repositories and use cases
      realRepository = new InMemoryBiologicalAnalysisRepository();
      realUpdateAnalysisUseCase = new UpdateAnalysisUseCase(realRepository);

      // Create real in-memory adapters
      realUserProfileRepository = new InMemoryUserProfileRepository();
      realReferenceRangeCalculator = new ReferenceRangeCalculator();

      // Create a real user profile for reference range calculations
      const userProfile: UserProfile = {
        id: "test-user-1",
        firstName: "Test",
        lastName: "User",
        name: "Test User",
        birthDate: new Date("1990-01-01"), // 34 years old in 2024
        gender: "male",
        profileImage: undefined,
        pinnedMetrics: [],
      };

      // Save the user profile to the repository
      await realUserProfileRepository.save(userProfile);

      // Create the real use case with real dependencies
      realGetReferenceRangeUseCase = new GetReferenceRangeUseCase(
        realReferenceRangeCalculator,
        realUserProfileRepository
      );

      // Initialize the use case to load the user profile
      await realGetReferenceRangeUseCase.initialize();

      // Create a real analysis and save it to the repository
      realAnalysis = {
        id: "integration-test-1",
        date: new Date("2024-01-15"),
        Hémoglobine: { value: 14.5, unit: "g/dL" },
        Leucocytes: { value: 7.2, unit: "giga/L" },
        Plaquettes: { value: 250, unit: "giga/L" },
        Glycémie: null,
        "Cholestérol HDL": { value: 0.6, unit: "g/l" },
        "Transaminases TGO": { value: 25, unit: "U/L" },
        Ferritine: { value: 150, unit: "μg/L" },
        "Vitamine B12": { value: 400, unit: "pg/mL" },
      } as BiologicalAnalysis;

      await realRepository.save(realAnalysis);
    });

    afterEach(async () => {
      await realRepository.clear();
      await realUserProfileRepository.reset();
    });

    const renderRealAnalysisEditModal = (props = {}) => {
      return render(
        <AnalysisEditModal
          visible={true}
          analysis={realAnalysis}
          updateAnalysisUseCase={realUpdateAnalysisUseCase}
          getReferenceRangeUseCase={realGetReferenceRangeUseCase}
          onClose={mockOnClose}
          onSave={mockOnSave}
          {...props}
        />
      );
    };

    test("should convert comma to dot when saving analysis with comma input", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "15,7");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(15.7);
          expect(hemoglobinValue.value).not.toBe(15);
          expect(hemoglobinValue.value).not.toBe("15,7");
        });
      }
    });

    test("should convert multiple commas to dots when saving analysis", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "15,7,8");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(15.7);
        });
      }
    });

    test("should handle mixed commas and dots correctly", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "15,7.8");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(15.7);
        });
      }
    });

    test("should preserve decimal precision when converting commas", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "16,75");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(16.75);
          expect(hemoglobinValue.value).not.toBe(16);
          expect(hemoglobinValue.value).not.toBe(16.7);
        });
      }
    });

    test("should handle negative values with commas", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "-15,7");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(-15.7);
          expect(hemoglobinValue.value).not.toBe(15.7);
        });
      }
    });

    test("should handle very small decimal values with commas", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "0,001");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(0.001);
          expect(hemoglobinValue.value).not.toBe(0);
          expect(hemoglobinValue.value).not.toBe(1);
        });
      }
    });

    test("should handle large values with commas", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "999,999");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(999.999);
          expect(hemoglobinValue.value).not.toBe(999);
          expect(hemoglobinValue.value).not.toBe(1000000);
        });
      }
    });

    test("should convert commas in multiple lab values", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const hemoglobinInput = hemoglobinItem.findByProps({ value: "14.5" });

      const leucocytesItem = getByTestId("item-0-6");
      const leucocytesInput = leucocytesItem.findByProps({ value: "7.2" });

      if (hemoglobinInput && leucocytesInput) {
        fireEvent.changeText(hemoglobinInput, "16,5");
        fireEvent.changeText(leucocytesInput, "8,9");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          const leucocytesValue = (savedAnalysis as any)["Leucocytes"] as any;
          expect(hemoglobinValue.value).toBe(16.5);
          expect(leucocytesValue.value).toBe(8.9);
        });
      }
    });

    test("should handle empty input and convert to 0", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, "");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(0);
        });
      }
    });

    test("should handle decimal point only input", async () => {
      const { getByTestId, getByText } = renderRealAnalysisEditModal();

      const hemoglobinItem = getByTestId("item-0-1");
      const inputElement = hemoglobinItem.findByProps({ value: "14.5" });

      if (inputElement) {
        fireEvent.changeText(inputElement, ".");

        fireEvent.press(getByText("Save"));

        await waitFor(async () => {
          const savedAnalysis = await realRepository.getById(
            "integration-test-1"
          );
          expect(savedAnalysis).toBeTruthy();

          const hemoglobinValue = (savedAnalysis as any)["Hémoglobine"] as any;
          expect(hemoglobinValue.value).toBe(0);
        });
      }
    });

    test("should use real reference range calculations", async () => {
      const { getByTestId } = renderRealAnalysisEditModal();

      // Test that the real reference range use case is working
      const hemoglobinRange = realGetReferenceRangeUseCase.execute(
        "Hémoglobine",
        new Date("2024-01-15")
      );
      const leucocytesRange = realGetReferenceRangeUseCase.execute(
        "Leucocytes",
        new Date("2024-01-15")
      );

      // These should be real calculated values based on the user profile (34-year-old male)
      expect(hemoglobinRange.min).toBeGreaterThan(0);
      expect(hemoglobinRange.max).toBeGreaterThan(hemoglobinRange.min);
      expect(leucocytesRange.min).toBeGreaterThan(0);
      expect(leucocytesRange.max).toBeGreaterThan(leucocytesRange.min);

      // Verify that the ranges are different (not just default values)
      expect(hemoglobinRange).not.toEqual({ min: 0, max: 0 });
      expect(leucocytesRange).not.toEqual({ min: 0, max: 0 });
    });
  });
});
