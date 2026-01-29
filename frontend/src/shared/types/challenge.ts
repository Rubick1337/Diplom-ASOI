export interface ChallengeParameter {
    name: string;
    type: 'int' | 'string' | 'float' | 'boolean' | 'array' | 'object';
}

export interface ChallengeTestCase {
    id: number | string;
    challengeId: number;
    title: string;
    inputArgs: any;
    expectedOutput: any;
}

export interface Challenge {
    id: number;
    name: string;
    description: string;
    topic: string;
    mode: string;
    funcName: string;
    parameters: ChallengeParameter[];
    timeLimitMs: number;
    sampleInput: string;
    sampleOutput: string;
    testCases: ChallengeTestCase[];
    author?: {
        id: number;
        username: string;
        email: string;
    };
    difficulty?: number | null;
}