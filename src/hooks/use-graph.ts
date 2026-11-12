"use client";

// The signed-in user's knowledge graph: their published resources as nodes and
// the typed relations between them. Edges never dangle - the API only returns
// relations whose both ends resolve to a visible node.
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";

export interface GraphNode {
  id: string;
  title: string | null;
  type: string;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  type: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export function useGraph() {
  return useQuery({
    queryKey: ["graph"],
    queryFn: async (): Promise<KnowledgeGraph> =>
      (await apiClient<ApiEnvelope<KnowledgeGraph>>("/api/graph")).data,
  });
}
