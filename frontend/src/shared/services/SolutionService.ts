import $api from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/apiEndpoints';

export interface VoteSummary {
    likes: number;
    dislikes: number;
    myVote: 1 | -1 | null;
}

export interface SolutionComment {
    id: number;
    solutionId: number;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: { id: number; username: string };
}

export interface CommentsPage {
    total: number;
    page: number;
    pageSize: number;
    comments: SolutionComment[];
}

const SolutionService = {
    async getVotes(solutionId: number, userId?: number): Promise<VoteSummary> {
        const params = userId ? { userId } : {};
        const { data } = await $api.get(API_ENDPOINTS.SOLUTION.VOTES(solutionId), { params });
        return data;
    },

    async vote(solutionId: number, userId: number, vote: 1 | -1): Promise<VoteSummary> {
        const { data } = await $api.post(API_ENDPOINTS.SOLUTION.VOTES(solutionId), { userId, vote });
        return data;
    },

    async removeVote(solutionId: number, userId: number): Promise<VoteSummary> {
        const { data } = await $api.delete(API_ENDPOINTS.SOLUTION.VOTES(solutionId), { data: { userId } });
        return data;
    },

    async getComments(solutionId: number, page = 1, pageSize = 20): Promise<CommentsPage> {
        const { data } = await $api.get(API_ENDPOINTS.SOLUTION.COMMENTS(solutionId), { params: { page, pageSize } });
        return data;
    },

    async addComment(solutionId: number, userId: number, content: string): Promise<SolutionComment> {
        const { data } = await $api.post(API_ENDPOINTS.SOLUTION.COMMENTS(solutionId), { userId, content });
        return data;
    },

    async deleteComment(solutionId: number, commentId: number, userId: number): Promise<void> {
        await $api.delete(API_ENDPOINTS.SOLUTION.COMMENT(solutionId, commentId), { data: { userId } });
    },
};

export default SolutionService;
