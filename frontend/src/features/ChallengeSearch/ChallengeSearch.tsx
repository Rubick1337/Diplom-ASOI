import React from 'react';
import './ChallengeSearch.css';

interface ChallengeSearchProps {
    value: string;
    onChange: (value: string) => void;
}

const ChallengeSearch: React.FC<ChallengeSearchProps> = ({ value, onChange }) => {
    return (
        <div className="challenge-search">
            <input
                className="challenge-search-input"
                type="text"
                placeholder="Поиск по названию или описанию задачи..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default ChallengeSearch;
