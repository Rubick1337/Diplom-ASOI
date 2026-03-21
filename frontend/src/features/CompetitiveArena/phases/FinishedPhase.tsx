'use client';

import React from 'react';
import Image from 'next/image';

interface FinishedPhaseProps {
    currentUser: any;
    winner: string | null;
    surrenderInfo: string | null;
    onPlayAgain: () => void;
}

export default function FinishedPhase({ currentUser, winner, surrenderInfo, onPlayAgain }: FinishedPhaseProps) {
    return (
        <div className="battle-finished">
            <div className="battle-result">
                {winner === currentUser.username && !surrenderInfo ? (
                    <><Image src="/images/arena/win1.gif" alt="win" width={80} height={80} /><h1>Вы победили!</h1></>
                ) : winner === currentUser.username && surrenderInfo ? (
                    <><Image src="/images/arena/win1.gif" alt="win" width={80} height={80} /><h1>Вы победили! (соперник сдался)</h1></>
                ) : surrenderInfo === currentUser.username ? (
                    <><Image src="/images/arena/surrender.gif" alt="surrender" width={80} height={80} /><h1>Вы сдались</h1></>
                ) : (
                    <><Image src="/images/arena/lose1.png" alt="lose" width={64} height={64} /><h1>Победил {winner}!</h1></>
                )}
            </div>
            <button className="search-btn" onClick={onPlayAgain}>
                Играть снова
            </button>
        </div>
    );
}
