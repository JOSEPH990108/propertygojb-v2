import "server-only"

import { maskPhone } from "@/lib/auth/otp/phone"
import { isDevelopmentOtpRuntime, readOtpRuntimeEnv } from "@/lib/auth/otp/policy"
import type { OtpProvider, OtpProviderSendInput, OtpRuntimeEnv } from "@/lib/auth/otp/types"

export const DEV_CONSOLE_PROVIDER_NAME = "dev-console"

function assertDevelopmentOnly(runtimeEnv: OtpRuntimeEnv): void {
  if (!isDevelopmentOtpRuntime(runtimeEnv)) {
    throw new Error("DEV_CONSOLE OTP provider is blocked outside development.")
  }
}

export function createDevConsoleOtpProvider(
  runtimeEnv: OtpRuntimeEnv = readOtpRuntimeEnv(),
): OtpProvider {
  return {
    providerName: DEV_CONSOLE_PROVIDER_NAME,
    supportedChannels: ["DEV_CONSOLE"],
    environmentGuard(envToCheck) {
      assertDevelopmentOnly(envToCheck)
    },
    async sendOtp(input: OtpProviderSendInput) {
      assertDevelopmentOnly(runtimeEnv)
      if (input.channel !== "DEV_CONSOLE") {
        return {
          delivered: false,
          providerName: DEV_CONSOLE_PROVIDER_NAME,
          failureReason: "Unsupported channel for DEV_CONSOLE provider.",
        }
      }

      console.info("[OTP_DEV_CONSOLE] OTP emitted", {
        requestId: input.requestId,
        identifier: input.identifier,
        phoneMasked: maskPhone(input.phoneE164),
        purpose: input.purpose,
        ttlSeconds: input.ttlSeconds,
        otpCode: input.otpCode,
      })

      return {
        delivered: true,
        providerName: DEV_CONSOLE_PROVIDER_NAME,
        providerMessageId: `${DEV_CONSOLE_PROVIDER_NAME}:${input.requestId}`,
      }
    },
  }
}
