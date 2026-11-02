import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getReport, listReports } from "../services/reports";
import type { Report } from "../types/report";

// Focus loads and explicit retries share a generation so older responses cannot
// replace a newer result. Blurring also invalidates pending requests.
function useFocusedResource<T>(fetchResource: () => Promise<T>, initial: T, fallback: string) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const focused = useRef(false);
  const loadedResource = useRef<(() => Promise<T>) | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!focused.current) return;
    const request = ++generation.current;
    setLoading(!refresh);
    setRefreshing(refresh);
    setError(null);
    try {
      const next = await fetchResource();
      if (request !== generation.current) return;
      loadedResource.current = fetchResource;
      setData(next);
    } catch (caught) {
      if (request !== generation.current) return;
      setError(caught instanceof Error && caught.message ? caught.message : fallback);
    } finally {
      if (request === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchResource, fallback]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void load(loadedResource.current === fetchResource);
    return () => {
      focused.current = false;
      generation.current += 1;
    };
  }, [fetchResource, load]));

  return { data, loading, refreshing, error, retry: () => load(), refresh: () => load(true) };
}

export function useReports() {
  const { data: reports, ...state } = useFocusedResource<Report[]>(
    listReports, [], "Reports could not be loaded.",
  );
  return { reports, ...state };
}

export function useReport(reportId: string) {
  const fetchReport = useCallback(() => getReport(reportId), [reportId]);
  const { data: report, ...state } = useFocusedResource<Report | null>(
    fetchReport, null, "This report could not be loaded.",
  );
  // Never display the previous report while a different ID is being fetched.
  return { report: report?.id === reportId ? report : null, ...state };
}
