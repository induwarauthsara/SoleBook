import { NextRequest } from "next/server";
import { justPaySignMandate } from "@/lib/seylan/client";
import { requireAuth, handleAuthError } from "@/lib/auth/middleware";

/** Proxies Seylan JustPaySignDigitalMandate — optional step per Web API Manual before certain transactions. */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = (await req.json()) as Parameters<typeof justPaySignMandate>[0];

    if (
      !body?.Justpay_code ||
      !body?.Retrieval_reference ||
      !body?.Message_to_sign ||
      !body?.User_id
    ) {
      return Response.json(
        {
          error:
            "Justpay_code, Retrieval_reference, Message_to_sign, and User_id are required",
        },
        { status: 400 },
      );
    }

    const result = await justPaySignMandate(body);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
