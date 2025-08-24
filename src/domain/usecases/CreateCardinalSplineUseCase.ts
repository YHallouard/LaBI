export interface Point {
  x: number;
  y: number;
}

export class CreateCardinalSplineUseCase {
  execute(points: Point[], tension: number = 0.2): string {
    if (points.length < 2) return "";

    const path: string[] = [`M ${points[0].x},${points[0].y}`];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      let cp1x, cp1y, cp2x, cp2y;

      if (i === 0) {
        cp1x = p0.x + (p1.x - p0.x) * tension;
        cp1y = p0.y + (p1.y - p0.y) * tension;
      } else {
        const prev = points[i - 1];
        cp1x = p0.x + (p1.x - prev.x) * tension;
        cp1y = p0.y + (p1.y - prev.y) * tension;
      }

      if (i === points.length - 2) {
        cp2x = p1.x - (p1.x - p0.x) * tension;
        cp2y = p1.y - (p1.y - p0.y) * tension;
      } else {
        const next = points[i + 2];
        cp2x = p1.x - (next.x - p0.x) * tension;
        cp2y = p1.y - (next.y - p0.y) * tension;
      }

      path.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`);
    }

    return path.join(" ");
  }
}
