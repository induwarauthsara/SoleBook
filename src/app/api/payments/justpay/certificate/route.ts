import { NextRequest } from "next/server";
import { justPayGetCertificate } from "@/lib/seylan/client";
import { requireAuth, handleAuthError } from "@/lib/auth/middleware";

/** Proxies Seylan JustPayGetCertificate — use when the Web API manual requires a certificate step after registration. */
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = (await req.json()) as Parameters<typeof justPayGetCertificate>[0];

    if (
      !body?.Justpay_code ||
      !body?.Retrieval_reference ||
      !body?.Mobile_no ||
      !body?.User_id
    ) {
      return Response.json(
        {
          error:
            "Justpay_code, Retrieval_reference, Mobile_no, and User_id are required",
        },
        { status: 400 },
      );
    }

    const result = await justPayGetCertificate(body);
    return Response.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
