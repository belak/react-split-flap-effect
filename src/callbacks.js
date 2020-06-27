const registry = {};

let currentCounter = -1;

const increment = () => {
  if (currentCounter >= Number.MAX_SAFE_INTEGER) {
    currentCounter = Number.MIN_SAFE_INTEGER;
  } else {
    currentCounter++;
  }

  return currentCounter;
}

const registerCallback = (cb, interval) => {
  if (!registry[interval]) {
    const item = {
      callbacks: {},
    };

    item.handle = setInterval(() => {
      const callbacks = item.callbacks;

      Object.keys(callbacks).forEach((key) => {
        callbacks[key]();
      })
    }, interval);

    registry[interval] = item;
  }

  const id = increment();
  registry[interval].callbacks[id] = cb

  return {
    interval,
    id,
  }
}

const clearCallback = (handle) => {
  const item = registry[handle.interval];
  if (!item) {
    return;
  }

  delete item.callbacks[handle.id];

  if (!Object.keys(item.callbacks).length) {
    delete registry[handle.interval];
  }
}

export { registerCallback, clearCallback }
