import React, {
  createContext,
  useContext,
  useState,
  ReactElement,
  useCallback,
} from "react";
import {
  useSharedValue,
  withTiming,
  WithTimingConfig,
  SharedValue,
} from "react-native-reanimated";

interface TabBarContextType {
  leftButtons: ReactElement[];
  rightButtons: ReactElement[];
  isVisible: boolean;
  animatedPosition: SharedValue<number>;
  setLeftButtons: (buttons: ReactElement[]) => void;
  setRightButtons: (buttons: ReactElement[]) => void;
  clearButtons: () => void;
  hideTabBar: () => void;
  showTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const useTabBar = (): TabBarContextType => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error("useTabBar must be used within a TabBarProvider");
  }
  return context;
};

interface TabBarProviderProps {
  children: React.ReactNode;
}

export const TabBarProvider: React.FC<TabBarProviderProps> = ({ children }) => {
  const [leftButtons, setLeftButtonsState] = useState<ReactElement[]>([]);
  const [rightButtons, setRightButtonsState] = useState<ReactElement[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const animatedPosition = useSharedValue(0);

  const animationConfig: WithTimingConfig = {
    duration: 300,
  };

  const setLeftButtons = useCallback((buttons: ReactElement[]) => {
    setLeftButtonsState(buttons);
  }, []);

  const setRightButtons = useCallback((buttons: ReactElement[]) => {
    setRightButtonsState(buttons);
  }, []);

  const clearButtons = useCallback((): void => {
    setLeftButtonsState([]);
    setRightButtonsState([]);
  }, []);

  const hideTabBar = useCallback((): void => {
    setIsVisible(false);
    animatedPosition.value = withTiming(150, animationConfig);
  }, [animatedPosition]);

  const showTabBar = useCallback((): void => {
    setIsVisible(true);
    animatedPosition.value = withTiming(0, animationConfig);
  }, [animatedPosition]);

  return (
    <TabBarContext.Provider
      value={{
        leftButtons,
        rightButtons,
        isVisible,
        animatedPosition,
        setLeftButtons,
        setRightButtons,
        clearButtons,
        hideTabBar,
        showTabBar,
      }}
    >
      {children}
    </TabBarContext.Provider>
  );
};
