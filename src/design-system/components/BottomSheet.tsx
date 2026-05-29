import React, { useEffect, useRef } from 'react';
import {
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetMethods,
} from '@expo/ui/community/bottom-sheet';
import { colors, radii } from '../tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Explicit snap points (e.g. ['50%', '90%']). Omit for auto-height. */
  snapPoints?: (string | number)[];
}

export function BottomSheet({ visible, onClose, children, snapPoints }: Props) {
  const ref = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      enableDynamicSizing={!snapPoints}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backgroundStyle={{
        backgroundColor: colors.bgElevated,
        borderTopLeftRadius: radii['2xl'],
        borderTopRightRadius: radii['2xl'],
      }}
      handleIndicatorStyle={{
        backgroundColor: colors.border,
        width: 38,
      }}
    >
      <BottomSheetView>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
