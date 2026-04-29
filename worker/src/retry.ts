export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      const delay = Math.pow(2, attempt) * 100;
      await new Promise((res) => setTimeout(res, delay));
      attempt++;
    }
  }

  throw new Error("Max retries reached");
}
