import type { NetworkModel } from "../types/infrastructure";

export function outgoing(network: NetworkModel, id: string) {
  return network.edges.filter(e => e.source === id);
}

export function incoming(network: NetworkModel, id: string) {
  return network.edges.filter(e => e.target === id);
}

export function descendants(network: NetworkModel, starts: string[]) {
  const seen = new Set(starts);
  const levels: string[][] = [];
  let frontier = [...starts];

  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const edge of outgoing(network, id)) {
        if (!seen.has(edge.target)) {
          seen.add(edge.target);
          next.push(edge.target);
        }
      }
    }
    if (next.length) levels.push(next);
    frontier = next;
  }

  return { nodes: [...seen], levels };
}

export function shortestReach(network: NetworkModel, start: string) {
  const dist = new Map<string, number>([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift()!;
    for (const edge of outgoing(network, current)) {
      if (!dist.has(edge.target)) {
        dist.set(edge.target, dist.get(current)! + 1);
        queue.push(edge.target);
      }
    }
  }
  return dist;
}
