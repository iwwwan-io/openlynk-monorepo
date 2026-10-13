export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  error: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_NAME_LENGTH = 2;

export function validateEmail(email: unknown): ValidationResult<string> {
  if (typeof email !== "string" || email.trim() === "") {
    return { success: false, error: "Email wajib diisi" };
  }
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    return { success: false, error: "Format email tidak valid" };
  }
  return { success: true, data: normalized };
}

export function validatePassword(password: unknown): ValidationResult<string> {
  if (typeof password !== "string" || password === "") {
    return { success: false, error: "Kata sandi wajib diisi" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter`,
    };
  }
  return { success: true, data: password };
}

export function validateName(name: unknown): ValidationResult<string> {
  if (typeof name !== "string" || name.trim() === "") {
    return { success: false, error: "Nama lengkap wajib diisi" };
  }
  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    return {
      success: false,
      error: `Nama lengkap minimal ${MIN_NAME_LENGTH} karakter`,
    };
  }
  return { success: true, data: trimmed };
}

export function validateRegisterInput(input: unknown): ValidationResult<RegisterInput> {
  if (typeof input !== "object" || input === null) {
    return { success: false, error: "Data registrasi tidak valid" };
  }

  const record = input as Record<string, unknown>;

  const nameResult = validateName(record["name"]);
  if (!nameResult.success) {
    return nameResult;
  }

  const emailResult = validateEmail(record["email"]);
  if (!emailResult.success) {
    return emailResult;
  }

  const passwordResult = validatePassword(record["password"]);
  if (!passwordResult.success) {
    return passwordResult;
  }

  return {
    success: true,
    data: {
      name: nameResult.data,
      email: emailResult.data,
      password: passwordResult.data,
    },
  };
}

export function validateLoginInput(input: unknown): ValidationResult<LoginInput> {
  if (typeof input !== "object" || input === null) {
    return { success: false, error: "Data login tidak valid" };
  }

  const record = input as Record<string, unknown>;

  const emailResult = validateEmail(record["email"]);
  if (!emailResult.success) {
    return emailResult;
  }

  if (typeof record["password"] !== "string" || record["password"] === "") {
    return { success: false, error: "Kata sandi wajib diisi" };
  }

  return {
    success: true,
    data: {
      email: emailResult.data,
      password: record["password"],
    },
  };
}

export interface SessionCandidate {
  user?: {
    id?: string;
    email?: string;
    name?: string;
  } | null;
}

export function isSessionAuthorized(session: SessionCandidate | null | undefined): boolean {
  if (!session || !session.user) {
    return false;
  }
  return Boolean(session.user.id && session.user.id.trim() !== "" && session.user.email);
}
