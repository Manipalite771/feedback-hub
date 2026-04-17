import { setSession } from "@/lib/auth";
import { isIndegeneEmail, formatNameFromEmail } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const trimmed = email.trim().toLowerCase();

  if (!isIndegeneEmail(trimmed)) {
    return NextResponse.json(
      { error: "Only @indegene.com email addresses are allowed" },
      { status: 403 }
    );
  }

  const name = formatNameFromEmail(trimmed);
  await setSession(trimmed, name);

  return NextResponse.json({ email: trimmed, name });
}
