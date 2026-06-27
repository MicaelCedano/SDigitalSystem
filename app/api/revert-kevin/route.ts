import { NextResponse } from "next/server";

// Endpoint deshabilitado por auditoría de seguridad 2026-06-27
// Razón: endpoint sin auth permitía mutar BD.
// Ver: wiki/_sistema/github-audit-2026-06-27/

export async function GET() {
  return NextResponse.json(
    { error: "Endpoint deshabilitado por seguridad" },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deshabilitado por seguridad" },
    { status: 410 }
  );
}
