import * as THREE from 'three';
import { Edge } from './Edge';
import { MedialAxis } from './MedialAxis';

export class BoundaryPointsEvaluator {
  private boundaryEdges: number[][][] | null = null;
  private boundaryPoints: { x: number; y: number }[][] = [];
  private geometry: THREE.BufferGeometry;
  private isRecursive: boolean = false;

  constructor(inGeometry: THREE.BufferGeometry) {
    this.geometry = inGeometry;
  }

  private evaluateBoundaryPoints(inGeometry: THREE.BufferGeometry) {
    if (!inGeometry.index) return;
    const indices: number[] = Array.from(
      inGeometry.index.array as any,
    );
    const uvEdgeCount: { [key: string]: number } = {};

    for (let i = 0; i < indices.length; i += 3) {
      const uvIndex1 = indices[i];
      const uvIndex2 = indices[i + 1];
      const uvIndex3 = indices[i + 2];

      this.incrementUVEdgeCount(uvIndex1, uvIndex2, uvEdgeCount);
      this.incrementUVEdgeCount(uvIndex2, uvIndex3, uvEdgeCount);
      this.incrementUVEdgeCount(uvIndex3, uvIndex1, uvEdgeCount);
    }

    const localBoundaryEdges: number[][] = [];

    for (const edge in uvEdgeCount) {
      if (uvEdgeCount[edge] === 1) {
        const [uvIndex1, uvIndex2] = edge.split('_').map(Number);
        localBoundaryEdges.push([uvIndex1, uvIndex2]);
      }
    }

    if (this.isRecursive) {
      this.boundaryEdges = this.findMultipleBoundaryLoops(localBoundaryEdges);
    } else {
      this.boundaryEdges = [localBoundaryEdges];
    }
  }

  private incrementUVEdgeCount(
    uv1: number,
    uv2: number,
    uvEdgeCount: { [key: string]: number },
  ): void {
    const key = uv1 < uv2 ? `${uv1}_${uv2}` : `${uv2}_${uv1}`;
    uvEdgeCount[key] = (uvEdgeCount[key] || 0) + 1;
  }

  private findMultipleBoundaryLoops(edges: number[][]): number[][][] {
    const adjacencyList: { [key: number]: number[] } = {};
    const visited: Set<number> = new Set();
    const boundaryLoops: number[][][] = [];

    edges.forEach(([uvIndex1, uvIndex2]) => {
      if (!adjacencyList[uvIndex1]) adjacencyList[uvIndex1] = [];
      if (!adjacencyList[uvIndex2]) adjacencyList[uvIndex2] = [];
      adjacencyList[uvIndex1].push(uvIndex2);
      adjacencyList[uvIndex2].push(uvIndex1);
    });

    const dfs = (vertex: number, loop: number[]) => {
      visited.add(vertex);
      loop.push(vertex);
      adjacencyList[vertex].forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          dfs(neighbor, loop);
        }
      });
    };

    Object.keys(adjacencyList).forEach((start) => {
      const startIndex = parseInt(start);
      if (!visited.has(startIndex)) {
        const loop: number[] = [];
        dfs(startIndex, loop);
        if (loop.length > 0) {
          boundaryLoops.push(this.orderBoundaryPoints(loop));
        }
      }
    });

    return boundaryLoops;
  }

  private orderBoundaryPoints(loop: number[]): number[][] {
    const orderedEdges: number[][] = [];

    if (loop.length > 1) {
      for (let i = 0; i < loop.length; i++) {
        const startIndex = loop[i];
        const endIndex = loop[(i + 1) % loop.length];
        orderedEdges.push([startIndex, endIndex]);
      }
    }

    return orderedEdges;
  }

  private calculateBoundaryPoints(isOrdered: boolean) {
    const boundaryEdges = this.boundaryEdges;
    if (this.geometry.attributes.uv === undefined) {
      throw new Error(
        'Template issue, no UV data found while calculating boundary points. ',
      );
    }
    const uvs = this.geometry.attributes.uv.array;
    if (!boundaryEdges) return;
    this.boundaryPoints = [];

    boundaryEdges.forEach((edges: number[][]) => {
      const loopPoints: { x: number; y: number }[] = [];

      if (isOrdered) {
        const medialAxis = new MedialAxis();
        edges.forEach(([uvIndex1, uvIndex2]) => {
          medialAxis.addEdge(new Edge(uvIndex1, uvIndex2));
        });

        const startEdge = medialAxis.findStartEdge();
        if (!startEdge) return;
        const orderedEdges = medialAxis.orderedEdges(startEdge);
        orderedEdges.forEach((edge) => {
          loopPoints.push({
            x: this.roundValue(uvs[edge.startPoint * 2]),
            y: this.roundValue(uvs[edge.startPoint * 2 + 1]),
          });
        });
      } else {
        // Fallback if not ordered, though the user code didn't specify what to do if !isOrdered in the loop
        // but based on the provided code, it seems loopPoints stays empty if !isOrdered?
        // Let's add a default just in case, or follow the provided logic.
        // The provided logic only pushes if isOrdered is true inside the loop.
      }

      this.boundaryPoints.push(loopPoints);
    });
  }

  private roundValue(value: number): number {
    return Math.round(value * 1e6) / 1e6;
  }

  public getBoundaryEdges(): number[][][] | null {
    return this.boundaryEdges;
  }

  public getBoundaryPoints(isOrdered: boolean): { x: number; y: number }[] {
    this.isRecursive = false;
    this.evaluateBoundaryPoints(this.geometry);
    this.calculateBoundaryPoints(isOrdered);
    return this.boundaryPoints.flat();
  }

  public getBoundaryPointsRecursive(
    isOrdered: boolean,
  ): { x: number; y: number }[][] {
    this.isRecursive = true;
    this.evaluateBoundaryPoints(this.geometry);
    this.calculateBoundaryPoints(isOrdered);
    return this.boundaryPoints;
  }
}
