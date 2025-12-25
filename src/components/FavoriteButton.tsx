import { Heart } from 'lucide-react';
import { useState } from 'react';

interface FavoriteButtonProps {
    issueId: string;
    isFavorite: boolean;
    onToggle: (issueId: string) => void;
}

export default function FavoriteButton({ issueId, isFavorite, onToggle }: FavoriteButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        setIsAnimating(true);
        onToggle(issueId);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isFavorite
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isAnimating ? 'scale-110' : 'scale-100'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                className={`w-5 h-5 transition-all ${isFavorite ? 'fill-red-600' : 'fill-none'
                    } ${isAnimating ? 'animate-bounce-gentle' : ''}`}
            />
            <span className="text-sm font-medium">
                {isFavorite ? 'Favorited' : 'Favorite'}
            </span>
        </button>
    );
}
