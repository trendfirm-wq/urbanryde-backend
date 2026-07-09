exports.validateProfile = (body, user) => {
  const errors = {};

  // -------------------
  // Full Name
  // -------------------

  if (
    body.full_name !== undefined &&
    body.full_name.trim().length < 2
  ) {
    errors.full_name =
      "Full name must contain at least 2 characters.";
  }

  // -------------------
  // Email
  // -------------------
if (
  user.provider === "google" &&
  body.email !== undefined
) {
  errors.email =
    "Google email cannot be changed.";
}
  if (
    user.provider === "local" &&
    body.email !== undefined
  ) {
    const email =
      body.email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.email =
        "Please enter a valid email address.";
    }
  }

  // -------------------
  // Ghana Phone
  // -------------------

  if (body.phone !== undefined) {
    const phone =
      body.phone.replace(/\s/g, "");

   const phoneRegex =
  /^(\+233|233|0)\d{9}$/;

    if (!phoneRegex.test(phone)) {
      errors.phone =
        "Please enter a valid Ghana phone number.";
    }
  }

  // -------------------
  // Driver
  // -------------------

  if (user.role === "driver") {
    if (
      body.plate_number &&
      body.plate_number.length < 5
    ) {
      errors.plate_number =
        "Invalid plate number.";
    }

    if (
      body.driver_license &&
      body.driver_license.length < 5
    ) {
      errors.driver_license =
        "Invalid driver's license.";
    }
  }

  return errors;
};