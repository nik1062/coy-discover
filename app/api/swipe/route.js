import { NextResponse } from "next/server";
import { store } from "@/lib/store.mjs";
export const dynamic = "force-dynamic";
const fail = (e) => NextResponse.json({ error: e.message }, { status: e.status || 500 });
export async function POST(req) {
  try {
    const { profileId, direction } = await req.json().catch(() => ({}));
    return NextResponse.json(store.swipe(profileId, direction));
  } catch (e) { return fail(e); }
}
