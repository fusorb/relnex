export function cn(...inputs: Array<string | undefined | null | false | number>) {
  return inputs.filter(Boolean).join(" ");
}
