'use client';
import React from 'react';
import { Settings, Plus } from 'lucide-react';

interface ConfigProps {
    data: any;
    setData: (field: string, value: any) => void;
    addParameter: () => void;
}

export const ConfigSection = ({ data, setData, addParameter }: ConfigProps) => {
    const updateParam = (index: number, field: string, value: string) => {
        const newParams = [...data.parameters];
        newParams[index][field] = value;
        setData('parameters', newParams);
    };

    return (
        <section className="config-card">
            <h2 className="section-title"><Settings size={20} /> Конфигурация</h2>
            <div className="input-group">
                <label>Название задачи</label>
                <input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Напр: Сумма чисел" />
            </div>
            <div className="row">
                <div className="input-group">
                    <label>Сложность (1-10)</label>
                    <input type="number" min="1" max="10" value={data.difficulty} onChange={e => setData('difficulty', Number(e.target.value))} />
                </div>
                <div className="input-group">
                    <label>Тема</label>
                    <input value={data.topic} onChange={e => setData('topic', e.target.value)} placeholder="Алгоритмы" />
                </div>
            </div>
            <div className="row">
                <div className="input-group">
                    <label>Имя функции</label>
                    <input value={data.funcName} onChange={e => setData('funcName', e.target.value)} />
                </div>
                <div className="input-group">
                    <label>Лимит (мс)</label>
                    <input type="number" value={data.timeLimitMs} onChange={e => setData('timeLimitMs', e.target.value === '' ? '' : Number(e.target.value))} placeholder="2000" />
                </div>
            </div>
            <div className="parameters-section">
                <div className="flex-between">
                    <label>Параметры</label>
                    <button className="btn-add-small" onClick={addParameter}><Plus size={14} /> Добавить</button>
                </div>
                {data.parameters.map((p: any, i: number) => (
                    <div key={i} className="parameter-row">
                        <input placeholder="имя" value={p.name} onChange={e => updateParam(i, 'name', e.target.value)} />
                        <select value={p.dataType} onChange={e => updateParam(i, 'dataType', e.target.value)}>
                            <option value="number">Number</option>
                            <option value="string">String</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                        </select>
                    </div>
                ))}
            </div>
        </section>
    );
};
