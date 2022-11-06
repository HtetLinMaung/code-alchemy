export default function createScript(x = "") {
  return { run: () => eval(x) };
}
