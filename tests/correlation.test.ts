import { describe, expect, it } from "vitest";
import { correlationPoints } from "../lib/visuals/correlation";

function pearson(points: { x: number; y: number }[]) {
  const n = points.length;
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  let covariance = 0, varianceX = 0, varianceY = 0;
  for (const point of points) {
    const x = point.x - meanX, y = point.y - meanY;
    covariance += x * y;
    varianceX += x * x;
    varianceY += y * y;
  }
  return covariance / Math.sqrt(varianceX * varianceY);
}

describe("the correlation figure", () => {
  it.each([-.95, -.5, 0, .65, .95])("shows the selected correlation %s throughout the animation", rho => {
    for (const phase of [0, .5, 2, 8]) {
      const points = correlationPoints(rho, phase);
      expect(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      expect(pearson(points)).toBeCloseTo(rho, 10);
    }
  });

  it("produces stable initial positions and different animated positions", () => {
    expect(correlationPoints(.65)).toEqual(correlationPoints(.65));
    expect(correlationPoints(.65, 1)).not.toEqual(correlationPoints(.65));
  });
});
