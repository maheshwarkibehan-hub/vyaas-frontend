'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserSubscription, deductCredits, COSTS } from '@/lib/subscription';
import { toast } from 'sonner';

export default function ImageGenPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageTokens, setImageTokens] = useState(0);

    React.useEffect(() => {
        const fetchTokens = async () => {
            if (auth.currentUser) {
                const sub = await getUserSubscription(auth.currentUser.uid);
                if (sub) setImageTokens(sub.image_tokens || 0);
            }
        };
        fetchTokens();
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error('Please enter a prompt!');
            return;
        }

        if (!auth.currentUser) {
            toast.error('Please login first!');
            return;
        }

        // Check tokens/credits
        const sub = await getUserSubscription(auth.currentUser.uid);
        if (!sub || ((sub.image_tokens ?? 0) <= 0 && (sub.credits ?? 0) < COSTS.IMAGE_GEN)) {
            toast.error('Not enough image tokens or credits!');
            return;
        }

        setLoading(true);
        try {
            // Deduct credits/tokens
            await deductCredits(auth.currentUser.uid, COSTS.IMAGE_GEN, 'Image Generation', 'image');
            setImageTokens(prev => Math.max(0, prev - 1));

            // TODO: Replace with actual image generation API
            // For now, using placeholder
            const response = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(prompt)}&client_id=YOUR_UNSPLASH_KEY`);

            // Placeholder: Generate a gradient image
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const gradient = ctx.createLinearGradient(0, 0, 512, 512);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 512, 512);

                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(prompt, 256, 256);
            }

            setGeneratedImage(canvas.toDataURL());
            toast.success('Image generated successfully!');
        } catch (error) {
            console.error('Image generation error:', error);
            toast.error('Failed to generate image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `vyaas-ai-${Date.now()}.png`;
        link.click();
        toast.success('Image downloaded!');
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <div className="relative z-10 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        AI Image Generator
                    </h1>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50">
                        <ImageIcon size={16} className="text-blue-400" />
                        <span className="text-blue-400 font-bold">{imageTokens} tokens</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Input Section */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                        <label className="block text-lg font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="text-yellow-400" size={20} />
                            Describe your image
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A futuristic city at sunset with flying cars..."
                            className="w-full h-32 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all resize-none"
                            disabled={loading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate Image
                                </>
                            )}
                        </button>
                    </div>

                    {/* Generated Image */}
                    {generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-xl font-bold mb-4">Generated Image</h2>
                            <div className="relative rounded-xl overflow-hidden bg-black/50">
                                <img
                                    src={generatedImage}
                                    alt="Generated"
                                    className="w-full h-auto"
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                className="mt-4 w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={20} />
                                Download Image
                            </button>
                        </motion.div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                        <h3 className="font-bold text-blue-400 mb-2">💡 Tips for better results:</h3>
                        <ul className="space-y-1 text-white/60 text-sm">
                            <li>• Be specific and descriptive</li>
                            <li>• Mention style, mood, and colors</li>
                            <li>• Include details about lighting and composition</li>
                            <li>• Each generation costs 1 image token or {COSTS.IMAGE_GEN} credits</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
