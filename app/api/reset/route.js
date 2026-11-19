import { NextResponse } from "next/server";
import { store } from "@/lib/store.mjs";
export const dynamic = "force-dynamic";
const fail = (e) => NextResponse.json({ error: e.message }, { status: e.status || 500 });
export async function POST() {
  try { store.reset(); return NextResponse.json({ ok: true }); } catch (e) { return fail(e); }
}
