import { z }            from "zod";
import type { Flow }    from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { LoginDto }     from "../auth.dto";
import { authService }  from "../auth.service";

export interface LoginFlowOutput {
  requiresMfa:  boolean;
  sessionId?:   string;
  mfaTypes?:    string[];
  accessToken?: string;
  refreshToken?: string;
  expiresIn?:  number;
}

export const loginFlow: Flow<z.infer<typeof LoginDto>, LoginFlowOutput> = {
  name:        "auth:login",
  inputSchema: LoginDto,

  async execute(input, ctx: FlowContext) {
    const result = await authService.login(input);

    if (result.requiresMfa) {
      return { requiresMfa: true, sessionId: result.sessionId, mfaTypes: result.mfaTypes };
    }

    // Caller (route handler) sets cookies
    return {
      requiresMfa:  false,
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      sessionId:    result.sessionId,
      expiresIn:    result.expiresIn ?? 900,
    };
  },
};
