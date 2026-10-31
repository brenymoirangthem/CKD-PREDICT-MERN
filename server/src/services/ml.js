import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const ML_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../ml');

export function runPython(args = [], input) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.env.PYTHON_BIN || 'python', ['predict.py', ...args], { cwd: ML_DIR });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', () => reject(Object.assign(new Error('Python not found. Set PYTHON_BIN in server/.env'), { status: 500 })));
    p.on('close', (code) => {
      if (code !== 0) return reject(Object.assign(new Error(err.trim().split('\n').pop() || 'ML service failed. Did you run train.py?'), { status: 500 }));
      try { resolve(JSON.parse(out.trim().split('\n').pop())); } catch { reject(new Error('Invalid ML output')); }
    });
    if (input) p.stdin.write(JSON.stringify(input));
    p.stdin.end();
  });
}
