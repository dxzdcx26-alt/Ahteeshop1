import { NextResponse } from "next/server";
export const dynamic = "force-static";
export function GET() {
  return new NextResponse(null, { status: 204 });
}
