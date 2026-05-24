import React, { createContext, useContext, useState, ReactNode } from "react";

export type TimeRangeOption = "1m" | "3m" | "6m" | "1y" | "3y" | "all";

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
