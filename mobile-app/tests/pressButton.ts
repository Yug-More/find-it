import { act } from "@testing-library/react-native";

type PressHandler = (event?: object) => void | Promise<void>;

type PressConfig = {
  onPress?: PressHandler;
  disabled?: boolean;
};

type PressProps = {
  onPress?: PressHandler;
  onClick?: (event: object) => void | Promise<void>;
  onStartShouldSetResponder?: {
    testOnly_pressabilityConfig?: () => PressConfig;
  };
};

// Native-stack screens expose the press handler through Pressability.
// Call that handler and wait for it so later queries do not overlap an in-flight update.
export async function pressButton(instance: { props: object }): Promise<void> {
  const props = instance.props as PressProps;
  const config = props.onStartShouldSetResponder?.testOnly_pressabilityConfig?.();
  if (config?.disabled) {
    return;
  }

  const press = config?.onPress ?? props.onPress;
  await act(async () => {
    const result = press
      ? press()
      : props.onClick?.({
          nativeEvent: {},
          currentTarget: instance,
          target: instance,
        });
    if (result && typeof result.then === "function") {
      await result;
    }
  });
}
