import React, { useState } from 'react';
import { GLOSSARY_TERMS, GlossaryEntry } from '../data/glossaryData';
import { Search, BookOpen, Filter, CheckCircle2, XCircle } from 'lucide-react';

export const Glossary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const termsList = Object.entries(GLOSSARY_TERMS);

  const filteredTerms = termsList.filter(([key, entry]) => {
    if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.term.toLowerCase().includes(q) ||
      entry.plainSentence.toLowerCase().includes(q) ||
      key.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl font-sans text-xs">
      {/* Title & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-black dark:text-white" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Metrology & Statistical Glossary
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-sans">
            Semiconductor definitions, formulas, and operational boundary conditions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search concepts or formulas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-600 dark:focus:border-navy-400 w-56"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-600 dark:focus:border-navy-400"
            >
              <option value="all">All Domains (13 Terms)</option>
              <option value="Operations">Operations</option>
              <option value="Statistical Control">Statistical Control</option>
              <option value="Predictive ML">Predictive ML</option>
              <option value="Attribution">Attribution</option>
            </select>
          </div>
        </div>
      </div>

      {/* Glossary Cards List */}
      <div className="space-y-4">
        {filteredTerms.map(([key, entry]) => (
          <div
            key={key}
            className="bg-white dark:bg-navy-900/60 border border-slate-200 dark:border-navy-700/80 rounded-xl p-5 shadow-card space-y-3.5 hover:border-slate-300 dark:hover:border-navy-600 transition-all duration-150"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-navy-700/70">
              <div className="flex items-center gap-2.5">
                <span className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                  {entry.term}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-navy-50 dark:bg-navy-800 text-navy-800 dark:text-navy-200 border border-navy-200 dark:border-navy-700">
                  {entry.category}
                </span>
              </div>
            </div>

            {/* Plain-Language Definition */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Plain-Language Definition:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {entry.plainSentence}
              </p>
            </div>

            {/* Formula Block (where applicable) */}
            {entry.formula && (
              <div className="p-3 bg-slate-50 dark:bg-navy-950/80 rounded-lg border border-slate-200/80 dark:border-navy-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  Mathematical Formulation:
                </span>
                <code className="text-xs font-mono font-semibold text-navy-900 dark:text-amber-400">
                  {entry.formula}
                </code>
              </div>
            )}

            {/* Can Tell You vs Cannot Tell You */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold mb-1">
                  <CheckCircle2 size={13} className="shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider">What It Tells You</span>
                </div>
                <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  {entry.whatItTellsYou}
                </p>
              </div>

              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/80 rounded-lg">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold mb-1">
                  <XCircle size={13} className="shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider">What It Cannot Tell You</span>
                </div>
                <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-relaxed">
                  {entry.whatItCannotTellYou}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
