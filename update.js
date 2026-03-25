const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'components', 'app', 'welcome-view.tsx');
let content = fs.readFileSync(file, 'utf8');

// Colors
content = content.replace(/bg-neon-green\/5/g, 'bg-white/5');
content = content.replace(/bg-purple-500\/5/g, 'bg-neutral-500/10');
content = content.replace(/text-neon-green/g, 'text-white');

// Buttons
content = content.replace('className="relative w-full md:w-auto px-8 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 rounded-2xl text-white font-bold text-lg border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none"', 
'className="relative w-full md:w-auto px-8 py-4 bg-[#ffffff] backdrop-blur-xl hover:bg-[#e6e6e6] rounded-2xl text-black font-bold text-lg border-b-[6px] border-[#cccccc] shadow-[0_15px_30px_rgba(255,255,255,0.15),inset_0_2px_4px_rgba(255,255,255,1)] transition-all active:border-b-0 active:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed"');

content = content.replace(/className="relative w-full max-w-xs md:max-w-none md:w-auto px-8 py-3 md:py-4 bg-\[#1a1a1a\]\/80 backdrop-blur-xl hover:bg-\[#252525\]\/80 border border-white\/30 rounded-xl font-medium text-base md:text-lg text-white hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2 justify-center shadow-\[0_0_15px_rgba\(255,255,255,0\.05\),inset_0_1px_0_rgba\(255,255,255,0\.1\)\] before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white\/5 before:to-transparent before:pointer-events-none"/g,
'className="relative w-full max-w-xs md:max-w-none md:w-auto px-8 py-3 md:py-4 bg-[#111111] backdrop-blur-xl hover:bg-[#1a1a1a] rounded-2xl font-bold text-base md:text-lg text-white border-b-[4px] border-[#000000] shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] transition-all active:border-b-0 active:translate-y-[4px] flex items-center gap-2 justify-center"');

content = content.replace('className="relative w-full md:w-auto px-8 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 border border-white/30 rounded-2xl text-white font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all flex items-center gap-2 justify-center before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"',
'className="relative w-full md:w-auto px-8 py-4 bg-[#111111] backdrop-blur-xl hover:bg-[#1a1a1a] rounded-2xl text-white font-bold text-lg border-b-[4px] border-[#000000] shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] transition-all flex items-center gap-2 justify-center active:border-b-0 active:translate-y-[4px]"');

content = content.replace('className="relative px-8 py-4 bg-[#1a1a1a]/80 backdrop-blur-xl hover:bg-[#252525]/80 text-white rounded-xl font-bold text-lg border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:scale-105 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none"',
'className="relative px-8 py-4 bg-[#ffffff] backdrop-blur-xl hover:bg-[#e6e6e6] text-black rounded-2xl font-bold text-lg border-b-[6px] border-[#cccccc] shadow-[0_15px_30px_rgba(255,255,255,0.15),inset_0_2px_4px_rgba(255,255,255,1)] transition-all active:border-b-0 active:translate-y-[6px]"');

// Cards
const oldFeatureCardRegex = /const FeatureCard = [\s\S]*?\)\s*;\s*\n/m;
const newFeatureCard = `const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (\n    <motion.div\n        initial={{ opacity: 0, y: 30 }}\n        whileInView={{ opacity: 1, y: 0 }}\n        viewport={{ once: true }}\n        transition={{ duration: 0.6, delay }}\n        whileHover={{ scale: 1.02, y: -5 }}\n        className="p-6 rounded-3xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all group shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]"\n    >\n        <div className="w-14 h-14 rounded-2xl bg-[#111111] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 flex items-center justify-center mb-4 group-hover:bg-[#1a1a1a] transition-colors">\n            <Icon size={28} className="text-white" />\n        </div>\n        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>\n        <p className="text-white/60 leading-relaxed font-light">{desc}</p>\n    </motion.div>\n);\n`;
content = content.replace(oldFeatureCardRegex, newFeatureCard);

const oldPlanCardRegex = /const PlanCard = [\s\S]*?\)\s*;\s*\n/m;
const newPlanCard = `const PlanCard = ({ name, price, features, popular, delay }: { name: string, price: string, features: string[], popular?: boolean, delay: number }) => (\n    <motion.div\n        initial={{ opacity: 0, scale: 0.9 }}\n        whileInView={{ opacity: 1, scale: 1 }}\n        viewport={{ once: true }}\n        transition={{ duration: 0.5, delay }}\n        whileHover={{ scale: 1.02 }}\n        className={\`relative p-8 rounded-[2rem] backdrop-blur-2xl transition-all \${popular ? 'bg-[#ffffff] text-black shadow-[0_30px_60px_rgba(255,255,255,0.15),inset_0_2px_4px_rgba(255,255,255,1)] border-b-[8px] border-[#cccccc] -translate-y-2' : 'bg-[#111111] text-white border-b-4 border-black shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]'}\`}\n    >\n        {popular && (\n            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">\n                <Sparkles size={14} fill="currentColor" /> POPULAR\n            </div>\n        )}\n        <h3 className={\`text-2xl font-bold mb-2 tracking-tight \${popular ? 'text-black' : 'text-white'}\`}>{name}</h3>\n        <div className="flex items-baseline gap-2 mb-6">\n            <span className={\`text-4xl font-bold \${popular ? 'text-black' : 'text-white'}\`}>₹{price}</span>\n            <span className={\`font-light \${popular ? 'text-black/60' : 'text-white/40'}\`}>/month</span>\n        </div>\n        <ul className="space-y-3 mb-6">\n            {features.map((feature, idx) => (\n                <li key={idx} className={\`flex items-start gap-3 \${popular ? 'text-black/80' : 'text-white/70'}\`}>\n                    <Zap size={16} className={\`mt-1 flex-shrink-0 \${popular ? 'text-black' : 'text-white'}\`} fill="currentColor" />\n                    <span className="font-light">{feature}</span>\n                </li>\n            ))}\n        </ul>\n    </motion.div>\n);\n`;
content = content.replace(oldPlanCardRegex, newPlanCard);

content = content.replace(/className="text-center p-4 rounded-2xl hover:bg-white\/5 transition-colors"/g, 'className="text-center p-6 rounded-3xl bg-[#0a0a0a]/50 hover:bg-[#111111] border border-white/5 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.02)]"');
content = content.replace(/className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-\[\#111\] border border-white\/10 flex items-center justify-center"/g, 'className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#111111] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 flex items-center justify-center"');

fs.writeFileSync(file, content);
console.log('welcome-view.tsx updated');

// Update session-view.tsx
const file2 = path.join(__dirname, 'components', 'app', 'session-view.tsx');
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(/text-cyan-400/g, 'text-white');
content2 = content2.replace(/bg-cyan-500\/10/g, 'bg-white/10');
content2 = content2.replace(/border-cyan-500\/30/g, 'border-white/30');
content2 = content2.replace(/hover:bg-cyan-500\/20/g, 'hover:bg-white/20');
content2 = content2.replace(/hover:border-cyan-400\/50/g, 'hover:border-white/50');
content2 = content2.replace(/bg-neon-green/g, 'bg-white');
content2 = content2.replace(/shadow-\[0_0_6px_#4ade80\]/g, 'shadow-[0_0_6px_rgba(255,255,255,0.8)]');
content2 = content2.replace(/group-hover:shadow-\[0_0_10px_#4ade80\]/g, 'group-hover:shadow-[0_0_10px_rgba(255,255,255,0.8)]');
content2 = content2.replace(/text-neon-green\/50/g, 'text-white/50');
content2 = content2.replace(/shadow-\[0_0_8px_#4ade80\]/g, 'shadow-[0_0_8px_rgba(255,255,255,0.8)]');
content2 = content2.replace(/shadow-\[0_0_15px_rgba\(74,222,128,0\.3\)\]/g, 'shadow-[0_0_15px_rgba(255,255,255,0.3)]');
content2 = content2.replace(/border-neon-green\/50/g, 'border-white/50');
content2 = content2.replace(/text-neon-green/g, 'text-white');

content2 = content2.replace(/<Zap size=\{10\} className="text-neon-green" \/>/g, '<Zap size={10} className="text-white" />');
content2 = content2.replace(/shadow-\[0_0_30px_rgba\(255,255,255,0\.03\),0_0_20px_-10px_rgba\(0,255,157,0\.03\),inset_0_1px_0_rgba\(255,255,255,0\.05\)\]/g, 'shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)]');
content2 = content2.replace(/bg-\[\#1a1a1a\]\/80 backdrop-blur-2xl border border-white\/30 rounded-full p-2\.5 shadow-\[0_0_30px_rgba\(255,255,255,0\.08\),0_8px_32px_-4px_rgba\(0,0,0,0\.5\),inset_0_1px_0_rgba\(255,255,255,0\.1\)\]/g, 'bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-full p-2.5 shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)]');
content2 = content2.replace(/hover:shadow-\[0_0_40px_rgba\(255,255,255,0\.12\),0_12px_40px_-4px_rgba\(0,255,157,0\.15\)\]/g, 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.1)]');
content2 = content2.replace(/shadow-\[0_0_40px_rgba\(255,255,255,0\.12\),0_12px_40px_-4px_rgba\(0,255,157,0\.15\)\]/g, 'shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.15)]');

content2 = content2.replace(/\[&_\.lk-disconnect-button\]:\!bg-red-500\/10/g, '[&_.lk-disconnect-button]:!bg-white');
content2 = content2.replace(/\[&_\.lk-disconnect-button\]:\!border-red-500\/20/g, '[&_.lk-disconnect-button]:!border-white');
content2 = content2.replace(/\[&_\.lk-disconnect-button\]:\!text-red-500/g, '[&_.lk-disconnect-button]:!text-black');
content2 = content2.replace(/\[&_\.lk-disconnect-button:hover\]:\!bg-red-500\/20/g, '[&_.lk-disconnect-button:hover]:!bg-gray-200');

fs.writeFileSync(file2, content2);
console.log('session-view.tsx updated');
