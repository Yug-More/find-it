import { useCallback, useEffect, useState } from "react";

import { getReport, listReports } from "../services/reports";
import type { Report } from "../types/report";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyResult = useCallback((next: Report[]) => {
    setReports(next);
    setError(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const applyError = useCallback((caught: unknown) => {
    setError(messageFrom(caught, "Reports could not be loaded."));
    setLoading(false);
    setRefreshing(false);
  }, []);

  const load = useCallback(
    (mode: "initial" | "refresh") => {
      if (mode === "refresh") {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      listReports().then(applyResult).catch(applyError);
    },
    [applyError, applyResult],
  );

  useEffect(() => {
    let active = true;

    listReports()
      .then((next) => {
        if (active) {
          applyResult(next);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          applyError(caught);
        }
      });

    return () => {
      active = false;
    };
  }, [applyError, applyResult]);

  return {
    reports,
    loading,
    refreshing,
    error,
    retry: () => load("initial"),
    refresh: () => load("refresh"),
  };
}

export function useReport(reportId: string) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    getReport(reportId)
      .then((next) => {
        setReport(next);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        setReport(null);
        setError(messageFrom(caught, "This report could not be loaded."));
        setLoading(false);
      });
  }, [reportId]);

  useEffect(() => {
    let active = true;

    getReport(reportId)
      .then((next) => {
        if (!active) {
          return;
        }
        setReport(next);
        setError(null);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (!active) {
          return;
        }
        setReport(null);
        setError(messageFrom(caught, "This report could not be loaded."));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportId]);

  return { report, loading, error, retry: load };
}

function messageFrom(caught: unknown, fallback: string): string {
  if (caught instanceof Error && caught.message) {
    return caught.message;
  }
  return fallback;
}
