import React, { createContext, useContext, useState, ReactNode } from "react";
import { TimeRangeOption } from "../components/TimeRangeFAB";

interface TimeRangeContextType {
  selectedTimeRange: TimeRangeOption;
  setSelectedTimeRange: (range: TimeRangeOption) => void;
}

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(
  undefined
);

export const useTimeRange = () => {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error("useTimeRange must be used within a TimeRangeProvider");
  }
  return context;
};

interface TimeRangeProviderProps {
  children: ReactNode;
}

export const TimeRangeProvider: React.FC<TimeRangeProviderProps> = ({
  children,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<TimeRangeOption>("3y");

  return (
    <TimeRangeContext.Provider
      value={{ selectedTimeRange, setSelectedTimeRange }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
};
