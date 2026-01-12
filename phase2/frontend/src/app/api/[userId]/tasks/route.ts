/**
 * API route proxy for task list and creation.
 * Proxies requests to FastAPI backend with authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { getJwtToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const token = await getJwtToken();

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required", status_code: 401, request_id: "" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/${userId}/tasks`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to connect to backend", status_code: 500, request_id: "" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const token = await getJwtToken();

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required", status_code: 401, request_id: "" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/${userId}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to connect to backend", status_code: 500, request_id: "" },
      { status: 500 }
    );
  }
}
