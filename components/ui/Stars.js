export default function Stars({ rating = 5, size = 'md' }) {
  const sz = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
  return (
    <div className={`flex items-center gap-0.5 ${sz}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? 'star-on' : 'star-off'}>★</span>
      ))}
    </div>
  );
}
