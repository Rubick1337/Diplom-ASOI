'use client';

import React from 'react';

interface BackgroundVideoProps {
    src: string;
    className?: string;
}


export default function  BackgroundVideo ({
                             src,
                             className = ""
                         }: BackgroundVideoProps) {
    return (
        <video
            className={className}
            autoPlay
            muted
            loop
            playsInline
        >
            <source src={src} type="video/mp4" />
        </video>
    );
};

