type RandomFunction = () => Promise<number>;

export async function shuffle<T>(randomFn: RandomFunction, array: T[]): Promise<T[]> {
  const result = [...array];
  const length = result.length;
  for (let i = length - 1; i > 0; i--) {
    const randomIndex = Math.floor((await randomFn()) * (i + 1));
    const [first, second] = [result[i], result[randomIndex]];
    if (first !== undefined && second !== undefined) {
      [result[i], result[randomIndex]] = [second, first];
    }
  }
  return result;
}

export async function generateRandomId(randomFn: RandomFunction, length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor((await randomFn()) * chars.length);
    result += chars[randomIndex] ?? '';
  }
  return result;
}

export async function sampleSize<T>(randomFn: RandomFunction, array: T[], count: number): Promise<T[]> {
  if (count > array.length) {
    throw new RangeError('sampleSize: more elements taken than available');
  }
  const result: T[] = [];
  const takenIndices: Record<number, number> = {};
  let availableLength = array.length;
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor((await randomFn()) * availableLength);
    const selectedIndex = randomIndex in takenIndices ? takenIndices[randomIndex] : randomIndex;
    if (selectedIndex !== undefined && array[selectedIndex] !== undefined) {
      result.push(array[selectedIndex]);
    }
    availableLength--;
    takenIndices[randomIndex] = takenIndices[availableLength] ?? availableLength;
  }
  return result;
}
