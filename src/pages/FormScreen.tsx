import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CATEGORIES, CategoryId } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, MapPin, ChevronLeft, Loader2 } from 'lucide-react';
import { reportService } from '../services/reportService';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function FormScreen() {
  const { categoryId } = useParams<{ categoryId: CategoryId }>();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === categoryId);
  const [location, setLocation] = useState<[number, number]>([51.4944, -0.0687]); // Bermondsey
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  if (!category) return <div>Category not found</div>;

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLocation([e.latlng.lat, e.latlng.lng]);
      },
    });
    return <Marker position={location} />;
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const report = await reportService.submitReport({
        categoryId: category.id,
        location: { lat: location[0], lng: location[1] },
        description: data.description,
        photo: photo || undefined,
        details: data
      });
      navigate('/report/success', { state: { report } });
    } catch (error) {
      console.error(error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-lg">{category.title} Report</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6 pb-24">
        {/* Map Picker */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <MapPin size={16} /> Location
          </label>
          <div className="h-48 rounded-[14px] overflow-hidden border border-gray-200 z-0">
            <MapContainer center={location} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
            </MapContainer>
          </div>
          <p className="text-[10px] text-gray-400 italic">Tap map to adjust pin location</p>
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Camera size={16} /> Photo
          </label>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <label className="w-24 h-24 rounded-[14px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shrink-0">
              <Camera size={24} className="text-gray-400" />
              <span className="text-[10px] text-gray-400 mt-1 font-bold">Add Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {photo && (
              <div className="w-24 h-24 rounded-[14px] overflow-hidden border border-gray-200 shrink-0 relative">
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                >
                  <Icons.X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Description</label>
          <textarea
            {...register('description', { required: true })}
            placeholder="Please provide details about the issue..."
            className="w-full p-3 rounded-[14px] border border-gray-200 text-sm min-h-[100px] focus:ring-2 focus:ring-[#1a1a2e] focus:border-transparent outline-none"
          />
          {errors.description && <p className="text-red-500 text-[10px]">Description is required</p>}
          <p className="text-[10px] text-gray-400 italic">
            Note: Reports are published publicly. Do not include personal names or car number plates.
          </p>
        </div>

        {/* Category Specific Fields */}
        {category.id === 'rough-sleeping' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Time Seen</label>
              <input type="time" {...register('timeSeen')} className="w-full p-3 rounded-[14px] border border-gray-200 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Appearance Description</label>
              <input type="text" {...register('appearance')} placeholder="e.g. Blue jacket, sleeping bag" className="w-full p-3 rounded-[14px] border border-gray-200 text-sm" />
            </div>
          </div>
        )}

        {category.id === 'fly-tipping' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Type of Rubbish</label>
            <select {...register('rubbishType')} className="w-full p-3 rounded-[14px] border border-gray-200 text-sm">
              <option value="fly-tipped">Fly-tipped waste</option>
              <option value="overflowing">Overflowing bin</option>
              <option value="litter">Street litter</option>
              <option value="hazardous">Hazardous waste</option>
            </select>
          </div>
        )}

        {category.id === 'abandoned-vehicle' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Vehicle Registration (if visible)</label>
            <input 
              type="text" 
              {...register('registration')} 
              placeholder="e.g. AB12 CDE" 
              className="w-full p-3 rounded-[14px] border border-gray-200 text-sm uppercase" 
            />
          </div>
        )}

        {category.id === 'noise' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Noise Type</label>
              <input type="text" {...register('noiseType')} placeholder="e.g. Loud music, construction" className="w-full p-3 rounded-[14px] border border-gray-200 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Is this ongoing?</label>
              <select {...register('isOngoing')} className="w-full p-3 rounded-[14px] border border-gray-200 text-sm">
                <option value="one-off">One-off incident</option>
                <option value="ongoing">Ongoing / Frequent</option>
              </select>
            </div>
          </div>
        )}

        {category.id === 'potholes' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Severity</label>
            <select {...register('severity')} className="w-full p-3 rounded-[14px] border border-gray-200 text-sm">
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        )}

        {category.id === 'asb' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">ASB Tier</label>
            <select {...register('tier')} className="w-full p-3 rounded-[14px] border border-gray-200 text-sm">
              <option value="3">Tier 3: Nuisance (5-day response)</option>
              <option value="2">Tier 2: Rowdy behaviour (3-day response)</option>
              <option value="1">Tier 1: Hate-related (Next-day response)</option>
            </select>
          </div>
        )}

        {category.id === 'flooding' && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Type of Flooding</label>
            <select {...register('floodType')} className="w-full p-3 rounded-[14px] border border-gray-200 text-sm">
              <option value="surface">Surface Water (Council)</option>
              <option value="sewer">Sewer / Foul Water (Thames Water)</option>
            </select>
          </div>
        )}

        {/* Contact info */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Email (Optional, for tracking)</label>
          <input
            type="email"
            {...register('email')}
            placeholder="your@email.com"
            className="w-full p-3 rounded-[14px] border border-gray-200 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-[#1a1a2e] text-white rounded-[14px] font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Report'
          )}
        </button>
      </form>
    </div>
  );
}
