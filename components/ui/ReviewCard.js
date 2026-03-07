'use client';

import Stars from './Stars';

const SOURCE_CONFIG = {
  google:   { label: 'Google Review',   color: '#4285F4', symbol: 'G',  bg: 'rgba(66,133,244,0.1)'  },
  yelp:     { label: 'Yelp Review',     color: '#d32323', symbol: '★',  bg: 'rgba(211,34,35,0.1)'   },
  facebook: { label: 'Facebook Review', color: '#1877F2', symbol: 'f',  bg: 'rgba(24,119,242,0.1)'  },
};

export default function ReviewCard({ review, onSave, isSaved }) {
  const src = SOURCE_CONFIG[review.source] || SOURCE_CONFIG.google;
  return (
    <div className="card-interactive p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
            style={{ background: 'var(--ember-soft)', color: 'var(--ember)' }}>
            {review.reviewer_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--ink)' }}>{review.reviewer_name}</p>
            {review.review_date && <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{review.review_date}</p>}
          </div>
        </div>
        <Stars rating={review.rating} size="sm" />
      </div>
      <p className="text-sm leading-relaxed line-clamp-4 flex-1" style={{ color: 'var(--ink-muted)' }}>{review.review_text}</p>
      <div className="flex items-center justify-between pt-1">
        <span className="badge text-xs" style={{ background: src.bg }}>
          <span className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: src.color, fontSize: '8px' }}>{src.symbol}</span>
          <span style={{ color: src.color }}>{src.label}</span>
        </span>
        <button onClick={() => !isSaved && onSave && onSave(review)} disabled={isSaved}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
          style={{ background: isSaved ? 'rgba(16,185,129,0.1)' : 'var(--ember-soft)', color: isSaved ? '#065f46' : 'var(--ember)', cursor: isSaved ? 'default' : 'pointer' }}>
          {isSaved ? '✓ Saved' : '+ Save testimonial'}
        </button>
      </div>
    </div>
  );
}
