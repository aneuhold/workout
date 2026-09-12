import { spawnSync } from 'child_process';

/**
 * Runs external commands on behalf of the build and release scripts.
 */
class ScriptCLIService {
  /**
   * Runs a shell command with inherited stdio so the caller sees output live.
   * Throws on a non-zero exit.
   *
   * @param command - The full shell command to execute.
   * @param cwd - Directory to run the command from.
   */
  run(command: string, cwd: string): void {
    console.log(`\n> ${command}\n`);
    const result = spawnSync(command, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    if (result.status !== 0) {
      throw new Error(`Command failed (exit ${result.status ?? 'null'}): ${command}`);
    }
  }

  /**
   * Runs a command and returns its trimmed stdout, or `null` when it exits
   * non-zero. Nothing is written to the terminal, so this suits commands whose
   * output is the point rather than the progress.
   *
   * @param command - The executable to run.
   * @param args - Arguments passed to the executable.
   * @param cwd - Directory to run the command from.
   */
  capture(command: string, args: string[], cwd: string): string | null {
    const result = spawnSync(command, args, { cwd, encoding: 'utf-8' });
    return result.status === 0 ? result.stdout.trim() : null;
  }
}

const scriptCLIService = new ScriptCLIService();
export default scriptCLIService;
