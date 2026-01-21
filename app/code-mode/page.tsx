'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Code2, Play, Copy, Check, Terminal, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getUserSubscription, deductCredits, COSTS } from '@/lib/subscription';
import { toast } from 'sonner';

export default function CodeModePage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [codeTokens, setCodeTokens] = useState(0);

    React.useEffect(() => {
        const fetchTokens = async () => {
            if (auth.currentUser) {
                const sub = await getUserSubscription(auth.currentUser.uid);
                if (sub) setCodeTokens(sub.code_tokens || 0);
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
        if (!sub || ((sub.code_tokens ?? 0) <= 0 && (sub.credits ?? 0) < COSTS.CODE_MODE)) {
            toast.error('Not enough code tokens or credits!');
            return;
        }

        setLoading(true);
        try {
            // Deduct credits/tokens
            await deductCredits(auth.currentUser.uid, COSTS.CODE_MODE, 'Code Generation', 'code');
            setCodeTokens(prev => Math.max(0, prev - 1));

            // TODO: Replace with actual AI code generation API
            // Placeholder code generation
            const placeholderCode = `// ${prompt}\n\nfunction solution() {\n  // TODO: Implement your logic here\n  console.log("Generated code for: ${prompt}");\n  \n  return "Code generated successfully!";\n}\n\n// Example usage\nconst result = solution();\nconsole.log(result);`;

            setGeneratedCode(placeholderCode);
            toast.success('Code generated successfully!');
        } catch (error) {
            console.error('Code generation error:', error);
            toast.error('Failed to generate code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        toast.success('Code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
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
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">
                        AI Code Generator
                    </h1>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50">
                        <Terminal size={16} className="text-green-400" />
                        <span className="text-green-400 font-bold">{codeTokens} tokens</span>
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
                            <Code2 className="text-green-400" size={20} />
                            What code do you need?
                        </label>

                        {/* Language Selector */}
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full mb-4 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all"
                            disabled={loading}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="typescript">TypeScript</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="go">Go</option>
                        </select>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Create a function that sorts an array of numbers..."
                            className="w-full h-32 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-green-500 transition-all resize-none"
                            disabled={loading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="mt-4 w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 rounded-xl font-bold text-lg shadow-lg shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play size={20} />
                                    Generate Code
                                </>
                            )}
                        </button>
                    </div>

                    {/* Generated Code */}
                    {generatedCode && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Code2 size={20} className="text-green-400" />
                                    Generated Code
                                </h2>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={16} className="text-green-400" />
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="relative rounded-xl overflow-hidden bg-black/80 border border-white/10">
                                <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-white/5 border-b border-white/10 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="ml-2 text-xs text-white/60">{language}</span>
                                </div>
                                <pre className="p-6 pt-14 overflow-x-auto">
                                    <code className="text-sm text-green-400 font-mono">
                                        {generatedCode}
                                    </code>
                                </pre>
                            </div>
                        </motion.div>
                    )}

                    {/* Info */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                        <h3 className="font-bold text-green-400 mb-2">💡 Tips for better code:</h3>
                        <ul className="space-y-1 text-white/60 text-sm">
                            <li>• Be specific about what the code should do</li>
                            <li>• Mention input/output requirements</li>
                            <li>• Specify edge cases if needed</li>
                            <li>• Each generation costs 1 code token or {COSTS.CODE_MODE} credits</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
