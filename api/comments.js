// Vercel Serverless Function for Wolko Product Comments
let memoryComments = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const productId = req.query?.productId
      ? String(req.query.productId).trim()
      : '';
    const filtered = productId
      ? memoryComments.filter((c) => c.productId === productId)
      : memoryComments;
    return res.status(200).json({ comments: filtered });
  }

  if (req.method === 'POST') {
    const action = req.query?.action || '';
    const commentIdParam = req.query?.commentId || '';

    if (action === 'helpful' && commentIdParam) {
      memoryComments = memoryComments.map((c) =>
        c.commentId === commentIdParam
          ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1 }
          : c
      );
      return res.status(200).json({ success: true });
    }

    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const now = Date.now();
    const newComment = {
      commentId: String(body.commentId || `CMT-${now}`).trim(),
      productId: String(body.productId || '').trim(),
      productName: String(body.productName || 'Wolko Handcrafted').trim(),
      productImage: String(body.productImage || '').trim(),
      userId: String(body.userId || '').trim(),
      authorName: String(body.authorName || 'Customer').trim(),
      authorEmail: String(body.authorEmail || '').trim(),
      authorPhotoURL: body.authorPhotoURL ? String(body.authorPhotoURL) : null,
      rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      commentText: String(body.commentText || '').trim(),
      isVerifiedBuyer: Boolean(body.isVerifiedBuyer),
      helpfulCount: 0,
      timestamp:
        String(body.timestamp || '') || new Date().toLocaleString('en-IN'),
      createdAtMs: Number(body.createdAtMs) || now,
    };

    memoryComments = [
      newComment,
      ...memoryComments.filter((c) => c.commentId !== newComment.commentId),
    ];

    return res.status(200).json({ success: true, comment: newComment });
  }

  if (req.method === 'DELETE') {
    const commentIdParam = req.query?.commentId || '';
    memoryComments = memoryComments.filter(
      (c) => c.commentId !== commentIdParam
    );
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
