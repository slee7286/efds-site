import "server-only";

export type IntegrationName = "icu_freshdesk" | "slack" | "microsoft_graph" | "onedrive" | "sharepoint" | "calendar";

export interface IntegrationContext {
  name: IntegrationName;
  credentialKey: string;
}

export interface IntegrationAdapter<TInput, TOutput> {
  readonly name: IntegrationName;
  run(input: TInput, context: IntegrationContext): Promise<TOutput>;
}

// UI code should call a server action or route handler that owns this boundary;
// it must never call an external provider directly from a client component.
