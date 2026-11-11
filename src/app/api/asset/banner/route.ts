import { NextResponse } from "next/server";
// placeholder - real image embedded in next deploy
export const dynamic = "force-static";
export function GET() {
  return NextResponse.redirect(new URL("/logo.svg", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://zabshop.vercel.app"));
}
