import type { AgentProvider } from "@/lib/agents/types";

export const mockAgent: AgentProvider = {
  async *stream({ scope }) {
    const response = scope === "public"
      ? "I can help you find EFDS events, career guides and public resources. This public assistant only searches approved public content."
      : "This private assistant is ready for authorised EFDS knowledge. Connect the retrieval provider next; every query will keep its access scope.\n\nFor now, try asking about an event process, a career area or your saved opportunities.";
    for (const word of response.split(" ")) {
      await new Promise((resolve) => setTimeout(resolve, 12));
      yield `${word} `;
    }
  },
};
