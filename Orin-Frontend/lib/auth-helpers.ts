export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Password should be at least 6 characters long': 'Password must be at least 6 characters.',
  'Signup requires a valid password': 'Please enter a valid password.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  'Rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
  'Invalid email': 'Please enter a valid email address.',
  'Email address is not confirmed': 'Please confirm your email address before signing in.',
};

export function getFriendlyErrorMessage(error: { message?: string; status?: number } | null): string {
  if (!error?.message) return 'An unexpected error occurred. Please try again.';
  if (error.status === 429) return 'Too many requests. Please wait a moment and try again.';
  return AUTH_ERROR_MESSAGES[error.message] || error.message;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very strong', color: 'bg-emerald-600' };
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export function validateSignUpPassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters for security.';
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Include at least one number.';
  return null;
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Full name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (name.trim().length > 100) return 'Name must be under 100 characters.';
  return null;
}
