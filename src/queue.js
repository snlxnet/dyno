/**
@template T
@param {(data: T) => Promise<void>} cb 
@returns {(data: T) => void }
*/
export function createQueue(cb) {
  const queue = []

  function push(data) {
    queue.push(data)

    if (queue.length === 1) {
      run()
    }
  }

  async function run() {
    const data = queue[0]

    await cb(data)

    queue.shift()
    if (queue.length) {
      run()
    }
  }

  return push
}

