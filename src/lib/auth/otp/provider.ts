import "server-only"

import { readOtpRuntimeEnv } from "@/lib/auth/otp/policy"
import { createDevConsoleOtpProvider } from "@/lib/auth/otp/providers/dev-console"
import type {
  OtpProvider,
  OtpProviderSendInput,
  OtpProviderSendResult,
  OtpRuntimeEnv,
} from "@/lib/auth/otp/types"

export class OtpProviderError extends Error {
  readonly code: "OTP_PROVIDER_UNAVAILABLE" | "OTP_PROVIDER_ENV_BLOCKED"

  constructor(
    code: "OTP_PROVIDER_UNAVAILABLE" | "OTP_PROVIDER_ENV_BLOCKED",
    message: string,
  ) {
    super(message)
    this.name = "OtpProviderError"
    this.code = code
  }
}

function resolveDefaultProvider(runtimeEnv: OtpRuntimeEnv): OtpProvider {
  const provider = createDevConsoleOtpProvider(runtimeEnv)

  try {
    provider.environmentGuard(runtimeEnv)
    return provider
  } catch {
    throw new OtpProviderError(
      "OTP_PROVIDER_ENV_BLOCKED",
      "No OTP provider is available for this environment.",
    )
  }
}

export function getOtpProvider(runtimeEnv: OtpRuntimeEnv = readOtpRuntimeEnv()): OtpProvider {
  return resolveDefaultProvider(runtimeEnv)
}

export async function sendOtpViaProvider(
  input: OtpProviderSendInput,
  runtimeEnv: OtpRuntimeEnv = readOtpRuntimeEnv(),
): Promise<OtpProviderSendResult> {
  const provider = getOtpProvider(runtimeEnv)

  if (!provider.supportedChannels.includes(input.channel)) {
    throw new OtpProviderError(
      "OTP_PROVIDER_UNAVAILABLE",
      `OTP channel ${input.channel} is not supported by provider ${provider.providerName}.`,
    )
  }

  return provider.sendOtp(input)
}
