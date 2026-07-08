export const isRequired = (value) =>
  value?.trim().length > 0;

export const isValidName = (name) =>
  name.trim().length >= 2;

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email.trim()
  );
};

export const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\s/g, "");

  return /^(\+233|0)\d{9}$/.test(cleaned);
};

export const hasUppercase = (password) =>
  /[A-Z]/.test(password);

export const hasLowercase = (password) =>
  /[a-z]/.test(password);

export const hasNumber = (password) =>
  /\d/.test(password);

export const hasSpecialCharacter = (
  password
) =>
  /[!@#$%^&*(),.?":{}|<>]/.test(
    password
  );

export const hasMinLength = (password) =>
  password.length >= 8;