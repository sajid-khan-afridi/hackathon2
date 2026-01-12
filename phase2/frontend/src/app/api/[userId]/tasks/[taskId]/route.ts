/**
 * API route proxy for individual task operations.
 * Proxies requests to FastAPI backend with authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { getJwtToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

type RouteParams = { params: Promise<{ userId: string; taskId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { userId, taskId } = await params;
  const token = await getJwtToken();

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required", status_code: 401, request_id: "" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/${userId}/tasks/${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to connect to backend", status_code: 500, request_id: "" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { userId, taskId } = await params;
  const token = await getJwtToken();

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required", status_code: 401, request_id: "" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(
      `${BACKEND_URL}/api/${userId}/tasks/${taskId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to connect to backend", status_code: 500, request_id: "" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId, taskId } = await params;
  const token = await getJwtToken();

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required", status_code: 401, request_id: "" },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/${userId}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to connect to backend", status_code: 500, request_id: "" },
      { status: 500 }
    );
  }
}
