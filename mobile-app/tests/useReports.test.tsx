import { act, renderHook } from "@testing-library/react-native";
import { useReport, useReports } from "../src/hooks/useReports";
import { getReport, listReports } from "../src/services/reports";
import { sampleReport } from "./fixtures";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import("react")>("react");
    useEffect(callback, [callback]);
  },
}));
jest.mock("../src/services/reports", () => ({ getReport: jest.fn(), listReports: jest.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}

it("awaits refresh and ignores an older focus response", async () => {
  const old = deferred<ReturnType<typeof sampleReport>[]>();
  jest.mocked(listReports).mockReturnValueOnce(old.promise).mockResolvedValueOnce([sampleReport({ title: "New" })]);
  const { result } = await renderHook(() => useReports());
  await act(async () => { await result.current.refresh(); });
  expect(result.current.reports[0]?.title).toBe("New");
  await act(async () => { old.resolve([sampleReport({ title: "Old" })]); });
  expect(result.current.reports[0]?.title).toBe("New");
  expect(result.current.refreshing).toBe(false);
});

it("keeps existing reports and offers recovery after a failed refresh", async () => {
  jest.mocked(listReports).mockResolvedValueOnce([sampleReport()])
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce([sampleReport({ title: "Recovered" })]);
  const { result } = await renderHook(() => useReports());
  await act(async () => {});
  await act(async () => { await result.current.refresh(); });
  expect(result.current.reports).toHaveLength(1);
  expect(result.current.error).toBe("Offline");
  await act(async () => { await result.current.retry(); });
  expect(result.current.error).toBeNull();
  expect(result.current.reports[0]?.title).toBe("Recovered");
});

it("ignores a response from a previous report ID", async () => {
  const old = deferred<ReturnType<typeof sampleReport>>();
  jest.mocked(getReport).mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(sampleReport({ id: "second", title: "Second" }));
  const { result, rerender } = await renderHook((props: { id: string } | undefined) => useReport(props?.id ?? "first"), { initialProps: { id: "first" } });
  await rerender({ id: "second" });
  await act(async () => {});
  expect(result.current.report?.title).toBe("Second");
  await act(async () => { old.resolve(sampleReport({ id: "first", title: "First" })); });
  expect(result.current.report?.title).toBe("Second");
});
