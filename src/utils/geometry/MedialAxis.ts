import { Edge } from './Edge';
import { Point } from './Point';

export class MedialAxis {
  edges: Edge[];
  points: Point[];
  needToReverse: boolean;

  constructor() {
    this.edges = [];
    this.points = [];
    this.needToReverse = false;
  }

  addPoints(points: number[][]) {
    points.forEach((point) => {
      this.points.push(new Point(point[0], point[1], point[2]));
    });
  }

  addEdge(edge: Edge) {
    if (!this.hasSimilarEdge(edge)) {
      this.edges.push(edge);
    }
  }

  hasSimilarEdge(newEdge: Edge): boolean {
    for (const existingEdge of this.edges) {
      if (existingEdge.compare(newEdge)) {
        return true;
      } else {
        if (existingEdge == newEdge) {
          return true;
        }
      }
    }
    return false;
  }

  findStartEdge(): Edge | null {
    for (const edge of this.edges) {
      if (
        this.isPointShared(edge.startPoint, edge) ||
        this.isPointShared(edge.endPoint, edge)
      ) {
        return edge;
      }
    }
    return null;
  }

  isPointShared(point: number, edge: Edge): boolean {
    for (const otherEdge of this.edges) {
      if (
        otherEdge !== edge &&
        (otherEdge.startPoint === point || otherEdge.endPoint === point)
      ) {
        return true;
      }
    }
    return false;
  }

  orderedEdges(startEdge?: Edge): Edge[] {
    if (!startEdge) {
      startEdge = this.edges[0];
    }
    const ordered: Edge[] = [startEdge];
    let currentEdge: Edge | null = startEdge;
    const processedEdges = new Set<Edge>();
    this.needToReverse = false;
    processedEdges.add(currentEdge);

    while (ordered.length < this.edges.length) {
      let seedPoint = currentEdge.endPoint;
      if (this.needToReverse) {
        seedPoint = currentEdge.startPoint;
      }
      this.needToReverse = false;
      const nextEdge = this.findConnectedEdge(seedPoint, processedEdges);
      if (nextEdge) {
        if (!this.needToReverse) {
          ordered.push(nextEdge);
        } else {
          ordered.push(new Edge(nextEdge.endPoint, nextEdge.startPoint));
        }
        currentEdge = nextEdge;
      } else {
        break;
      }
    }

    return ordered;
  }

  findConnectedEdge(point: number, processedEdges: Set<Edge>): Edge | null {
    for (const edge of this.edges) {
      if (!processedEdges.has(edge)) {
        if (edge.startPoint === point) {
          processedEdges.add(edge);
          return edge;
        }
        if (edge.endPoint === point) {
          processedEdges.add(edge);
          this.needToReverse = true;
          return edge;
        }
      }
    }
    return null;
  }
}
