'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate, formatPriestName } from '@/lib/utils';
import { Search } from 'lucide-react';

interface DirectoryPriest {
  id: string;
  firstName: string;
  lastName: string;
  currentTitle: string;
  diocese: string | null;
  seminary: string | null;
  parish: string | null;
  ordinationDate: string | null;
  profilePhotoUrl: string | null;
  slug: string;
}

interface Props {
  priests: DirectoryPriest[];
}

export function DirectoryClient({ priests }: Props) {
  const [query, setQuery] = useState('');
  const [filterDiocese, setFilterDiocese] = useState('');
  const [filterSeminary, setFilterSeminary] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Build filter option lists from the data
  const dioceses = useMemo(() => {
    const set = new Set<string>();
    priests.forEach((p) => { if (p.diocese) set.add(p.diocese); });
    return Array.from(set).sort();
  }, [priests]);

  const seminaries = useMemo(() => {
    const set = new Set<string>();
    priests.forEach((p) => { if (p.seminary) set.add(p.seminary); });
    return Array.from(set).sort();
  }, [priests]);

  const ordinationYears = useMemo(() => {
    const set = new Set<string>();
    priests.forEach((p) => {
      if (p.ordinationDate) {
        set.add(new Date(p.ordinationDate).getUTCFullYear().toString());
      }
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, [priests]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return priests.filter((p) => {
      // Text search across name, seminary, diocese, parish
      if (q) {
        const searchable = [
          p.firstName, p.lastName, p.seminary, p.diocese, p.parish,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      // Diocese filter
      if (filterDiocese && p.diocese !== filterDiocese) return false;
      // Seminary filter
      if (filterSeminary && p.seminary !== filterSeminary) return false;
      // Year filter
      if (filterYear) {
        const year = p.ordinationDate
          ? new Date(p.ordinationDate).getUTCFullYear().toString()
          : '';
        if (year !== filterYear) return false;
      }
      return true;
    });
  }, [priests, query, filterDiocese, filterSeminary, filterYear]);

  const hasFilters = query || filterDiocese || filterSeminary || filterYear;

  function clearFilters() {
    setQuery('');
    setFilterDiocese('');
    setFilterSeminary('');
    setFilterYear('');
  }

  return (
    <div>
      {/* Search & Filters */}
      <div className="bg-white border border-near-black/10 rounded-sm p-5 mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-near-black/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, diocese, seminary, or parish…"
            className="w-full pl-9 pr-4 py-2.5 border border-near-black/20 rounded-sm font-inter text-sm bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800 placeholder:text-near-black/30"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterDiocese}
            onChange={(e) => setFilterDiocese(e.target.value)}
            className="border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800 text-near-black/70"
          >
            <option value="">All Dioceses</option>
            {dioceses.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterSeminary}
            onChange={(e) => setFilterSeminary(e.target.value)}
            className="border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800 text-near-black/70"
          >
            <option value="">All Seminaries</option>
            {seminaries.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border border-near-black/20 rounded-sm px-3 py-2 text-sm font-inter bg-white focus:outline-none focus:ring-2 focus:ring-burgundy-800 text-near-black/70"
          >
            <option value="">All Ordination Years</option>
            {ordinationYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="font-inter text-sm text-near-black/40 hover:text-near-black transition-colors px-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="font-inter text-sm text-near-black/40 mb-5">
        {filtered.length === priests.length
          ? `${priests.length} priest${priests.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${priests.length} priests`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-near-black/10 rounded-sm">
          <p className="font-cormorant text-2xl text-near-black/30 mb-2">No priests found</p>
          <p className="font-inter text-sm text-near-black/30">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((priest) => (
            <div
              key={priest.id}
              className="bg-white border border-near-black/10 rounded-sm overflow-hidden hover:border-burgundy-200 hover:shadow-sm transition-all"
            >
              {/* Card header with profile photo */}
              <div className="h-24 bg-burgundy-800 relative flex items-end px-5 pb-0">
                <div className="absolute bottom-0 translate-y-1/2 w-16 h-16 rounded-full border-3 border-white bg-burgundy-100 overflow-hidden shadow-md">
                  {priest.profilePhotoUrl ? (
                    <Image
                      src={priest.profilePhotoUrl}
                      alt={formatPriestName(priest)}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-burgundy-700">
                      <span className="font-cormorant text-xl text-cream font-light">
                        {priest.firstName[0]}{priest.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="pt-12 px-5 pb-5">
                <h2 className="font-cormorant text-xl text-burgundy-800 font-light leading-tight">
                  {formatPriestName(priest)}
                </h2>

                <div className="mt-2 space-y-1">
                  {priest.diocese && (
                    <p className="font-inter text-xs text-near-black/50 truncate">
                      {priest.diocese}
                    </p>
                  )}
                  {priest.seminary && (
                    <p className="font-inter text-xs text-near-black/40 truncate">
                      {priest.seminary}
                    </p>
                  )}
                  {priest.ordinationDate && (
                    <p className="font-inter text-xs text-near-black/40">
                      Ordination: {formatDate(priest.ordinationDate)}
                    </p>
                  )}
                </div>

                <Link
                  href={`/p/${priest.slug}`}
                  className="mt-4 inline-flex items-center font-inter text-sm text-burgundy-800 hover:text-burgundy-600 transition-colors group"
                >
                  View Page
                  <span className="ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
