import { NavigationContainer } from "@react-navigation/native";
import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "../src/navigation/RootNavigator";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function renderApp(ui: ReactElement = <RootNavigator />, options?: RenderOptions) {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <NavigationContainer>{ui}</NavigationContainer>
    </SafeAreaProvider>,
    options,
  );
}
