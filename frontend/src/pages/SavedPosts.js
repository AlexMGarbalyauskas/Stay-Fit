import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Share2, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProfileHeader from '../components/ProfileHeader';
import { getSavedPosts, toggleLike, toggleSave } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function SavedPosts() {
  const { t } = useLanguage();
  const [theme] = useState(localStorage.getItem('theme') || 'light');
  const isDark = theme === 'dark';
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const navigate = useNavigate();

  const fetchSavedPosts = async () => {
    try {
      const res = await getSavedPosts();
      setSavedPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  if (loading) {
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;
  }

  return (
    <>
      <ProfileHeader />
      <div className="pt-20 pb-20 min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 mt-4">
            <button
              onClick={() => navigate('/profile')}
              className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h2 className="text-xl font-bold">Saved Posts</h2>
          </div>

          {/* Saved Posts Grid */}
          <div className="grid grid-cols-3 gap-1">
            {savedPosts.length === 0 ? (
              <div className="col-span-3 text-center text-sm text-gray-500 p-4">
                No saved posts yet.
              </div>
            ) : (
              savedPosts.map((p) => (
                <div
                  key={p.id}
                  className="aspect-square bg-black flex items-center justify-center overflow-hidden rounded relative group"
                >
                  {p.media_type && p.media_type.startsWith('image/') ? (
                    <img
                      src={`${API_URL}${p.media_path}`}
                      className="w-full h-full object-cover"
                      alt="post"
                    />
                  ) : (
                    <video
                      src={`${API_URL}${p.media_path}`}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}

                  {/* Show title overlay if exists */}
                  {p.title && (
                    <div className="absolute left-2 bottom-12 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                      {p.title}
                    </div>
                  )}

                  {/* Comments button */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => navigate(`/posts/${p.id}/comments`)}
                      className="bg-white bg-opacity-90 px-2 py-1 rounded text-xs"
                    >
                      Comments
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute bottom-2 left-2 flex gap-2 items-center opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() =>
                        toggleLike(p.id)
                          .then((res) =>
                            setSavedPosts((prev) =>
                              prev.map((x) =>
                                x.id === p.id
                                  ? { ...x, liked: res.data.liked, likes_count: res.data.count }
                                  : x
                              )
                            )
                          )
                          .catch((err) => {
                            console.error(err);
                            if (err?.response?.status === 404) {
                              setSavedPosts((prev) => prev.filter((x) => x.id !== p.id));
                            } else {
                              alert('Failed to like');
                            }
                          })
                      }
                      className={`bg-white bg-opacity-80 px-2 py-1 rounded text-xs ${
                        p.liked ? 'text-red-500' : 'text-gray-700'
                      }`}
                    >
                      <Heart className="w-4 h-4 inline" /> {p.likes_count || ''}
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href.replace('/saved-posts', '') + `#post-${p.id}`);
                        alert('Link copied');
                      }}
                      className="bg-white bg-opacity-80 px-2 py-1 rounded text-xs text-gray-700"
                    >
                      <Share2 className="w-4 h-4 inline" />
                    </button>

                    <button
                      onClick={() =>
                        toggleSave(p.id)
                          .then((res) => {
                            setSavedPosts((prev) => prev.filter((x) => x.id !== p.id));
                          })
                          .catch((err) => {
                            console.error(err);
                            if (err?.response?.status === 404) {
                              setSavedPosts((prev) => prev.filter((x) => x.id !== p.id));
                            } else {
                              alert('Failed to unsave');
                            }
                          })
                      }
                      className={`bg-white bg-opacity-80 px-2 py-1 rounded text-xs ${
                        p.saved ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Navbar />
    </>
  );
}
