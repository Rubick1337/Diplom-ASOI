import React from 'react';
import Image from 'next/image';
import './LockedOverlay.css';

interface LockedOverlayProps {
    title: string;
    description: string;
}

export default function LockedOverlay({ title, description }: LockedOverlayProps) {
    return (
        <div className="locked-overlay">
            <div className="locked-content">
                <div className="locked-icon-wrapper">
                    <Image
                        src="/images/locked/lock.png"
                        alt="Locked"
                        width={40}
                        height={40}
                    />
                </div>
                <h3>{title}</h3>
                <p className="locked-description">{description}</p>
            </div>
        </div>
    );
}
