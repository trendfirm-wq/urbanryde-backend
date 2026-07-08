import {
  hasUppercase,
  hasLowercase,
  hasNumber,
  hasSpecialCharacter,
  hasMinLength,
} from "./validators";

export default function getPasswordStrength(
  password
) {
  let score = 0;

  if (hasMinLength(password))
    score++;

  if (hasUppercase(password))
    score++;

  if (hasLowercase(password))
    score++;

  if (hasNumber(password))
    score++;

  if (hasSpecialCharacter(password))
    score++;

  if (score <= 2)
    return "Weak";

  if (score <= 4)
    return "Medium";

  return "Strong";
}