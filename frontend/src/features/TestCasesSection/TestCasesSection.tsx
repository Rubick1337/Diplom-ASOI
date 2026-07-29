'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Plus } from 'lucide-react';

interface TestsProps {
    testCases: any[];
    setTestCases: (tests: any[]) => void;
    parameters: any[];
    addTestCase: () => void;
}

export const TestCasesSection = ({ testCases, setTestCases, parameters, addTestCase }: TestsProps) => {
    const updateTest = (index: number, field: string, value: any) => {
        const newTests = [...testCases];
        newTests[index][field] = value;
        setTestCases(newTests);
    };

    const updateArg = (testIdx: number, argIdx: number, value: string) => {
        const newTests = [...testCases];
        newTests[testIdx].testArgs[argIdx].value = value;
        setTestCases(newTests);
    };

    return (
        <section className="tests-card">
            <div className="flex-between">
                <h2 className="section-title"><Beaker size={20} /> Тест-кейсы</h2>
                <button className="btn-add-small" onClick={addTestCase}><Plus size={14} /> Новый тест</button>
            </div>
            <div className="tests-scroll-area">
                <AnimatePresence>
                    {testCases.map((tc, tcIdx) => (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={tcIdx} className="test-item">
                            <div className="test-header">
                                <input className="test-title-input" value={tc.title} onChange={e => updateTest(tcIdx, 'title', e.target.value)} />
                                <button className="btn-delete" onClick={() => setTestCases(testCases.filter((_, i) => i !== tcIdx))}>
                                    <img src="/images/trash.png" alt="del" style={{width:'14px',height:'14px',verticalAlign:'middle'}} />
                                </button>
                            </div>
                            <div className="test-args-grid">
                                {tc.testArgs.map((arg: any, argIdx: number) => (
                                    <div key={argIdx} className="arg-input">
                                        <span>{parameters[argIdx]?.name || 'arg'}:</span>
                                        <input value={arg.value} onChange={e => updateArg(tcIdx, argIdx, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                            <div className="expected-output">
                                <label>Expected:</label>
                                <input value={tc.expectedOutput} onChange={e => updateTest(tcIdx, 'expectedOutput', e.target.value)} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};
