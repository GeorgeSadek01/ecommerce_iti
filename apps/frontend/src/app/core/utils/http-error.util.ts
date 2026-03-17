export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const errorObject = error as {
    error?: {
      message?: string;
      errors?: string[];
    };
    message?: string;
  };

  if (errorObject?.error?.message) {
    return errorObject.error.message;
  }

  if (errorObject?.error?.errors?.length) {
    return errorObject.error.errors[0] ?? fallback;
  }

  if (errorObject?.message) {
    return errorObject.message;
  }

  return fallback;
}
