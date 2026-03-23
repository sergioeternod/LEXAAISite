import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Tone down shadows
content = content.replace(/shadow-2xl/g, 'shadow-sm');
content = content.replace(/shadow-xl/g, 'shadow-sm');
content = content.replace(/shadow-lg/g, 'shadow-sm');
content = content.replace(/shadow-md/g, 'shadow-sm');
content = content.replace(/shadow-inner/g, '');

// Clean up duplicate classes
content = content.replace(/bg-white border border-slate-200 shadow-sm border border-slate-200 shadow-sm/g, 'bg-white border border-slate-200 shadow-sm');
content = content.replace(/bg-white border border-slate-200 shadow-sm border border-slate-200/g, 'bg-white border border-slate-200 shadow-sm');
content = content.replace(/bg-white border border-slate-200 shadow-sm p-6 rounded-3xl border border-slate-200/g, 'bg-white border border-slate-200 shadow-sm p-6 rounded-3xl');
content = content.replace(/bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200/g, 'bg-white border border-slate-200 shadow-sm p-6 rounded-2xl');
content = content.replace(/bg-white border border-slate-200 shadow-sm p-8 rounded-2xl border border-slate-200/g, 'bg-white border border-slate-200 shadow-sm p-8 rounded-2xl');
content = content.replace(/bg-white border border-slate-200 shadow-sm p-8 rounded-3xl border border-slate-200/g, 'bg-white border border-slate-200 shadow-sm p-8 rounded-3xl');
content = content.replace(/bg-white border border-slate-200 shadow-sm border border-indigo-200\/60/g, 'bg-white border border-slate-200 shadow-sm');
content = content.replace(/bg-white border border-slate-200 shadow-sm p-16 text-center/g, 'bg-white border border-slate-200 shadow-sm p-16 text-center');

// More gradient removals
content = content.replace(/bg-gradient-to-r from-slate-800 to-slate-900/g, 'bg-slate-800');
content = content.replace(/bg-gradient-to-br from-\[#8B1A1A\] to-\[#7A1315\]/g, 'bg-[#8B1A1A]');

fs.writeFileSync('src/App.tsx', content);
console.log('Replacements complete');
