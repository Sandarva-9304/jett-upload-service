const MAX_LENGTH = 6;

const subset = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateId() {
  let id = "";
  for (let i = 0; i < MAX_LENGTH; i++) {
    id += subset[Math.floor(Math.random() * subset.length)];
  }
  return id;
}
