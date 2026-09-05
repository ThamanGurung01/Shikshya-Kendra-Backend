/**
 * Implements Holt's Double Exponential Smoothing (Linear Trend Method).
 * Developer-written — no external packages.
 */

export interface SmoothedPoint {
  index: number;
  actual: number;
  level: number;
  trend: number;
  forecast: number;
  upper: number;
  lower: number;
  isForecast: boolean;
}

export interface SmoothingResult {
  alpha: number;
  beta: number;
  mae: number;
  points: SmoothedPoint[];
}

export function holtDoubleSmoothing(
  series: number[],
  forecastSteps: number = 3,
  alpha: number = 0.3,
  beta: number = 0.1
): SmoothingResult {
  if (series.length < 2) {
    throw new Error("Exponential smoothing requires at least 2 data points.");
  }

  let level: number = series[0]!;
  let trend: number = series[1]! - series[0]!;

  const points: SmoothedPoint[] = [];
  const absErrors: number[] = [];

  for (let t = 0; t < series.length; t++) {
    const actual = series[t]!;
    const fittedForecast = level + trend;

    if (t > 0) absErrors.push(Math.abs(actual - fittedForecast));

    const prevLevel = level;
    level = alpha * actual + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;

    points.push({
      index: t,
      actual,
      level,
      trend,
      forecast: fittedForecast,
      upper: 0,
      lower: 0,
      isForecast: false,
    });
  }

  const mae =
    absErrors.length > 0
      ? absErrors.reduce((s, e) => s + e, 0) / absErrors.length
      : 0;

  const C = 1.5;
  for (const p of points) {
    p.upper = Math.max(0, p.forecast + C * mae);
    p.lower = Math.max(0, p.forecast - C * mae);
  }

  for (let m = 1; m <= forecastSteps; m++) {
    const futureForecast = level + m * trend;
    points.push({
      index: series.length - 1 + m,
      actual: NaN,
      level,
      trend,
      forecast: Math.max(0, futureForecast),
      upper: Math.max(0, futureForecast + C * mae),
      lower: Math.max(0, futureForecast - C * mae),
      isForecast: true,
    });
  }

  return { alpha, beta, mae, points };
}
