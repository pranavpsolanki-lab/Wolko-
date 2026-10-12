import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Star,
  Send,
  ThumbsUp,
  Trash2,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Product, PRODUCTS } from '../data/products';
import { useShop } from '../context/ShopContext';
import { UserAvatar } from './UserAvatar';
import { ProductCommentItem } from '../lib/googleSheets';

const CRAFT_HIGHLIGHTS = [
  'Soft Wool Texture',
  'Artisan Stitching',
  'True to Shade',
  'Gift-Worthy',
  'Heirloom Finish',
];

const RATING_LABELS: Record<number, string> = {
  5: 'Loved It · 5/5',
  4: 'Great Craft · 4/5',
  3: 'Good · 3/5',
  2: 'Fair · 2/5',
  1: 'Needs Work · 1/5',
};

interface ProductCommentBoxProps {
  product: Product;
  variant?: 'card' | 'modal';
}

export const ProductCommentBox: React.FC<ProductCommentBoxProps> = ({
  product,
  variant = 'card',
}) => {
  const {
    googleUser,
    handleGooglePopupSignIn,
    getCommentsForProduct,
    addProductComment,
    markCommentHelpful,
    deleteProductComment,
  } = useShop();

  const comments = getCommentsForProduct(product.id);

  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justPosted, setJustPosted] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const averageRating =
    comments.length > 0
      ? (
          comments.reduce((acc, item) => acc + (Number(item.rating) || 5), 0) /
          comments.length
        ).toFixed(1)
      : null;

  const toggleHighlight = (tag: string) => {
    setSelectedHighlights((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedText = commentText.trim();
    if (!trimmedText || isSubmitting) return;

    const resolvedAuthorName =
      googleUser?.displayName?.trim() ||
      guestName.trim() ||
      (googleUser?.email ? googleUser.email.split('@')[0] : 'Wolko Collector');

    setIsSubmitting(true);
    try {
      await addProductComment({
        productId: product.id,
        productName: product.name,
        productImage: product.primaryImage,
        authorName: resolvedAuthorName,
        rating,
        highlights: selectedHighlights,
        commentText: trimmedText,
      });
      setCommentText('');
      setSelectedHighlights([]);
      setRating(5);
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    if (likedIds[commentId]) return;
    setLikedIds((prev) => ({ ...prev, [commentId]: true }));
    markCommentHelpful(commentId);
  };

  const handleDelete = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    deleteProductComment(commentId);
  };

  const canDeleteComment = (c: ProductCommentItem) => {
    if (!googleUser) return false;
    if (googleUser.uid && c.userId && googleUser.uid === c.userId) return true;
    if (
      googleUser.email &&
      c.authorEmail &&
      googleUser.email.toLowerCase() === c.authorEmail.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  if (variant === 'card') {
    const visibleComments = showAllComments ? comments : comments.slice(0, 2);

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-3.5 pt-3.5 border-t border-[#EAE2D8] bg-[#FAF8F5]/85 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 py-3.5 rounded-b-xl cursor-default"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-[#C87D65]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#24211E]">
              Customer Comments ({comments.length})
            </span>
          </div>
          {averageRating ? (
            <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#24211E] bg-white px-2 py-0.5 rounded-full border border-[#EAE2D8]">
              <Star className="w-3 h-3 fill-[#D99B26] text-[#D99B26]" />
              <span>{averageRating}</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#8C827A] italic">
              Public Feed · Live
            </span>
          )}
        </div>

        {/* Empty Comment Box Form directly under every product */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Star selector + User identity bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-0.5 transition-transform hover:scale-110"
                    title={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        active
                          ? 'fill-[#D99B26] text-[#D99B26]'
                          : 'text-[#D5CBBF]'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-[10px] text-[#6B6158] ml-1 font-medium">
                {RATING_LABELS[hoverRating || rating]}
              </span>
            </div>

            {googleUser ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <UserAvatar
                  photoURL={googleUser.photoURL}
                  email={googleUser.email}
                  name={googleUser.displayName}
                  size="xs"
                />
                <span className="text-[10px] text-[#4A443E] font-medium truncate max-w-[95px]">
                  {googleUser.displayName || googleUser.email?.split('@')[0]}
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name..."
                className="w-28 text-[11px] px-2 py-1 rounded-md bg-white border border-[#E2D9CE] text-[#24211E] placeholder:text-[#A89E96] focus:outline-none focus:border-[#C87D65]"
              />
            )}
          </div>

          {/* Comment Input Box + Send Button */}
          <div className="relative flex items-center gap-1.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={`Write a public comment on ${product.name}...`}
              className="w-full text-xs pl-3 pr-9 py-2 rounded-lg bg-white border border-[#E2D9CE] text-[#24211E] placeholder:text-[#9E9389] focus:outline-none focus:border-[#C87D65] focus:ring-1 focus:ring-[#C87D65]/30 transition-all"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="absolute right-1.5 p-1.5 rounded-md bg-[#24211E] hover:bg-[#C87D65] disabled:bg-[#D9CFC4] text-white transition-colors"
              title="Post Public Comment"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

        {justPosted && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#4D6B48] font-medium bg-[#EDF3EC] px-2.5 py-1 rounded-md border border-[#C5D8C1]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Your comment is now live publicly!</span>
          </div>
        )}

        {/* Public Comments List or Honest Empty State */}
        <div className="mt-2.5">
          {comments.length === 0 ? (
            <div className="py-2 px-2.5 rounded-lg border border-dashed border-[#DFD5C9] bg-white/60 text-center">
              <p className="text-[11px] text-[#7D7268] font-light">
                No comments yet on this piece. Be the first customer to comment!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {visibleComments.map((c) => (
                <div
                  key={c.commentId}
                  className="p-2.5 rounded-lg bg-white border border-[#EAE2D8] shadow-2xs text-left"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserAvatar
                        photoURL={c.authorPhotoURL}
                        email={c.authorEmail}
                        name={c.authorName}
                        size="xs"
                      />
                      <span className="text-[11px] font-semibold text-[#24211E] truncate">
                        {c.authorName}
                      </span>
                      {c.isVerifiedBuyer && (
                        <span className="text-[9px] bg-[#EDF3EC] text-[#4D6B48] px-1.5 py-0.2 rounded-sm font-medium shrink-0">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: c.rating || 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-2.5 h-2.5 fill-[#D99B26] text-[#D99B26]"
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#4A443E] leading-snug break-words">
                    {c.commentText}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#9A8F85]">
                    <span>{c.timestamp}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleHelpful(e, c.commentId)}
                        className={`flex items-center gap-1 hover:text-[#24211E] transition-colors ${
                          likedIds[c.commentId]
                            ? 'text-[#C87D65] font-semibold'
                            : ''
                        }`}
                      >
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span>{c.helpfulCount || 0}</span>
                      </button>
                      {canDeleteComment(c) && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, c.commentId)}
                          className="text-[#B85D4B] hover:text-red-700 transition-colors"
                          title="Delete your comment"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {comments.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllComments((prev) => !prev)}
                  className="w-full py-1 text-[11px] font-medium text-[#C87D65] hover:text-[#24211E] flex items-center justify-center gap-1 transition-colors"
                >
                  {showAllComments ? (
                    <>
                      <span>Show fewer comments</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>View all {comments.length} customer comments</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Modal Variant
  return (
    <div className="border-t border-[#EAE2D8] bg-[#FAF8F5] p-5 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE2D8]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C87D65] font-semibold mb-1">
            <MessageSquarePlus className="w-4 h-4" />
            <span>Live Public Customer Comments</span>
          </div>
          <h3 className="font-editorial text-2xl text-[#24211E] font-medium">
            Collector Notes on {product.name}
          </h3>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#EAE2D8] shadow-2xs">
          <div className="text-right">
            <div className="text-xs font-semibold text-[#24211E]">
              {comments.length}{' '}
              {comments.length === 1 ? 'Public Comment' : 'Public Comments'}
            </div>
            <div className="text-[11px] text-[#8C827A]">
              {averageRating
                ? `Average Rating ${averageRating} / 5.0`
                : '100% Real Customer Feed'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F5EFEB] flex items-center justify-center font-mono text-sm font-bold text-[#24211E]">
            {averageRating ? `${averageRating}★` : '★'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left 5 cols: Write a Real Comment Box */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#EAE2D8] shadow-xs h-fit">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#24211E]">
              Write a Public Comment
            </span>
            {googleUser ? (
              <div className="flex items-center gap-2">
                <UserAvatar
                  photoURL={googleUser.photoURL}
                  email={googleUser.email}
                  name={googleUser.displayName}
                  size="xs"
                  showGoogleBadge
                />
                <span className="text-xs font-medium text-[#24211E] truncate max-w-[130px]">
                  {googleUser.displayName || googleUser.email?.split('@')[0]}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleGooglePopupSignIn()}
                className="text-[11px] font-medium text-[#C87D65] hover:underline"
              >
                Sign in with Google
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!googleUser && (
              <div>
                <label className="block text-[11px] font-medium text-[#574E45] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] text-[#24211E] focus:outline-none focus:border-[#C87D65]"
                />
              </div>
            )}

            {/* Star Rating */}
            <div>
              <label className="block text-[11px] font-medium text-[#574E45] mb-1">
                Your Rating ·{' '}
                <span className="text-[#C87D65] font-semibold">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:bg-[#FAF8F5] transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          active
                            ? 'fill-[#D99B26] text-[#D99B26]'
                            : 'text-[#D5CBBF]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Craft Highlight Tags */}
            <div>
              <label className="block text-[11px] font-medium text-[#574E45] mb-1.5">
                What stood out to you? (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CRAFT_HIGHLIGHTS.map((tag) => {
                  const active = selectedHighlights.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleHighlight(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        active
                          ? 'bg-[#24211E] text-white border-[#24211E]'
                          : 'bg-[#FAF8F5] text-[#574E45] border-[#E2D9CE] hover:border-[#8C827A]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-[11px] font-medium text-[#574E45] mb-1">
                Your Public Comment
              </label>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Share your genuine experience or thoughts about ${product.name}...`}
                className="w-full text-xs p-3 rounded-xl bg-[#FAF8F5] border border-[#E2D9CE] text-[#24211E] placeholder:text-[#9E9389] focus:outline-none focus:border-[#C87D65] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#24211E] hover:bg-[#C87D65] disabled:bg-[#D9CFC4] text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting ? 'Posting Comment...' : 'Post Public Comment'}
              </span>
            </button>

            {justPosted && (
              <div className="flex items-center gap-1.5 text-xs text-[#4D6B48] font-medium bg-[#EDF3EC] px-3 py-2 rounded-xl border border-[#C5D8C1]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Your comment is now visible publicly!</span>
              </div>
            )}
          </form>
        </div>

        {/* Right 7 cols: Public Comments Stream */}
        <div className="lg:col-span-7">
          {comments.length === 0 ? (
            <div className="h-full min-h-[240px] rounded-2xl border-2 border-dashed border-[#DFD5C9] bg-white/70 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F5EFEB] border border-[#EAE2D8] flex items-center justify-center text-[#C87D65] mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-editorial text-xl text-[#24211E] mb-1">
                Be the First to Leave a Comment
              </h4>
              <p className="text-xs text-[#6B6158] max-w-sm leading-relaxed">
                We only display 100% genuine comments written by real customers.
                Use the comment box on the left to share the very first public
                note on <span className="font-medium text-[#24211E]">{product.name}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {comments.map((c) => (
                <div
                  key={c.commentId}
                  className="p-4 rounded-2xl bg-white border border-[#EAE2D8] shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        photoURL={c.authorPhotoURL}
                        email={c.authorEmail}
                        name={c.authorName}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#24211E]">
                            {c.authorName}
                          </span>
                          {c.isVerifiedBuyer && (
                            <span className="text-[10px] bg-[#EDF3EC] text-[#4D6B48] px-2 py-0.5 rounded-md font-medium">
                              Verified Customer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8C827A]">
                          {c.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: c.rating || 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-[#D99B26] text-[#D99B26]"
                        />
                      ))}
                    </div>
                  </div>

                  {c.highlights && c.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {c.highlights.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE2D8] text-[#574E45] font-medium"
                        >
                          ✦ {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-[#3A3530] leading-relaxed">
                    {c.commentText}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[#F5EFEB] flex items-center justify-between text-[11px] text-[#8C827A]">
                    <button
                      type="button"
                      onClick={(e) => handleHelpful(e, c.commentId)}
                      className={`flex items-center gap-1.5 hover:text-[#24211E] transition-colors ${
                        likedIds[c.commentId]
                          ? 'text-[#C87D65] font-semibold'
                          : ''
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Helpful ({c.helpfulCount || 0})</span>
                    </button>

                    {canDeleteComment(c) && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, c.commentId)}
                        className="flex items-center gap-1 text-[#B85D4B] hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
