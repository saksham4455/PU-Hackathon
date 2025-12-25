import { Trophy, Award } from 'lucide-react';
import { getBadge } from '../lib/gamification';

interface UserStatsWidgetProps {
    reputationPoints: number;
    badges: string[];
    issuesReported: number;
    issuesResolved: number;
    resolutionRate: number;
}

// Compact Horizontal Card Design
export default function UserStatsWidget({
    reputationPoints,
    badges,
    issuesReported,
    issuesResolved,
    resolutionRate
}: UserStatsWidgetProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Your Impact</h3>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">⭐ {reputationPoints}</div>
                    <div className="text-xs text-gray-600">Points</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{issuesReported}</div>
                    <div className="text-xs text-gray-600">Reported</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{issuesResolved}</div>
                    <div className="text-xs text-gray-600">Resolved</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{resolutionRate}%</div>
                    <div className="text-xs text-gray-600">Rate</div>
                </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <Award className="w-4 h-4 text-gray-500" />
                    <div className="flex gap-1">
                        {badges.slice(0, 4).map((badgeId) => {
                            const badge = getBadge(badgeId);
                            return badge ? (
                                <span key={badgeId} className="text-xl" title={badge.name}>
                                    {badge.icon}
                                </span>
                            ) : null;
                        })}
                        {badges.length > 4 && (
                            <span className="text-sm text-gray-500">+{badges.length - 4}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
