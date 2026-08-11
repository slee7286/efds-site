import type { AgentScope } from "@/types/domain";

export interface AgentRequest {
  message: string;
  scope: AgentScope;
}

export interface AgentProvider {
  stream(request: AgentRequest): AsyncIterable<string>;
}

export function assertScope(scope: AgentScope): AgentScope {
  return scope;
}
