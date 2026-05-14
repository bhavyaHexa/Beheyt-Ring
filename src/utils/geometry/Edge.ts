export class Edge {
  startPoint: number;
  endPoint: number;

  constructor(startPoint: number, endPoint: number) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
  }

  compare(otherEdge: Edge): boolean {
    if (
      this.startPoint === otherEdge.startPoint &&
      this.endPoint === otherEdge.endPoint
    ) {
      return true;
    }
    if (
      this.startPoint === otherEdge.endPoint &&
      this.endPoint === otherEdge.startPoint
    ) {
      return true;
    }
    return false;
  }
}
