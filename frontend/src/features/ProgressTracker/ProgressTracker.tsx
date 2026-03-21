'use client';

import React from 'react';
import './ProgressTracker.css';

interface ChallengeProgress {
    passed: number;
    total: number;
    solved: boolean;
}

interface ProgressTrackerProps {
    opponent: { username: string } | null;
    challenges: any[];
    opponentProgress: { [challengeId: number]: ChallengeProgress };
    myProgress: { [challengeId: number]: ChallengeProgress };
}

export default function ProgressTracker({ opponent, challenges, opponentProgress, myProgress }: ProgressTrackerProps) {
    const mySolved = Object.values(myProgress).filter(p => p.solved).length;
    const oppSolved = Object.values(opponentProgress).filter(p => p.solved).length;

    return (
        <div className="progress-tracker">
            <div className="tracker-header">
                <div className="tracker-player">
                    <span className="tracker-player-label">Вы</span>
                    <span className="tracker-player-score">{mySolved}/{challenges.length}</span>
                </div>
                <span className="tracker-vs">VS</span>
                <div className="tracker-player tracker-player-right">
                    <span className="tracker-player-score">{oppSolved}/{challenges.length}</span>
                    <span className="tracker-player-label">{opponent?.username ?? '...'}</span>
                </div>
            </div>

            <div className="tracker-challenges">
                {challenges.map((c, i) => {
                    const myP = myProgress[c.id];
                    const oppP = opponentProgress[c.id];

                    const myTotal = myP?.total ?? c.testCases?.length ?? 0;
                    const oppTotal = oppP?.total ?? c.testCases?.length ?? 0;
                    const myPassed = myP?.passed ?? 0;
                    const oppPassed = oppP?.passed ?? 0;

                    const myPct = myTotal > 0 ? Math.round((myPassed / myTotal) * 100) : 0;
                    const oppPct = oppTotal > 0 ? Math.round((oppPassed / oppTotal) * 100) : 0;

                    const myHasError = myP && !myP.solved && myP.total > 0 && myP.passed < myP.total;
                    const oppHasError = oppP && !oppP.solved && oppP.total > 0 && oppP.passed < oppP.total;

                    return (
                        <div key={c.id} className="tracker-challenge-block">
                            <div className="tracker-challenge-name">Задача {i + 1}: {c.name}</div>

                            <div className="tracker-row">
                                <span className="tracker-label">Вы</span>
                                <div className="tracker-bar-wrap">
                                    <div
                                        className={`tracker-bar-fill my-fill ${myP?.solved ? 'solved' : ''} ${myHasError ? 'error' : ''}`}
                                        style={{ width: `${myPct}%` }}
                                    />
                                </div>
                                <span className="tracker-val">
                                    {myTotal > 0 ? `${myPassed}/${myTotal}` : '—'}
                                </span>
                            </div>

                            <div className="tracker-row">
                                <span className="tracker-label">{opponent?.username?.slice(0, 8) ?? '...'}</span>
                                <div className="tracker-bar-wrap">
                                    <div
                                        className={`tracker-bar-fill opp-fill ${oppP?.solved ? 'solved' : ''} ${oppHasError ? 'error' : ''}`}
                                        style={{ width: `${oppPct}%` }}
                                    />
                                </div>
                                <span className="tracker-val">
                                    {oppTotal > 0 ? `${oppPassed}/${oppTotal}` : '—'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
