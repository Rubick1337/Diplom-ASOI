'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import './ChallengeList.css';
import ChallengeCard from '@/widgets/ChallengeCard/ChallengeCard';
import {SkeletonCard} from '@/widgets/SkeletonCard/SkeletonCard';

export interface ChallengeItem {
    id: number;
    name: string;
    description: string;
    difficulty?: number | null;
    timeLimitMs?: number | null;
    topics?: { id: number; name: string }[];
    solvedCount?: number;
    averageRating?: number;
    author?: { username: string };
}

interface ChallengeListProps {
    challenges: ChallengeItem[];
    isLoading?: boolean;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 70, damping: 18 }
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.2 }
    }
};

export default function ChallengeList({ challenges, isLoading }: ChallengeListProps) {
    return (
        <div className="challenge-list-column">
            <AnimatePresence mode="popLayout">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0 }}
                        className="motion-wrapper"
                    >
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="skeleton-wrapper">
                                <SkeletonCard />
                            </div>
                        ))}
                    </motion.div>
                ) : challenges.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="challenge-list-empty"
                    >
                        Задачи не найдены.
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="motion-wrapper"
                    >
                        {challenges.map((challenge) => (
                            <motion.div
                                key={challenge.id}
                                variants={itemVariants}
                                layout
                            >
                                <ChallengeCard {...challenge} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
