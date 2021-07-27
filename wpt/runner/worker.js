import { createRequire } from 'module';
import { runInThisContext } from 'vm';
import { parentPort, workerData } from 'worker_threads';
import { ResourceLoader } from './WPT.js';
import { localStorage } from '../../dist/localStorage.js';
import { sessionStorage } from '../../dist/sessionStorage.js';
import { DOMException } from '../../dist/Utility/DOMException.js';
import { StorageEvent } from '../../dist/StorageEvent.js';

globalThis.localStorage = localStorage;
globalThis.sessionStorage = sessionStorage;
globalThis.DOMException = DOMException;
globalThis.StorageEvent = StorageEvent;

globalThis.window = globalThis;

const resource = new ResourceLoader(workerData.wptPath);

global.self = global;
global.GLOBAL = {
  isWindow() { return false; }
};
global.require = createRequire(import.meta.url);

// This is a mock, because at the moment fetch is not implemented
// in Node.js, but some tests and harness depend on this to pull
// resources.
global.fetch = function fetch(file) {
  return resource.read(workerData.testRelativePath, file, true);
};

if (workerData.initScript) {
  runInThisContext(workerData.initScript, {
    importModuleDynamically: async (r) => {
      return await import(r);
    }
  });
}

runInThisContext(workerData.harness.code, {
  filename: workerData.harness.filename,
  importModuleDynamically: async (r) => {
    return await import(r);
  }
});

// eslint-disable-next-line no-undef
add_result_callback((result) => {
  parentPort.postMessage({
    type: 'result',
    result: {
      status: result.status,
      name: result.name,
      message: result.message,
      stack: result.stack,
    },
  });
});

// eslint-disable-next-line no-undef
add_completion_callback((_, status) => {
  parentPort.postMessage({
    type: 'completion',
    status,
  });
});

for (const scriptToRun of workerData.scriptsToRun) {
  runInThisContext(scriptToRun.code, { filename: scriptToRun.filename });
}