import { NavigationContainer } from "@react-navigation/native";
import { render, waitFor, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../src/context/AuthContext";
import { RootNavigator } from "../src/navigation/RootNavigator";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

type Options = RenderOptions & {
  settleAuth?: boolean;
};

export async function renderApp(ui: ReactElement = <RootNavigator />, options?: Options) {
  const { settleAuth = true, ...renderOptions } = options ?? {};
  const view = await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <AuthProvider>
        <NavigationContainer>{ui}</NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>,
    renderOptions,
  );

  if (settleAuth) {
    await waitFor(() => {
      expect(view.queryByText("Restoring your session")).toBeNull();
    });
  }

  return view;
}
