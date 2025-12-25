import { Share2, Copy, MessageCircle, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareIssueButtonProps {
    issueId: string;
    issueType: string;
    issueDescription: string;
}

export default function ShareIssueButton({ issueId, issueType, issueDescription }: ShareIssueButtonProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const issueUrl = `${window.location.origin}/issue/${issueId}`;
    const shareText = `Check out this ${issueType} issue: ${issueDescription.substring(0, 100)}...`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(issueUrl);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setShowMenu(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(issueUrl)}`;
        window.open(twitterUrl, '_blank');
        setShowMenu(false);
    };

    const shareToWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + issueUrl)}`;
        window.open(whatsappUrl, '_blank');
        setShowMenu(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
            >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
            </button>

            {showMenu && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* Share Menu */}
                    <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] animate-slide-up">
                        <button
                            onClick={copyToClipboard}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-5 h-5 text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Copy Link</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={shareToTwitter}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="#1DA1F2" viewBox="0 0 24 24">
                                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                            </svg>
                            <span className="text-sm text-gray-700">Share on Twitter</span>
                        </button>

                        <button
                            onClick={shareToWhatsApp}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-gray-700">Share on WhatsApp</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
