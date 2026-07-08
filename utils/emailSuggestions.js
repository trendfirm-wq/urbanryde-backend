const typoMap = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",

  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",

  "outlok.com": "outlook.com",

  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",

  "icloud.con": "icloud.com",
};

export function suggestEmail(email) {
  const parts = email.split("@");

  if (parts.length !== 2)
    return null;

  const [user, domain] = parts;

  if (typoMap[domain]) {
    return `${user}@${typoMap[domain]}`;
  }

  return null;
}