export function throttle(fn: (...args: any[]) => any, delay = 66) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (...args: Parameters<typeof fn>) {
    if (timer)
      return
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }
}
