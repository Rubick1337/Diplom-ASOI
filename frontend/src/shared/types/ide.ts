export type LogType = 'info' | 'error' | 'warning' | 'success' | 'system' | 'test';

export interface TerminalLog {
    id: string;
    type: LogType;
    message: string;
    timestamp: string;
}

export interface TestCase {
    id: string;
    title: string;
    status: 'idle' | 'running' | 'success' | 'fail';
    expected: string;
    actual?: string;
    duration?: number;
}

export interface SystemError {
    status: 'error';
    actual: string;
    message: string;
    line: number;
}

export interface ExecuteResponse {
    testResults: any[];
    systemError: SystemError | null;
}

export interface EditorProblem {
    id: string;
    message: string;
    line: number;
    column: number;
    severity: 'Error' | 'Warning';
}

export interface EditorValidation {
    errors: number;
    warnings: number;
    problems: EditorProblem[];
}