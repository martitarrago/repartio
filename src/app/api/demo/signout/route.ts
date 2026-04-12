import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/login", new URL(request.url).origin)
  );
  response.cookies.delete("repartio-session");
  return response;
}
