import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertBottomSheet } from "../components/AlertBottomSheet";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void | Promise<void>;
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const modalRef = useRef<BottomSheetModal>(null);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    // Small delay to ensure state is set before presenting
    setTimeout(() => modalRef.current?.present(), 50);
  }, []);

  const handleDismiss = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertBottomSheet
        config={alertConfig}
        modalRef={modalRef}
        onDismiss={handleDismiss}
      />
    </AlertContext.Provider>
  );
}
