export function userHasRole(user, role) {
  const wanted = String(role || '').toUpperCase();
  if (!wanted) return false;

  const roles = Array.isArray(user?.roles)
    ? user.roles.map((item) => String(item?.code || item).toUpperCase())
    : [];

  return String(user?.role || '').toUpperCase() === wanted || roles.includes(wanted);
}
