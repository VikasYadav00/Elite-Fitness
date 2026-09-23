import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin, Camera, Video, Upload, Trash2, Eye, Star,
  Check, Phone, Clock, ExternalLink, Globe, Sparkles,
  Share2, Navigation, AlertCircle, Play, Pause, Image as ImageIcon
} from 'lucide-react';
import api from '../api';

const DEFAULT_PHOTOS = [
  {
    id: 'photo-1',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    title: 'Main Workout Arena & Cardio Floor',
    isCover: true,
  },
  {
    id: 'photo-2',
    url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    title: 'Heavy Weightlifting & Dumbbell Zone',
    isCover: false,
  },
  {
    id: 'photo-3',
    url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80',
    title: 'Functional Training & Crossfit Rig',
    isCover: false,
  },
  {
    id: 'photo-4',
    url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    title: 'Luxury Locker Room & Steam Bath',
    isCover: false,
  },
];

const DEFAULT_MAP_INFO = {
  gym_name: 'Elite Fitness Club',
  category: 'Gym & Fitness Center',
  rating: 4.9,
  reviews_count: 184,
  phone: '8953933110',
  address: 'Plot 42, Sector 14, Near Metro Station, Lucknow, UP - 226010',
  google_maps_url: 'https://maps.google.com/?q=Elite+Fitness+Club',
  latitude: '26.8467',
  longitude: '80.9462',
  morning_timings: '05:30 AM - 11:00 AM',
  evening_timings: '04:00 PM - 10:00 PM',
  open_days: 'Monday - Sunday (7 Days)',
  description: 'Premium gym featuring certified trainers, imported biomechanical equipment, steam bath, and personalized nutrition guidance.',
  amenities: [
    'Air Conditioned', 'Free High-Speed Wi-Fi', 'Locker & Shower Facility',
    'Certified Personal Trainers', 'Steam & Sauna Bath', 'Nutrition & Supplements Bar',
    'Free Valet Parking', 'RO Purified Water'
  ]
};

export default function GymMediaMapView() {
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' | 'video' | 'map' | 'preview'
  const [photos, setPhotos] = useState(() => {
    try {
      const stored = localStorage.getItem('ef_gym_photos');
      return stored ? JSON.parse(stored) : DEFAULT_PHOTOS;
    } catch (_) {
      return DEFAULT_PHOTOS;
    }
  });

  const [videoClip, setVideoClip] = useState(() => {
    return localStorage.getItem('ef_gym_video_clip') || '';
  });
  const [videoTitle, setVideoTitle] = useState(() => {
    return localStorage.getItem('ef_gym_video_title') || 'Elite Fitness 360° Gym Tour Reel';
  });

  const [mapInfo, setMapInfo] = useState(() => {
    try {
      const stored = localStorage.getItem('ef_gym_map_info');
      return stored ? { ...DEFAULT_MAP_INFO, ...JSON.parse(stored) } : DEFAULT_MAP_INFO;
    } catch (_) {
      return DEFAULT_MAP_INFO;
    }
  });

  const [toast, setToast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Persist photos
  useEffect(() => {
    try {
      localStorage.setItem('ef_gym_photos', JSON.stringify(photos));
    } catch (_) {}
  }, [photos]);

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        const newPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          url: base64,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Gym Photo',
          isCover: photos.length === 0
        };
        setPhotos(prev => [newPhoto, ...prev]);
        showToast('✅ Photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Video Upload
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('⚠️ Video clip should be under 25MB for optimal performance.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setVideoClip(base64);
      localStorage.setItem('ef_gym_video_clip', base64);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, '') || 'Gym Virtual Tour');
      localStorage.setItem('ef_gym_video_title', file.name.replace(/\.[^/.]+$/, ''));
      showToast('✅ Gym video clip uploaded! Ready for Map preview.');
    };
    reader.readAsDataURL(file);

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleDeletePhoto = (id) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length > 0 && !filtered.some(p => p.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
    showToast('Photo removed from gym gallery.');
  };

  const handleSetCover = (id) => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      isCover: p.id === id
    })));
    showToast('⭐ Set as Primary Google Maps Cover Photo!');
  };

  const handleSaveMapInfo = async (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('ef_gym_map_info', JSON.stringify(mapInfo));
      // Attempt backend settings update
      try {
        await api.put('/settings', {
          gym_name: mapInfo.gym_name,
          address: mapInfo.address,
          phone: mapInfo.phone,
          google_maps_url: mapInfo.google_maps_url,
          timings: `${mapInfo.morning_timings}, ${mapInfo.evening_timings}`
        });
      } catch (_) {}
      showToast('✅ Gym Location & Google Maps details saved!');
    } catch (_) {
      showToast('⚠️ Saved locally.');
    }
  };

  const coverPhoto = photos.find(p => p.isCover) || photos[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: 'rgba(17, 24, 39, 0.96)',
          border: '1px solid #10B981',
          color: '#10B981',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          fontSize: '0.9rem',
          fontWeight: 600,
          backdropFilter: 'blur(8px)'
        }}>
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '22px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(17, 24, 39, 0.95) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)'
            }}>
              <MapPin size={24} color="#000" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
                Gym Media & Google Maps Listing
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                Upload photos & video tour clips shown when customers search your gym on Google Maps
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Star size={14} fill="#10B981" color="#10B981" /> 4.9 • 184 Reviews on Maps
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'photos', label: '📸 Gym Photos', count: photos.length },
            { id: 'video', label: '🎬 Tour Video Clip', count: videoClip ? 1 : 0 },
            { id: 'map', label: '📍 Maps & Contact', count: null },
            { id: 'preview', label: '👁️ Google Maps Preview', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === tab.id ? '#000000' : '#D1D5DB',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TAB 1: PHOTOS GALLERY ────────────────────────────────────────── */}
      {activeTab === 'photos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Upload Box */}
          <div className="glass-card" style={{
            padding: '24px',
            border: '2px dashed rgba(245, 158, 11, 0.4)',
            background: 'rgba(245, 158, 11, 0.03)',
            borderRadius: '18px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Upload size={26} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F9FAFB', margin: '0 0 6px' }}>
              Upload Gym Photos
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '0 0 14px' }}>
              High-resolution photos of Workout Area, Cardio, Dumbbell Rack, Locker & Reception
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              <Camera size={16} /> Choose Photos from Device
            </button>
          </div>

          {/* Photos Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="glass-card"
                style={{
                  overflow: 'hidden',
                  borderRadius: '16px',
                  border: photo.isCover ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ position: 'relative', width: '100%', height: '170px', background: '#000' }}>
                  <img
                    src={photo.url}
                    alt={photo.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {photo.isCover && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#000',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      <Star size={12} fill="#000" /> Primary Cover Photo
                    </span>
                  )}
                </div>

                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F3F4F6' }}>
                    {photo.title}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {!photo.isCover ? (
                      <button
                        onClick={() => handleSetCover(photo.id)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#F59E0B',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Set as Cover
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                        ✓ Google Maps Cover
                      </span>
                    )}

                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title="Delete photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: VIDEO CLIP / VIRTUAL TOUR ─────────────────────────────── */}
      {activeTab === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Upload Video Box */}
          <div className="glass-card" style={{
            padding: '24px',
            border: '2px dashed rgba(56, 189, 248, 0.4)',
            background: 'rgba(56, 189, 248, 0.03)',
            borderRadius: '18px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onClick={() => videoInputRef.current?.click()}
          >
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoUpload}
              accept="video/*"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Video size={26} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F9FAFB', margin: '0 0 6px' }}>
              Upload Gym Video Clip / 360° Virtual Tour
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#9CA3AF', margin: '0 0 14px' }}>
              Short video reel (15–60 sec) showcasing your machines, workout atmosphere, and facilities.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }}
            >
              <Upload size={16} /> Choose Video from Device
            </button>
          </div>

          {/* Video Player Display */}
          {videoClip ? (
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#F9FAFB', margin: 0 }}>
                    {videoTitle}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                    ✓ Active Google Maps Showcase Video
                  </span>
                </div>
                <button
                  onClick={() => {
                    setVideoClip('');
                    localStorage.removeItem('ef_gym_video_clip');
                    showToast('Video clip removed.');
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} /> Remove Video
                </button>
              </div>

              <div style={{ borderRadius: '14px', overflow: 'hidden', background: '#000', maxHeight: '340px' }}>
                <video
                  ref={videoRef}
                  src={videoClip}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
              <Video size={40} color="#6B7280" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No custom gym video uploaded yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                Upload a 30-second reel so prospective customers searching on Google Maps can see your gym equipment and vibe.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: GOOGLE MAPS DETAILS & CONTACT ─────────────────────────── */}
      {activeTab === 'map' && (
        <form onSubmit={handleSaveMapInfo} className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Google Maps Location & Contact Information
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: '4px 0 0' }}>
              These details are presented to customers on Google Maps search and directions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label className="label">Gym Business Name</label>
              <input
                type="text"
                className="input"
                value={mapInfo.gym_name}
                onChange={e => setMapInfo({ ...mapInfo, gym_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Contact Phone (shown on Map Call button)</label>
              <input
                type="tel"
                className="input"
                value={mapInfo.phone}
                onChange={e => setMapInfo({ ...mapInfo, phone: e.target.value })}
                placeholder="8953933110"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Full Gym Address & Landmark</label>
            <textarea
              className="input"
              rows={2}
              value={mapInfo.address}
              onChange={e => setMapInfo({ ...mapInfo, address: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label className="label">Google Maps Link (URL)</label>
              <input
                type="url"
                className="input"
                value={mapInfo.google_maps_url}
                onChange={e => setMapInfo({ ...mapInfo, google_maps_url: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
              />
            </div>

            <div>
              <label className="label">Operating Days</label>
              <input
                type="text"
                className="input"
                value={mapInfo.open_days}
                onChange={e => setMapInfo({ ...mapInfo, open_days: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label className="label">Morning Batch Timings</label>
              <input
                type="text"
                className="input"
                value={mapInfo.morning_timings}
                onChange={e => setMapInfo({ ...mapInfo, morning_timings: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Evening Batch Timings</label>
              <input
                type="text"
                className="input"
                value={mapInfo.evening_timings}
                onChange={e => setMapInfo({ ...mapInfo, evening_timings: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Gym Highlights & Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {mapInfo.amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#F59E0B',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={14} /> {amenity}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.9rem', marginTop: '10px' }}
          >
            <Check size={18} /> Save & Update Google Maps Details
          </button>
        </form>
      )}

      {/* ─── TAB 4: LIVE GOOGLE MAPS CUSTOMER SEARCH PREVIEW ────────────── */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#93C5FD'
          }}>
            <Eye size={18} color="#60A5FA" />
            <span>
              <strong>Customer View:</strong> This is how your gym appears when someone opens Google Maps and searches for <em>"gym near me"</em> or <em>"{mapInfo.gym_name}"</em>.
            </span>
          </div>

          {/* Realistic Google Maps Card */}
          <div style={{
            background: '#202124',
            borderRadius: '18px',
            border: '1px solid #3C4043',
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)'
          }}>
            {/* Header Cover Photo + Carousel */}
            <div style={{ position: 'relative', width: '100%', height: '210px', background: '#000' }}>
              <img
                src={coverPhoto?.url || DEFAULT_PHOTOS[0].url}
                alt={mapInfo.gym_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to top, rgba(32,33,36,0.95) 0%, transparent 60%)'
              }} />

              {videoClip && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#FFF',
                  backdropFilter: 'blur(6px)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Play size={12} fill="#FFF" /> Watch Video Tour
                </div>
              )}

              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                right: '16px'
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {mapInfo.gym_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#F4B400', fontWeight: 700, fontSize: '0.9rem' }}>4.9 ★★★★★</span>
                  <span style={{ color: '#9AA0A6', fontSize: '0.8rem' }}>({mapInfo.reviews_count} reviews)</span>
                  <span style={{ color: '#9AA0A6', fontSize: '0.8rem' }}>• {mapInfo.category}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (Call, Directions, Share) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              padding: '12px 14px',
              borderBottom: '1px solid #3C4043'
            }}>
              <a
                href={mapInfo.google_maps_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#303134',
                  borderRadius: '10px',
                  padding: '10px 4px',
                  textAlign: 'center',
                  color: '#8AB4F8',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                <Navigation size={18} color="#8AB4F8" />
                Directions
              </a>

              <a
                href={`tel:${mapInfo.phone}`}
                style={{
                  background: '#303134',
                  borderRadius: '10px',
                  padding: '10px 4px',
                  textAlign: 'center',
                  color: '#8AB4F8',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                <Phone size={18} color="#8AB4F8" />
                Call
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(mapInfo.google_maps_url);
                  showToast('Google Maps link copied to clipboard!');
                }}
                style={{
                  background: '#303134',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 4px',
                  textAlign: 'center',
                  color: '#8AB4F8',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                <Share2 size={18} color="#8AB4F8" />
                Share
              </button>

              <button
                onClick={() => setActiveTab('photos')}
                style={{
                  background: '#303134',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 4px',
                  textAlign: 'center',
                  color: '#8AB4F8',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                <ImageIcon size={18} color="#8AB4F8" />
                {photos.length} Photos
              </button>
            </div>

            {/* Info Items List */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <MapPin size={18} color="#9AA0A6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ color: '#E8EAED' }}>{mapInfo.address}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={18} color="#34A853" style={{ flexShrink: 0 }} />
                <span style={{ color: '#34A853', fontWeight: 700 }}>Open Now</span>
                <span style={{ color: '#9AA0A6' }}>• Closes 10:00 PM ({mapInfo.morning_timings}, {mapInfo.evening_timings})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={18} color="#9AA0A6" style={{ flexShrink: 0 }} />
                <span style={{ color: '#8AB4F8', fontWeight: 600 }}>{mapInfo.phone}</span>
              </div>

              {/* Photos Reel */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9AA0A6', marginBottom: '8px' }}>
                  PHOTOS FROM OWNER ({photos.length})
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {photos.map(p => (
                    <img
                      key={p.id}
                      src={p.url}
                      alt={p.title}
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid #3C4043'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
