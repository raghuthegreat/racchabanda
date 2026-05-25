'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BilingualInput from '@/components/shared/BilingualInput';
import { createPost, uploadImage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function NewTypoPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError('Caption అవసరం'); return; }
    if (!imageFile) { setError('Screenshot లేదా image అవసరం'); return; }

    try {
      setSubmitting(true);
      setError(null);

      // Upload image first
      const { url: imageUrl } = await uploadImage(imageFile);

      // Create post
      const post = await createPost({
        title: title.trim(),
        body: body.trim() || null,
        image_url: imageUrl,
        post_type: 'image',
        category_slug: 'telugu-typos',
      });

      router.push(`/telugu-typos`);
    } catch (e) {
      setError(e.message || 'Submit చేయడంలో సమస్య. మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) return <div className="text-center py-16 text-stone-400">లోడ్ అవుతోంది...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 max-w-sm w-full text-center">
          <p className="text-2xl mb-3">🔐</p>
          <p className="text-slate-700 font-medium mb-2">Login అవ్వాలి</p>
          <p className="text-stone-500 text-sm mb-4">పోస్ట్ చేయడానికి login చేయండి</p>
          <a href="https://yaasalu.com/login" className="inline-block bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
            Login చేయండి
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/telugu-typos" className="text-stone-500 hover:text-stone-700 text-sm flex items-center gap-1 mb-6">
          ← తప్పుల తడకకి వెళ్ళు
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h1 className="text-xl font-bold text-slate-900 mb-1">తప్పు పోస్ట్ చేయండి</h1>
          <p className="text-stone-500 text-sm mb-6">Screenshot, WhatsApp blunder, autocorrect disaster — share it!</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Screenshot / Image <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  imagePreview ? 'border-amber-300 bg-amber-50' : 'border-stone-200 hover:border-amber-300'
                }`}
                onClick={() => document.getElementById('image-input').click()}
              >
                {imagePreview ? (
                  <div>
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                    <p className="text-xs text-stone-400 mt-2">మార్చడానికి click చేయండి</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📸</p>
                    <p className="text-stone-500 text-sm">Image upload చేయండి</p>
                    <p className="text-stone-400 text-xs mt-1">PNG, JPG, GIF · max 5 MB</p>
                  </div>
                )}
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Caption */}
            <BilingualInput
              label={<>Caption / శీర్షిక <span className="text-red-500">*</span></>}
              placeholder="ఏం జరిగిందో చెప్పండి..."
              value={title}
              onChange={setTitle}
              required
            />

            {/* Story */}
            <BilingualInput
              label="వివరాలు (optional)"
              placeholder="ఈ తప్పు ఎలా జరిగింది? కథ చెప్పండి..."
              value={body}
              onChange={setBody}
              multiline
            />

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                {submitting ? 'పోస్ట్ అవుతోంది...' : 'పోస్ట్ చేయండి'}
              </button>
              <Link
                href="/telugu-typos"
                className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors"
              >
                రద్దు చేయి
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
