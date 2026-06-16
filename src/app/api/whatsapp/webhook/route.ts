import { NextResponse } from "next/server"

import { processInboundWhatsappWebhook } from "@/lib/internal/whatsapp/webhook"

type InvalidPayloadResponse = {
  ok: false
  code: "INVALID_PAYLOAD"
  message: string
}

const INVALID_JSON_RESPONSE: InvalidPayloadResponse = {
  ok: false,
  code: "INVALID_PAYLOAD",
  message: "Request body must be valid JSON.",
}

export async function POST(request: Request) {
  const signatureHeader = request.headers.get("x-whatsapp-signature")
  const rawBody = await request.text()

  let payload: unknown

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(INVALID_JSON_RESPONSE, {
      status: 400,
    })
  }

  const result = await processInboundWhatsappWebhook({
    payload,
    rawBody,
    signatureHeader,
  })

  if (result.ok) {
    return NextResponse.json(result)
  }

  return NextResponse.json(result, {
    status: result.httpStatus,
  })
}
