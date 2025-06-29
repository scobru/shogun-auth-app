export const truncate = (str, length) => {
  if (!str) {
    return "";
  }
  if (str.length <= length) {
    return str;
  }
  return `${str.substring(0, length)}...`;
}; 