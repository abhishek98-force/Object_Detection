export async function Delay(time: number) {
  let timeInMilliseconds = time * 1000;
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      console.log('Delay took' + time);
      resolve();
    }, timeInMilliseconds)
  );
}
