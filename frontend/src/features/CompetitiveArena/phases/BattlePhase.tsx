'use client';

import React from 'react';
import Image from 'next/image';
import ChallengeWorkspace from '@/widgets/ChallengeWorkspace/ChallengeWorkspace';
import ChatPanel from '@/features/ChatPanel/ChatPanel';
import ProgressTracker from '@/features/ProgressTracker/ProgressTracker';

interface BattlePhaseProps {
    socket: any;
    currentUser: any;
    battleChallenges: any[];
    activeTab: number;
    setActiveTab: (v: number) => void;
    activeTabRef: React.MutableRefObject<number>;
    myProgress: any;
    opponentProgress: any;
    opponent: any;
    roomIdRef: React.MutableRefObject<string>;
    showSurrenderConfirm: boolean;
    setShowSurrenderConfirm: (v: boolean) => void;
    onBattleUpdate: (data: any) => void;
    onSurrender: () => void;
}

export default function BattlePhase({
    socket,
    currentUser,
    battleChallenges,
    activeTab,
    setActiveTab,
    activeTabRef,
    myProgress,
    opponentProgress,
    opponent,
    roomIdRef,
    showSurrenderConfirm,
    setShowSurrenderConfirm,
    onBattleUpdate,
    onSurrender,
}: BattlePhaseProps) {
    return (
        <main className="competitive-arena">
            <div className="arena-main-content">
                <div className="battle-tabs-nav">
                    {battleChallenges.map((c, i) => (
                        <button
                            key={c.id}
                            className={`battle-tab ${activeTab === i ? 'active' : ''} ${myProgress[c.id]?.solved ? 'solved' : ''}`}
                            onClick={() => { setActiveTab(i); activeTabRef.current = i; }}
                        >
                            Задача {i + 1}: {c.name}{myProgress[c.id]?.solved && ' ✓'}
                        </button>
                    ))}
                    <button className="surrender-btn" onClick={() => setShowSurrenderConfirm(true)}>
                        <Image src="/images/arena/surrender.gif" alt="" width={16} height={16} style={{ marginRight: 6 }} />
                        Сдаться
                    </button>
                </div>

                {showSurrenderConfirm && (
                    <div className="password-modal">
                        <div className="password-modal-inner">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Image src="/images/arena/surrender.gif" alt="" width={56} height={56} />
                                <h3 style={{ margin: 0 }}>Сдаться?</h3>
                            </div>
                            <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 16px', textAlign: 'center' }}>
                                Соперник получит победу. Вы уверены?
                            </p>
                            <div className="password-modal-buttons">
                                <button
                                    className="btn-apply"
                                    style={{ flex: 1, maxWidth: 'none', background: 'linear-gradient(135deg, #ff4444, #cc0000)', boxShadow: 'none' }}
                                    onClick={() => { setShowSurrenderConfirm(false); onSurrender(); }}
                                >
                                    Да, сдаться
                                </button>
                                <button className="btn-reset" style={{ flex: 1 }} onClick={() => setShowSurrenderConfirm(false)}>
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {battleChallenges[activeTab] && (
                    <ChallengeWorkspace
                        key={`${battleChallenges[activeTab].id}_${activeTab}`}
                        manualChallenge={battleChallenges[activeTab]}
                        isCompetitive={true}
                        onBattleUpdate={onBattleUpdate}
                    />
                )}
            </div>

            <aside className="arena-sidebar">
                <ProgressTracker
                    opponent={opponent}
                    challenges={battleChallenges}
                    opponentProgress={opponentProgress}
                    myProgress={myProgress}
                />
                <ChatPanel
                    socket={socket}
                    roomId={roomIdRef.current}
                    username={currentUser.username}
                />
            </aside>
        </main>
    );
}
