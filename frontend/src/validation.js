// Shared validation patterns, kept in one place so password/email rules only need to change here.
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,13}$/;
export const EMAIL_RE = /^[\w.+-]+@[A-Za-z\d-]+\.[A-Za-z]{2,}$/;
