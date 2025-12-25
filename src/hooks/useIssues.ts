import { useState, useEffect, useCallback } from 'react';
import { localStorageService, Issue } from '../lib/localStorage';

/**
 * Custom hook for issue management
 * Provides issue data fetching, state management, and helper functions
 */
export function useIssues() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    /**
     * Fetch all issues
     */
    const fetchIssues = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await localStorageService.getIssues();

            if (result.error) {
                throw result.error;
            }

            setIssues(result.issues);
        } catch (err) {
            setError(err as Error);
            console.error('Failed to fetch issues:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Create new issue
     */
    const createIssue = useCallback(async (issueData: Partial<Issue>) => {
        try {
            setLoading(true);
            setError(null);
            const result = await localStorageService.createIssue(issueData);

            if (result.error) {
                throw result.error;
            }

            // Refresh issues list
            await fetchIssues();
            return { success: true, issue: result.issue };
        } catch (err) {
            setError(err as Error);
            console.error('Failed to create issue:', err);
            return { success: false, error: err as Error };
        } finally {
            setLoading(false);
        }
    }, [fetchIssues]);

    /**
     * Update issue status
     */
    const updateStatus = useCallback(async (
        issueId: string,
        status: string,
        changedBy: string,
        changedByName: string,
        comment?: string
    ) => {
        try {
            setLoading(true);
            setError(null);
            const result = await localStorageService.updateIssueStatus(
                issueId,
                status,
                changedBy,
                changedByName,
                comment
            );

            if (result.error) {
                throw result.error;
            }

            // Refresh issues list
            await fetchIssues();
            return { success: true, issue: result.issue };
        } catch (err) {
            setError(err as Error);
            console.error('Failed to update status:', err);
            return { success: false, error: err as Error };
        } finally {
            setLoading(false);
        }
    }, [fetchIssues]);

    /**
     * Filter issues by criteria
     */
    const filterIssues = useCallback((criteria: {
        status?: string;
        priority?: string;
        type?: string;
        userId?: string;
    }) => {
        return issues.filter(issue => {
            if (criteria.status && issue.status !== criteria.status) return false;
            if (criteria.priority && issue.priority !== criteria.priority) return false;
            if (criteria.type && issue.issue_type !== criteria.type) return false;
            if (criteria.userId && issue.user_id !== criteria.userId) return false;
            return true;
        });
    }, [issues]);

    /**
     * Get issues by status
     */
    const getIssuesByStatus = useCallback((status: string) => {
        return issues.filter(issue => issue.status === status);
    }, [issues]);

    /**
     * Get issue stats
     */
    const getIssueStats = useCallback(() => {
        const total = issues.length;
        const pending = issues.filter(i => i.status === 'pending').length;
        const inProgress = issues.filter(i => i.status === 'in_progress').length;
        const resolved = issues.filter(i => i.status === 'resolved').length;
        const rejected = issues.filter(i => i.status === 'rejected').length;

        return {
            total,
            pending,
            inProgress,
            resolved,
            rejected,
            resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
        };
    }, [issues]);

    // Auto-fetch on mount
    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    return {
        issues,
        loading,
        error,
        fetchIssues,
        createIssue,
        updateStatus,
        filterIssues,
        getIssuesByStatus,
        getIssueStats
    };
}
