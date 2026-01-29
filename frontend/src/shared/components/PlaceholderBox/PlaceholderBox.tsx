import React from 'react';
import './PlaceholderBox.css';

interface Props {
    title: string;
}

const PlaceholderBox: React.FC<Props> = ({ title}) => {
    return (
        <div className="placeholder-box">
            {title}
        </div>
    );
};

export default PlaceholderBox;
