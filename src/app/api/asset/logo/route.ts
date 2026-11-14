import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/logo.svg", req.url));
}
