import { NextRequest, NextResponse } from "next/server";
import { deleteVerification, getVerification } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getVerification(id);
  if (!record) {
    return NextResponse.json({ error: "Verification not found." }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = deleteVerification(id);
  if (!ok) {
    return NextResponse.json({ error: "Verification not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
