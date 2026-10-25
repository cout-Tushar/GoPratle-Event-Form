import type { CreateResponse, RequirementPayload } from '@/types/requirement';

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
let pendingSubmission: Promise<CreateResponse> | null = null;

async function readJson<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'The request could not be completed.';

    throw new Error(message);
  }

  return body as T;
}

export function createRequirement(payload: RequirementPayload): Promise<CreateResponse> {
  if (pendingSubmission) return pendingSubmission;

  pendingSubmission = fetch(`${baseUrl}/api/requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(readJson<CreateResponse>)
    .catch((error: unknown) => {
      if (error instanceof TypeError) {
        throw new Error('Unable to reach the server. Check your connection and try again.');
      }

      throw error;
    })
    .finally(() => {
      pendingSubmission = null;
    });

  return pendingSubmission;
}
