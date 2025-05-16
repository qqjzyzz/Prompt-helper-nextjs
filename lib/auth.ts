import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = cookies();
  const session = cookieStore.get("session");
  return session ? JSON.parse(session.value) : null;
}

export async function setSession(data: any) {
  const cookieStore = cookies();
  cookieStore.set("session", JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}