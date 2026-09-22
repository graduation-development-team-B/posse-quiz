export interface ConsoleResult {
  status: 'success' | 'syntaxError' | 'runtimeError' | 'timeout' | 'outputLimit' | 'unavailable';
  lines: string[];
  message?: string;
}
export const CONSOLE_TIMEOUT_MS = 1500;

/** 候補選択で組み立てた教材コード用。自由入力の汎用実行環境ではない。 */
export function buildConsoleWorkerSource(code: string): string {
  return `"use strict";
const send = self.postMessage.bind(self);
const lines = [];
let limited = false;
const output = (...args) => {
  if (lines.length >= 60) { limited = true; throw new Error("出力が60行を超えました"); }
  const text = args.map(value => String(value)).join(" ");
  if (text.length > 2000) { limited = true; throw new Error("1行の出力が長すぎます"); }
  lines.push(text);
};
// 教材は同期計算だけを使う。DOM・StorageはWorkerに存在せず、通信APIも使わせない。
for (const key of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "Worker", "SharedWorker"]) {
  Object.defineProperty(self, key, { value: undefined, writable: false, configurable: false });
}
const console = Object.freeze({ log: output, warn: output, error: output });
try {
  (() => {\n${code}\n})();
  send({ status: "success", lines });
} catch (error) {
  send({ status: limited ? "outputLimit" : "runtimeError", lines, message: error instanceof Error ? error.name + ": " + error.message : String(error) });
}`;
}

/** 実行ごとにWorkerを破棄する。古い実行結果を適用しないためcancelも返す。 */
export function runConsoleCode(code: string): { result: Promise<ConsoleResult>; cancel: () => void } {
  let cancel = () => {};
  const result = new Promise<ConsoleResult>(resolve => {
    if (typeof Worker === 'undefined') {
      resolve({ status: 'unavailable', lines: [], message: 'このブラウザではコードを実行できません。' });
      return;
    }
    let worker: Worker | undefined;
    let url: string | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const finish = (value: ConsoleResult) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker?.terminate();
      if (url) URL.revokeObjectURL(url);
      resolve(value);
    };
    cancel = () => finish({ status: 'unavailable', lines: [], message: '実行を中止しました。' });
    try {
      url = URL.createObjectURL(new Blob([buildConsoleWorkerSource(code)], { type: 'text/javascript' }));
      worker = new Worker(url);
      worker.onmessage = event => finish(event.data as ConsoleResult);
      worker.onerror = event => {
        event.preventDefault();
        finish({ status: event.message.includes('SyntaxError') ? 'syntaxError' : 'runtimeError', lines: [], message: event.message });
      };
      timer = setTimeout(() => finish({ status: 'timeout', lines: [], message: '実行時間の上限を超えました。' }), CONSOLE_TIMEOUT_MS);
    } catch {
      finish({ status: 'unavailable', lines: [], message: '実行環境を開始できませんでした。ブラウザの設定を確認してください。' });
    }
  });
  return { result, cancel: () => cancel() };
}
