// Gamification system for user engagement
// Handles points, badges, and user statistics

export type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    requirement: number;
    type: 'reports' | 'resolved' | 'photos' | 'precision' | 'streak';
};

// Badge definitions
export const BADGES: Badge[] = [
    {
        id: 'first_reporter',
        name: 'First Reporter',
        description: 'Reported your first issue',
        icon: '🌟',
        requirement: 1,
        type: 'reports'
    },
    {
        id: 'active_citizen',
        name: 'Active Citizen',
        description: 'Reported 10+ issues',
        icon: '🔥',
        requirement: 10,
        type: 'reports'
    },
    {
        id: 'super_reporter',
        name: 'Super Reporter',
        description: 'Reported 50+ issues',
        icon: '💪',
        requirement: 50,
        type: 'reports'
    },
    {
        id: 'problem_solver',
        name: 'Problem Solver',
        description: '5+ issues resolved',
        icon: '✅',
        requirement: 5,
        type: 'resolved'
    },
    {
        id: 'visual_helper',
        name: 'Visual Helper',
        description: '10+ issues with photos',
        icon: '📸',
        requirement: 10,
        type: 'photos'
    },
    {
        id: 'precision_reporter',
        name: 'Precision Reporter',
        description: '80%+ resolution rate',
        icon: '🎯',
        requirement: 80,
        type: 'precision'
    }
];

// Points system
export const POINTS = {
    REPORT_ISSUE: 10,
    ISSUE_RESOLVED: 25,
    ISSUE_DUPLICATE: 5,
    UPLOAD_MEDIA: 5,
    FIRST_OF_MONTH: 50
} as const;

/**
 * Calculate reputation points for a user based on their activity
 */
export function calculateReputationPoints(
    issuesReported: number,
    issuesResolved: number,
    issuesWithPhotos: number = 0,
    issuesMarkedDuplicate: number = 0
): number {
    let points = 0;

    // Points for reporting
    points += issuesReported * POINTS.REPORT_ISSUE;

    // Bonus points for resolved issues
    points += issuesResolved * POINTS.ISSUE_RESOLVED;

    // Points for helpful media
    points += issuesWithPhotos * POINTS.UPLOAD_MEDIA;

    // Points for duplicates (saves city resources)
    points += issuesMarkedDuplicate * POINTS.ISSUE_DUPLICATE;

    return points;
}

/**
 * Check which badges a user has earned
 */
export function checkEarnedBadges(
    issuesReported: number,
    issuesResolved: number,
    issuesWithPhotos: number = 0
): string[] {
    const earnedBadges: string[] = [];

    for (const badge of BADGES) {
        let earned = false;

        switch (badge.type) {
            case 'reports':
                earned = issuesReported >= badge.requirement;
                break;
            case 'resolved':
                earned = issuesResolved >= badge.requirement;
                break;
            case 'photos':
                earned = issuesWithPhotos >= badge.requirement;
                break;
            case 'precision':
                const resolutionRate = issuesReported > 0
                    ? (issuesResolved / issuesReported) * 100
                    : 0;
                earned = resolutionRate >= badge.requirement;
                break;
        }

        if (earned) {
            earnedBadges.push(badge.id);
        }
    }

    return earnedBadges;
}

/**
 * Get badge details by ID
 */
export function getBadge(badgeId: string): Badge | undefined {
    return BADGES.find(b => b.id === badgeId);
}

/**
 * Calculate user statistics from issues
 */
export function calculateUserStats(userId: string, allIssues: any[]) {
    const userIssues = allIssues.filter(issue => issue.user_id === userId);

    const issuesReported = userIssues.length;
    const issuesResolved = userIssues.filter(issue => issue.status === 'resolved').length;
    const issuesWithPhotos = userIssues.filter(issue =>
        issue.photo_url || (issue.photos && issue.photos.length > 0)
    ).length;

    const resolutionRate = issuesReported > 0
        ? Math.round((issuesResolved / issuesReported) * 100)
        : 0;

    const reputationPoints = calculateReputationPoints(
        issuesReported,
        issuesResolved,
        issuesWithPhotos
    );

    const badges = checkEarnedBadges(
        issuesReported,
        issuesResolved,
        issuesWithPhotos
    );

    return {
        issuesReported,
        issuesResolved,
        issuesWithPhotos,
        resolutionRate,
        reputationPoints,
        badges
    };
}
