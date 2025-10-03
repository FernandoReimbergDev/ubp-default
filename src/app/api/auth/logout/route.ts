import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = new NextResponse(JSON.stringify({ success: true, message: "Logout realizado com sucesso." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    response.cookies.set("auth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Erro ao deslogar:", error);
    return NextResponse.json({ success: false, message: "Erro ao realizar logout." }, { status: 500 });
  }
}
