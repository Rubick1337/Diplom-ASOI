'use client';
import React from 'react';
import { Info, Lightbulb } from 'lucide-react';

interface DescriptionProps {
    description: string;
    setDescription: (val: string) => void;
    sampleInput: string;
    setSampleInput: (val: string) => void;
    sampleOutput: string;
    setSampleOutput: (val: string) => void;
}

export const DescriptionSection = ({ description, setDescription, sampleInput, setSampleInput, sampleOutput, setSampleOutput }: DescriptionProps) => (
    <section className="description-card">
        <h2 className="section-title"><Info size={20} /> Условие задачи</h2>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание задачи..." />
        <div className="samples-box">
            <h3 className="sub-title"><Lightbulb size={16} /> Примеры для пользователя</h3>
            <div className="samples-grid">
                <div className="input-group">
                    <label>Вход (Sample Input)</label>
                    <input value={sampleInput} onChange={e => setSampleInput(e.target.value)} placeholder="a=5, b=10" />
                </div>
                <div className="input-group">
                    <label>Выход (Sample Output)</label>
                    <input value={sampleOutput} onChange={e => setSampleOutput(e.target.value)} placeholder="15" />
                </div>
            </div>
        </div>
    </section>
);
