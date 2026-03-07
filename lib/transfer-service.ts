/**
 * Transfer service — one-time code transfer of encrypted archives via Axum server.
 *
 * Flow:
 *   Device A: upload(archive) → { code: "847-291" }
 *   Device B: download("847-291") → archive (one-time, auto-deleted)
 *
 * The archive is already encrypted with the master password (AES-256-GCM).
 * The server never sees plaintext — it only stores an opaque blob with a TTL.
 */

import { serializeArchive, deserializeArchive, type ArchiveBlob } from "./archive-service"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://vault-api.example.com"
const TRANSFER_TTL_MINUTES = 10

export interface TransferLimits {
  maxDevices: number
}

const FREE_TIER: TransferLimits = { maxDevices: 2 }

let baseUrl = DEFAULT_BASE_URL
let limits: TransferLimits = FREE_TIER

export function setTransferServer(url: string): void {
  baseUrl = url.replace(/\/+$/, "")
}

export function getTransferServer(): string {
  return baseUrl
}

export function setTransferLimits(newLimits: TransferLimits): void {
  limits = newLimits
}

export function getTransferLimits(): TransferLimits {
  return limits
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TransferUploadResponse {
  code: string
  expires_at: string
  copies: number
}

export type UploadResult =
  | { ok: true; code: string; expiresAt: string; ttlMinutes: number; copies: number }
  | { ok: false; error: string }

export type DownloadResult =
  | { ok: true; archive: ArchiveBlob }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Upload (Device A)
// ---------------------------------------------------------------------------

export async function uploadArchive(
  archive: ArchiveBlob,
  copies?: number,
): Promise<UploadResult> {
  const maxDevices = limits.maxDevices
  const requestedCopies = Math.min(Math.max(copies ?? maxDevices, 1), maxDevices)
  const payload = serializeArchive(archive)

  try {
    const response = await fetch(`${baseUrl}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload,
        ttl_minutes: TRANSFER_TTL_MINUTES,
        copies: requestedCopies,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      return { ok: false, error: `SERVER_ERROR: ${response.status} ${text}`.trim() }
    }

    const data: TransferUploadResponse = await response.json()
    return {
      ok: true,
      code: data.code,
      expiresAt: data.expires_at,
      ttlMinutes: TRANSFER_TTL_MINUTES,
      copies: data.copies,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "NETWORK_ERROR" }
  }
}

// ---------------------------------------------------------------------------
// Download (Device B)
// ---------------------------------------------------------------------------

export async function downloadArchive(code: string): Promise<DownloadResult> {
  const sanitized = code.replace(/[^0-9-]/g, "")
  if (sanitized.length < 5) {
    return { ok: false, error: "INVALID_CODE" }
  }

  try {
    const response = await fetch(`${baseUrl}/transfer/${sanitized}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
    })

    if (response.status === 404 || response.status === 410) {
      return { ok: false, error: "CODE_EXPIRED_OR_USED" }
    }

    if (!response.ok) {
      return { ok: false, error: `SERVER_ERROR: ${response.status}` }
    }

    const data = await response.json()
    const archive = deserializeArchive(data.payload)
    if (!archive) {
      return { ok: false, error: "INVALID_ARCHIVE" }
    }

    return { ok: true, archive }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "NETWORK_ERROR" }
  }
}
