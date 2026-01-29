import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Bookmark, Edit2, Check, Share2, UsersIcon, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import ProfileHeader from '../components/ProfileHeader';
import axios from 'axios';
import { getMyPosts, getSavedPosts, toggleLike, toggleSave, updatePost, deletePost } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const { t } = useLanguage();
  const isDark = document.documentElement.classList.contains('dark');
  const [user, setUser] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { id, x, y }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Profile editing states
  const [bioEditing, setBioEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [locationEditing, setLocationEditing] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch profile info
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/me`, authHeaders);
      setUser(res.data.user);
      setBioInput(res.data.user.bio || '');
      setLocationInput(res.data.user.location || '');
      setNicknameInput(res.data.user.nickname || '');
      const friendsRes = await axios.get(`${API_URL}/api/friends`, authHeaders);
      setFriendsCount(friendsRes.data.friends.length);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch user's posts
  const fetchMyPosts = async () => {
    try {
      const res = await getMyPosts();
      setPosts(res.data.posts || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch saved posts
  const fetchSaved = async () => {
    try {
      const res = await getSavedPosts();
      setSavedPosts(res.data.posts || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Save bio
  const handleSaveBio = async () => {
    try {
      await axios.put(`${API_URL}/api/me`, { bio: bioInput }, authHeaders);
      setUser(prev => ({ ...prev, bio: bioInput }));
      setBioEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save bio');
    }
  };

  // Save location
  const handleSaveLocation = async () => {
    try {
      await axios.put(`${API_URL}/api/me`, { location: locationInput }, authHeaders);
      setUser(prev => ({ ...prev, location: locationInput }));
      setLocationEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save location');
    }
  };

  // Save nickname
  const handleSaveNickname = async () => {
    try {
      await axios.put(`${API_URL}/api/me`, { nickname: nicknameInput }, authHeaders);
      setUser(prev => ({ ...prev, nickname: nicknameInput }));
      setNicknameEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save nickname');
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload profile picture
  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${API_URL}/api/me/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(prev => ({ ...prev, profile_picture: res.data.profile_picture }));
      setSelectedFile(null);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to upload profile picture');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMyPosts();
    fetchSaved();
  }, []);

  const navigate = useNavigate();

  // Auth guard render
  if (!isAuthenticated) {
    return (
      <>
        <Header disableNotifications />
        <div className={`min-h-screen bg-gradient-to-br pb-24 pt-20 ${isDark ? 'from-gray-950 via-gray-900 to-gray-800' : 'from-slate-50 via-white to-slate-100'}`}>
          <div className="px-4 max-w-md mx-auto text-center mt-20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-green-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
              <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{t('yourProfile')}</h1>
              <p className={`text-lg px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Please login to view and edit your profile.</p>
            </div>
            
            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-500 to-green-400 text-white py-4 rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {t('goToLogin')}
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all shadow-md ${
                  isDark 
                    ? 'bg-gray-800 border-2 border-gray-700 text-gray-200 hover:bg-gray-700 hover:border-gray-600' 
                    : 'bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {t('createAnAccount')}
              </button>
            </div>

            <p className={`text-xs mt-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {t('byJoining')}
            </p>
          </div>
        </div>
        <Navbar />
      </>
    );
  }

  if (!user) {
    return <p className={`text-center mt-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>;
  }

  const displayPosts = showSaved ? savedPosts : posts;

  return (
    <>
      <ProfileHeader />
      <div className={`pt-20 pb-20 min-h-screen ${isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-slate-800'}`}>
        <div className="max-w-2xl mx-auto px-4">
          {/* Profile Header Section */}
          <div className="flex gap-8 py-8 border-b">
            {/* Profile Picture */}
            <div className="flex justify-center relative">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-500" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                id="profilePicInput"
                className="hidden"
              />
              <button
                onClick={() => document.getElementById('profilePicInput').click()}
                className="absolute bottom-0 right-0 bg-blue-500 px-3 py-1 rounded-full text-white text-xs hover:bg-blue-600 transition"
              >
                Change
              </button>
              {selectedFile && (
                <button
                  onClick={handleUploadProfilePicture}
                  className="absolute top-0 left-0 bg-green-500 px-2 py-1 rounded text-white text-xs hover:bg-green-600 transition"
                >
                  Upload
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {/* Username (not editable) */}
              <div className="mb-1">
                <h1 className="text-2xl font-light text-gray-900">@{user.username}</h1>
              </div>

              {/* Nickname (editable) */}
              <div className="mb-4">
                {nicknameEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                      className="p-1 border rounded text-sm"
                      autoFocus
                      placeholder="Enter nickname"
                    />
                    <button onClick={handleSaveNickname} className="bg-green-500 px-2 py-1 rounded text-white text-xs">
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setNicknameEditing(false);
                        setNicknameInput(user.nickname || '');
                      }}
                      className="text-gray-500 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-light text-gray-700">{user.nickname || 'No nickname'}</p>
                    <button
                      onClick={() => setNicknameEditing(true)}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="mb-3">
                {bioEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveBio()}
                      className="w-full p-2 border rounded text-sm"
                      autoFocus
                      placeholder="Add bio"
                    />
                    <button onClick={handleSaveBio} className="bg-green-500 px-2 py-1 rounded text-white text-xs">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-gray-700">{user.bio || 'No bio'}</p>
                    <button onClick={() => setBioEditing(true)} className="text-gray-400 hover:text-gray-600 text-xs">
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="mb-4">
                {locationEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                      className="w-full p-2 border rounded text-sm"
                      autoFocus
                      placeholder="Add location"
                    />
                    <button onClick={handleSaveLocation} className="bg-green-500 px-2 py-1 rounded text-white text-xs">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user.location || 'No location'}</p>
                    <button onClick={() => setLocationEditing(true)} className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-100' : ''}`}>{posts.length}</span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}> {t('posts')}</span>
                </div>
                <div>
                  <span className={`font-semibold ${isDark ? 'text-gray-100' : ''}`}>{friendsCount}</span>
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}> {t('friends_count')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowShareNotification(true);
                    setTimeout(() => setShowShareNotification(false), 3000);
                  }}
                  className={`flex-1 px-4 py-2 rounded font-semibold text-sm transition flex items-center justify-center gap-2 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <Share2 className="w-4 h-4" /> {t('share')}
                </button>
                <button
                  onClick={() => navigate('/saved-posts')}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-semibold text-sm hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Bookmark className="w-4 h-4" /> {t('saved')}
                </button>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center border-t py-4">
              <h2 className="font-semibold text-sm uppercase tracking-wider">
                {showSaved ? t('savedPosts') : t('posts')}
              </h2>
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="text-blue-500 text-sm font-semibold hover:text-blue-600"
              >
                {showSaved ? t('viewPosts') : t('viewSaved')}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 mt-4">
              {displayPosts.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500 py-8">
                  {showSaved ? t('noSavedPosts') : t('noPostsYet')}
                </div>
              ) : (
                displayPosts.map((p) => (
                  <div
                    key={p.id}
                    className="aspect-square bg-gray-200 relative overflow-hidden rounded group cursor-pointer"
                    onClick={() => setContextMenu(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Only allow delete menu for owner posts
                      if (p.user_id !== user.id) return;
                      setContextMenu({ id: p.id, x: e.clientX, y: e.clientY });
                    }}
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
                      />
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                      {/* Edit Button */}
                      {!showSaved && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newTitle = prompt('Edit title', p.title || '');
                            if (newTitle === null) return;
                            const newCaption = prompt('Edit caption', p.caption || '');
                            if (newCaption === null) return;

                            updatePost(p.id, { title: newTitle, caption: newCaption })
                              .then((res) => {
                                setPosts((prev) =>
                                  prev.map((x) => (x.id === p.id ? res.data.post : x))
                                );
                                alert('Post updated');
                              })
                              .catch((err) => {
                                console.error(err);
                                alert(err?.response?.data?.error || 'Update failed');
                              });
                          }}
                          className="text-white hover:text-gray-300"
                          title="Edit"
                        >
                          <Edit2 size={20} />
                        </button>
                      )}

                      {/* Delete Button (owner only) */}
                      {p.user_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(p.id);
                          }}
                          className="text-white hover:text-red-200"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}

                      {/* Comments Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/posts/${p.id}/comments`);
                        }}
                        className="text-white hover:text-gray-300 flex items-center gap-2"
                        title="Comments"
                      >
                        <span className="text-sm font-semibold">{p.comments_count || 0}</span>
                      </button>

                      {/* Like Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(p.id)
                            .then((res) => {
                              setPosts((prev) =>
                                prev.map((x) =>
                                  x.id === p.id
                                    ? { ...x, liked: res.data.liked, likes_count: res.data.count }
                                    : x
                                )
                              );
                            })
                            .catch((err) => {
                              console.error(err);
                              if (err?.response?.status === 404) {
                                setPosts((prev) => prev.filter((x) => x.id !== p.id));
                              }
                            });
                        }}
                        className={`text-white hover:text-gray-300 flex items-center gap-2`}
                        title="Like"
                      >
                        <Heart
                          size={20}
                          fill={p.liked ? 'currentColor' : 'none'}
                          className={p.liked ? 'text-red-500' : ''}
                        />
                        <span className="text-sm font-semibold">{p.likes_count || 0}</span>
                      </button>

                      {/* Save Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSave(p.id)
                            .then((res) => {
                              if (showSaved) {
                                setSavedPosts((prev) => prev.filter((x) => x.id !== p.id));
                              } else {
                                setPosts((prev) =>
                                  prev.map((x) =>
                                    x.id === p.id
                                      ? { ...x, saved: res.data.saved, saves_count: res.data.count }
                                      : x
                                  )
                                );
                              }
                            })
                            .catch((err) => {
                              console.error(err);
                            });
                        }}
                        className={`text-white hover:text-gray-300 flex items-center gap-2`}
                        title="Save"
                      >
                        <Bookmark
                          size={20}
                          fill={p.saved ? 'currentColor' : 'none'}
                          className={p.saved ? 'text-blue-400' : ''}
                        />
                        <span className="text-sm font-semibold">{p.saves_count || 0}</span>
                      </button>
                    </div>

                    {/* Title overlay */}
                    {p.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-xs truncate">{p.title}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Context menu overlay */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className={`absolute shadow-lg rounded-md border py-2 px-3 text-sm font-medium cursor-pointer ${isDark ? 'bg-gray-900 border-gray-700 text-red-400 hover:bg-gray-800' : 'bg-white border-gray-200 text-red-600 hover:bg-red-50'}`}
            style={{ top: contextMenu.y, left: contextMenu.x, minWidth: '140px' }}
            onClick={(e) => {
              e.stopPropagation();
              const targetId = contextMenu.id;
              setContextMenu(null);
              setConfirmDeleteId(targetId);
            }}
          >
            Delete post
          </div>
        </div>
      )}
      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 px-4" onClick={() => setConfirmDeleteId(null)}>
          <div className={`rounded-lg shadow-xl max-w-sm w-full p-5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete post?</h3>
            <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded border border-gray-200 text-gray-700 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetId = confirmDeleteId;
                  setConfirmDeleteId(null);
                  deletePost(targetId)
                    .then(() => {
                      setPosts((prev) => prev.filter((x) => x.id !== targetId));
                      setSavedPosts((prev) => prev.filter((x) => x.id !== targetId));
                    })
                    .catch((err) => {
                      console.error(err);
                      alert(err?.response?.data?.error || 'Delete failed');
                    });
                }}
                className="px-4 py-2 rounded bg-red-500 text-white text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-semibold">{t('profilePictureUpdated')}</span>
          </div>
        </div>
      )}

      {/* Share Notification */}
      {showShareNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-semibold">{t('profileLinkCopied')}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          10% { transform: translate(-50%, 0); opacity: 1; }
          90% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, 20px); opacity: 0; }
        }
        .animate-slideDown {
          animation: slideDown 3s ease-out forwards;
        }
      `}</style>

      <Navbar />
    </>
  );
}

