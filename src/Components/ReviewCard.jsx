const ReviewCard = ({ location, title, review, createdAt, username }) => (
  <div className="p-5 border-b border-slate-line last:border-none">
    <div className="flex justify-between items-center mb-3 gap-3">
      <span className="badge-dusk">{location}</span>
      <span className="mono-readout normal-case tracking-normal">
        {createdAt ? new Date(createdAt).toLocaleDateString() : ''}
      </span>
    </div>
    <h3 className="text-heading text-ink mb-2">{title}</h3>
    <p className="text-body text-ink-soft">{review}</p>
    <p className="mt-3 text-caption text-ink-soft">
      By <span className="text-ink">{username}</span>
    </p>
  </div>
);

export default ReviewCard;
