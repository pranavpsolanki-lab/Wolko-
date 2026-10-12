import React, { useState, useMemo } from 'react';
import {
  MessageSquareHeart,
  Star,
  Send,
  Sparkles,
  ThumbsUp,
  Trash2,
  CheckCircle2,
  Feather,
  Filter,
} from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { useShop } from '../context/ShopContext';
import { UserAvatar } from './UserAvatar';
import { ProductCommentItem } from '../lib/googleSheets';

const STUDIO_TAGS = [
  'Soft Merino Wool',
  'Artisan Hand-Stitching',
  'True to Picture',
  'Seeded Gift Box',
  'Worth Every Rupee',
  'Festive Favorite',
];

const QUICK_PROMPTS = [
  'Loved the hand-knitted wool texture and finishing!',
  'Gifted this piece to someone special and they adored it.',
  'The color shade looks even warmer in real life.',
];

export const CustomerCommentsWall: React.FC = () => {
  const {
    googleUser,
    handleGooglePopupSignIn,
    productComments,
    addProductComment,
    markCommentHelpful,
    deleteProductComment,
    openProductModal,
  } = useShop();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    PRODUCTS[0]?.id || ''
  );
  const [filterProductId, setFilterProductId] = useState<string>('all');
  const [authorName, setAuthorName] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [postedSuccess, setPostedSuccess] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const selectedProductObj = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  );

  const filteredComments = useMemo(() => {
    if (filterProductId === 'all') return productComments;
    return productComments.filter((c) => c.productId === filterProductId);
  }, [productComments, filterProductId]);

  const averageRating = useMemo(() => {
    if (productComments.length === 0) return null;
    const sum = productComments.reduce(
      (acc, c) => acc + (Number(c.rating) || 5),
      0
    );
    return (sum / productComments.length).toFixed(1);
  }, [productComments]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || !selectedProductObj || isSubmitting) return;

    const finalAuthor =
      googleUser?.displayName?.trim() ||
      authorName.trim() ||
      (googleUser?.email ? googleUser.email.split('@')[0] : 'Wolko Customer');

    setIsSubmitting(true);
    try {
      await addProductComment({
        productId: selectedProductObj.id,
        productName: selectedProductObj.name,
        productImage: selectedProductObj.primaryImage,
        authorName: finalAuthor,
        rating,
        highlights: selectedTags,
        commentText: trimmed,
      });
      setCommentText('');
      setSelectedTags([]);
      setRating(5);
      setPostedSuccess(true);
      setTimeout(() => setPostedSuccess(false), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = (commentId: string) => {
    if (likedIds[commentId]) return;
    setLikedIds((prev) => ({ ...prev, [commentId]: true }));
    markCommentHelpful(commentId);
  };

  const canDelete = (c: ProductCommentItem) => {
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

  return (
    <section
      id="customer-comments"
      className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF8F5] via-[#F5EFEB] to-[#FAF8F5] border-t border-[#EAE2D8]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Editorial Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EAE2D8] text-[11px] uppercase tracking-widest text-[#C87D65] font-semibold mb-3 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Real Public Customer Feed</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-[#24211E] font-normal tracking-tight leading-tight">
              Collector Comments &{' '}
              <span className="italic text-[#C87D65]">Studio Guestbook</span>
            </h2>
            <p className="text-sm sm:text-base text-[#6B6158] font-light mt-2 max-w-2xl">
              Every comment below is written live by a real customer. Choose any
              handcrafted piece, write your comment in the studio box, and it
              will immediately appear publicly for everyone.
            </p>
          </div>

          {/* Live Counter Pill */}
          <div className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-2xl border border-[#EAE2D8] shadow-xs shrink-0">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
                Public Comments
              </div>
              <div className="font-editorial text-2xl text-[#24211E] font-medium">
                {productComments.length}{' '}
                <span className="text-sm font-sans font-normal text-[#6B6158]">
                  {productComments.length === 1 ? 'Comment' : 'Comments'}
                </span>
              </div>
            </div>
            <div className="h-9 w-px bg-[#EAE2D8]" />
            <div>
              <div className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
                Live Rating
              </div>
              <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-[#24211E]">
                <Star className="w-4 h-4 fill-[#D99B26] text-[#D99B26]" />
                <span>{averageRating || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main 12-Col Creative Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Cols: Creative Tactile Comment Composer Box */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E4DAD0] shadow-[0_12px_40px_rgba(36,33,30,0.06)] overflow-hidden">
            {/* Top Artisan Ribbon */}
            <div className="bg-[#24211E] text-[#FAF8F5] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-[#E2B897]" />
                <span className="text-xs uppercase tracking-widest font-semibold">
                  Leave a Public Comment
                </span>
              </div>
              <span className="text-[11px] text-[#C8BEB4]">
                Publishes Instantly
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Author Identity Row (Uses Google Profile Picture automatically if logged in) */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D8] flex items-center justify-between gap-3">
                {googleUser ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      photoURL={googleUser.photoURL}
                      email={googleUser.email}
                      name={googleUser.displayName}
                      size="md"
                      showGoogleBadge
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#24211E] truncate">
                        {googleUser.displayName ||
                          googleUser.email?.split('@')[0]}
                      </div>
                      <div className="text-[11px] text-[#6B6158] truncate">
                        Commenting publicly with Google Profile
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#24211E]">
                        Commenting as Guest
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGooglePopupSignIn()}
                        className="text-[11px] font-semibold text-[#C87D65] hover:underline"
                      >
                        Use Google Profile Photo →
                      </button>
                    </div>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Enter your name (e.g. Aarav Sharma)..."
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-[#DFD5C9] text-[#24211E] placeholder:text-[#9E9389] focus:outline-none focus:border-[#C87D65]"
                    />
                  </div>
                )}
              </div>

              {/* Product Selector with Thumbnail */}
              <div>
                <label className="block text-xs font-semibold text-[#24211E] mb-2">
                  1. Select Product to Comment On
                </label>
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D8]">
                  {selectedProductObj && (
                    <img
                      src={selectedProductObj.primaryImage}
                      alt={selectedProductObj.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#EAE2D8] shrink-0"
                    />
                  )}
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#24211E] focus:outline-none cursor-pointer"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interactive Star Rating */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#24211E]">
                    2. Rate This Handcrafted Piece
                  </label>
                  <span className="text-xs font-mono font-semibold text-[#C87D65]">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE2D8]">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1.5 rounded-xl hover:bg-white transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
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

              {/* Craft Highlight Badges */}
              <div>
                <label className="block text-xs font-semibold text-[#24211E] mb-2">
                  3. Highlight Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STUDIO_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#24211E] text-white border-[#24211E] font-medium shadow-2xs'
                            : 'bg-[#FAF8F5] text-[#574E45] border-[#E2D9CE] hover:border-[#8C827A]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Empty Comment Box */}
              <div>
                <label className="block text-xs font-semibold text-[#24211E] mb-1.5">
                  4. Your Comment
                </label>
                <textarea
                  rows={4}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Write your honest comment about ${
                    selectedProductObj?.name || 'this product'
                  }...`}
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DFD5C9] text-[#24211E] placeholder:text-[#9E9389] focus:outline-none focus:border-[#C87D65] focus:bg-white transition-all resize-none"
                />

                {/* Quick Inspiration Prompts */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C827A] font-medium">
                    Quick fill:
                  </span>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCommentText(prompt)}
                      className="text-[10px] text-[#6B6158] hover:text-[#24211E] bg-[#F5EFEB] hover:bg-[#EAE2D8] px-2 py-0.5 rounded-md transition-colors truncate max-w-[200px]"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-[#24211E] hover:bg-[#C87D65] disabled:bg-[#D9CFC4] text-white text-xs uppercase tracking-widest font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Publishing Comment...'
                    : 'Post Public Comment Now'}
                </span>
              </button>

              {postedSuccess && (
                <div className="p-3 rounded-2xl bg-[#EDF3EC] border border-[#C5D8C1] text-[#3B5936] text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Thank you! Your comment is now publicly visible on the live
                    wall and under {selectedProductObj?.name}.
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Right 7 Cols: Live Public Customer Comments Stream */}
          <div className="lg:col-span-7 space-y-5">
            {/* Filter Bar by Product */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#EAE2D8] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#24211E]">
                <Filter className="w-3.5 h-3.5 text-[#C87D65]" />
                <span>Filter Public Comments by Product:</span>
              </div>

              <select
                value={filterProductId}
                onChange={(e) => setFilterProductId(e.target.value)}
                className="text-xs font-medium bg-[#FAF8F5] border border-[#E2D9CE] rounded-xl px-3 py-2 text-[#24211E] focus:outline-none focus:border-[#C87D65]"
              >
                <option value="all">
                  All Handcrafted Products ({productComments.length})
                </option>
                {PRODUCTS.map((p) => {
                  const count = productComments.filter(
                    (c) => c.productId === p.id
                  ).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Honest Creative Empty State when 0 comments exist */}
            {filteredComments.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-[#DFD5C9] p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-16 h-16 rounded-3xl bg-[#F5EFEB] border border-[#EAE2D8] flex items-center justify-center text-[#C87D65] mb-5 shadow-2xs">
                  <MessageSquareHeart className="w-7 h-7" />
                </div>

                <span className="text-[11px] uppercase tracking-widest text-[#C87D65] font-semibold mb-2">
                  Zero Fake Reviews · 100% Real Customer Wall
                </span>

                <h3 className="font-editorial text-2xl sm:text-3xl text-[#24211E] font-normal max-w-md mb-3">
                  This Comment Wall is Ready for the First Customer Voice
                </h3>

                <p className="text-xs sm:text-sm text-[#6B6158] font-light max-w-md leading-relaxed mb-6">
                  We never use pre-filled or artificial comments. As soon as you
                  or any customer posts a comment using the box on the left (or
                  directly underneath any product card), it will appear here
                  publicly in real time.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF8F5] border border-[#EAE2D8] text-xs text-[#4A443E]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C87D65]" />
                  <span>
                    Write a comment in the box to test the live public feed!
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComments.map((c) => {
                  const linkedProduct = PRODUCTS.find(
                    (p) => p.id === c.productId
                  );
                  return (
                    <article
                      key={c.commentId}
                      className="bg-white rounded-3xl border border-[#EAE2D8] p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            photoURL={c.authorPhotoURL}
                            email={c.authorEmail}
                            name={c.authorName}
                            size="md"
                            showGoogleBadge={Boolean(c.authorEmail)}
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-[#24211E]">
                                {c.authorName}
                              </h4>
                              {c.isVerifiedBuyer && (
                                <span className="text-[10px] font-semibold bg-[#EDF3EC] text-[#3B5936] px-2 py-0.5 rounded-full border border-[#C5D8C1]">
                                  ✓ Verified Collector
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#8C827A] mt-0.5">
                              Posted publicly on {c.timestamp}
                            </div>
                          </div>
                        </div>

                        {/* Star Rating Pill */}
                        <div className="flex items-center gap-1 bg-[#FAF8F5] px-3 py-1.5 rounded-full border border-[#EAE2D8] shrink-0">
                          {Array.from({ length: c.rating || 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 fill-[#D99B26] text-[#D99B26]"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Highlight Tags */}
                      {c.highlights && c.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {c.highlights.map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#EAE2D8] text-[#574E45] font-medium"
                            >
                              ✦ {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Comment Body */}
                      <p className="text-sm sm:text-base text-[#24211E] leading-relaxed font-normal mb-4">
                        "{c.commentText}"
                      </p>

                      {/* Bottom Product Link & Actions */}
                      <div className="pt-3.5 border-t border-[#F0EBE4] flex flex-wrap items-center justify-between gap-3">
                        {linkedProduct ? (
                          <button
                            type="button"
                            onClick={() => openProductModal(linkedProduct)}
                            className="flex items-center gap-2.5 group text-left bg-[#FAF8F5] hover:bg-[#F5EFEB] pr-3.5 p-1.5 rounded-xl border border-[#EAE2D8] transition-colors"
                          >
                            <img
                              src={linkedProduct.primaryImage}
                              alt={linkedProduct.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[#8C827A]">
                                Commented on Product
                              </div>
                              <div className="text-xs font-semibold text-[#24211E] group-hover:text-[#C87D65] transition-colors">
                                {linkedProduct.name}
                              </div>
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-[#6B6158]">
                            Product: {c.productName}
                          </span>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleHelpful(c.commentId)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
                              likedIds[c.commentId]
                                ? 'bg-[#F7EBE8] border-[#C87D65] text-[#C87D65] font-semibold'
                                : 'bg-white border-[#EAE2D8] text-[#574E45] hover:border-[#24211E]'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Helpful ({c.helpfulCount || 0})</span>
                          </button>

                          {canDelete(c) && (
                            <button
                              type="button"
                              onClick={() => deleteProductComment(c.commentId)}
                              className="flex items-center gap-1 text-xs text-[#B85D4B] hover:text-red-700 px-2 py-1"
                              title="Delete your comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
