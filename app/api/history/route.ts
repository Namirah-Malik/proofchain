import { NextResponse } from "next/server";
import { listVerifications } from "@/lib/store";

export async function GET() {
  const records = listVerifications().map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    inputType: r.inputType,
    mainClaim: r.mainClaim,
    originalInput: r.originalInput,
    state: r.state,
    score: r.score?.total ?? null,
    isDemo: r.isDemo,
  }));
  return NextResponse.json(records);
}
