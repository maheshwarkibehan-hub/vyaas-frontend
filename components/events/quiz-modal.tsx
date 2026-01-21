"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const QUESTIONS = [
    { q: "What is the coldest planet in our solar system?", a: ["Mars", "Neptune", "Uranus", "Pluto"], correct: 2 },
    { q: "At what temperature does water freeze?", a: ["0°C", "32°C", "100°C", "-10°C"], correct: 0 },
    { q: "Which AI model powers VYAAS?", a: ["GPT-3", "Gemini", "Claude", "Llama"], correct: 1 },
    { q: "What is the chemical formula for snow?", a: ["H2O", "CO2", "NaCl", "O2"], correct: 0 },
    { q: "Which animal is known as the King of the Arctic?", a: ["Penguin", "Polar Bear", "Walrus", "Arctic Fox"], correct: 1 },
];

export function QuizModal({ userId, isOpen, onClose }: { userId: string, isOpen: boolean, onClose: () => void }) {
    const [currentQ, setCurrentQ] = useState(0);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    function handleAnswer(index: number) {
        if (index === QUESTIONS[currentQ].correct) {
            setScore(s => s + 1);
            toast.success("Correct!");
        } else {
            toast.error("Wrong!");
        }

        if (currentQ < QUESTIONS.length - 1) {
            setCurrentQ(q => q + 1);
        } else {
            setFinished(true);
            // In real app, call API to save score/reward
            toast.success(`Quiz Finished! You scored ${score + (index === QUESTIONS[currentQ].correct ? 1 : 0)}/${QUESTIONS.length}`);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#0b1026] border border-blue-500/30 p-6 rounded-2xl max-w-md w-full relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-blue-100 flex items-center gap-2">
                        <Brain className="text-blue-400" /> Brain Freeze Quiz
                    </h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X /></button>
                </div>

                {!finished ? (
                    <div className="relative z-10">
                        <div className="mb-4 text-sm text-blue-200/60">Question {currentQ + 1} of {QUESTIONS.length}</div>
                        <h4 className="text-lg font-medium text-white mb-6">{QUESTIONS[currentQ].q}</h4>

                        <div className="grid grid-cols-1 gap-3">
                            {QUESTIONS[currentQ].a.map((ans, i) => (
                                <Button
                                    key={i}
                                    onClick={() => handleAnswer(i)}
                                    variant="outline"
                                    className="justify-start text-left border-white/10 hover:bg-blue-500/20 hover:text-blue-200"
                                >
                                    {ans}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center relative z-10 py-8">
                        <div className="text-4xl font-bold text-white mb-2">{score}/{QUESTIONS.length}</div>
                        <p className="text-blue-200 mb-6">Great job! You earned {score * 10} Ice Coins.</p>
                        <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 w-full">Close</Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
