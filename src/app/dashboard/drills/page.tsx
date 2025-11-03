'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import Modal from '@/components/ui/Modal';
import SignaturePad from '@/components/check/SignaturePad';
import { Siren, Plus, Edit2, Trash2, Users, Clock, MapPin, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { Site } from '@/types';
import { formatUKDate } from '@/lib/utils/date';

interface FireDrill {
  id: string;
  orgId: string;
  siteId: string;
  date: Date;
  startTime: string;
  evacuationTime: number; // seconds
  alarmType: 'manual' | 'automatic' | 'test';
  assemblyPoint: string;
  expectedHeadcount: number;
  actualHeadcount: number;
  allAccountedFor: boolean;
  issues: string;
  observations: string;
  conductedBy: string;
  signature?: string; // Base64 data URL
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number; // meters
  weatherConditions?: string;
  nextDrillDue?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ALARM_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual Call Point' },
  { value: 'automatic', label: 'Automatic Detection' },
  { value: 'test', label: 'Test Mode' },
];

export default function DrillsPage() {
  const { userData } = useAuth();
  const [drills, setDrills] = useState<FireDrill[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDrill, setEditingDrill] = useState<FireDrill | null>(null);

  // Filters
  const [selectedSite, setSelectedSite] = useState<string>('all');

  // Signature state
  const [signature, setSignature] = useState<string>('');

  // GPS state
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string>('');
  const [capturingGps, setCapturingGps] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    evacuationTime: '',
    alarmType: 'manual' as FireDrill['alarmType'],
    assemblyPoint: '',
    expectedHeadcount: '',
    actualHeadcount: '',
    allAccountedFor: true,
    issues: '',
    observations: '',
    conductedBy: '',
    weatherConditions: '',
    nextDrillDue: '',
  });

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    await Promise.all([fetchDrills(), fetchSites()]);
  };

  const fetchDrills = async () => {
    try {
      setLoading(true);
      const drillsQuery = query(
        collection(db, 'fire_drills'),
        where('orgId', '==', userData!.orgId)
      );
      const drillsSnapshot = await getDocs(drillsQuery);
      const drillsData = drillsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        nextDrillDue: doc.data().nextDrillDue?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as FireDrill[];

      // Sort by date descending
      drillsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setDrills(drillsData);
    } catch (err) {
      console.error('Error fetching fire drills:', err);
      setError('Failed to load fire drills');
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      const sitesData = sitesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Site[];
      setSites(sitesData);

      // Auto-select first site
      if (sitesData.length > 0 && !formData.siteId) {
        setFormData({ ...formData, siteId: sitesData[0].id });
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const captureGpsLocation = () => {
    setCapturingGps(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('GPS not supported by browser');
      setCapturingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setCapturingGps(false);
      },
      (error) => {
        setGpsError(error.message || 'Failed to get location');
        setCapturingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const resetForm = () => {
    setFormData({
      siteId: sites.length > 0 ? sites[0].id : '',
      date: new Date().toISOString().split('T')[0],
      startTime: '',
      evacuationTime: '',
      alarmType: 'manual',
      assemblyPoint: '',
      expectedHeadcount: '',
      actualHeadcount: '',
      allAccountedFor: true,
      issues: '',
      observations: '',
      conductedBy: '',
      weatherConditions: '',
      nextDrillDue: '',
    });
    setSignature('');
    setGpsLocation(null);
    setGpsError('');
    setError('');
  };

  const handleCreateDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setError('');

      if (!formData.siteId || !formData.startTime || !formData.evacuationTime) {
        setError('Site, start time, and evacuation time are required');
        return;
      }

      await addDoc(collection(db, 'fire_drills'), {
        orgId: userData.orgId,
        siteId: formData.siteId,
        date: new Date(formData.date),
        startTime: formData.startTime,
        evacuationTime: Math.round(parseFloat(formData.evacuationTime) * 60), // Convert minutes to seconds
        alarmType: formData.alarmType,
        assemblyPoint: formData.assemblyPoint.trim() || undefined,
        expectedHeadcount: formData.expectedHeadcount ? parseInt(formData.expectedHeadcount) : undefined,
        actualHeadcount: formData.actualHeadcount ? parseInt(formData.actualHeadcount) : undefined,
        allAccountedFor: formData.allAccountedFor,
        issues: formData.issues.trim() || undefined,
        observations: formData.observations.trim() || undefined,
        conductedBy: formData.conductedBy.trim() || undefined,
        signature: signature || undefined,
        latitude: gpsLocation?.latitude,
        longitude: gpsLocation?.longitude,
        locationAccuracy: gpsLocation?.accuracy,
        weatherConditions: formData.weatherConditions.trim() || undefined,
        nextDrillDue: formData.nextDrillDue ? new Date(formData.nextDrillDue) : undefined,
        createdBy: userData.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await fetchDrills();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating fire drill:', err);
      setError(err.message || 'Failed to create fire drill');
    }
  };

  const handleEditDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !editingDrill) return;

    try {
      setError('');

      if (!formData.siteId || !formData.startTime || !formData.evacuationTime) {
        setError('Site, start time, and evacuation time are required');
        return;
      }

      await updateDoc(doc(db, 'fire_drills', editingDrill.id), {
        siteId: formData.siteId,
        date: new Date(formData.date),
        startTime: formData.startTime,
        evacuationTime: Math.round(parseFloat(formData.evacuationTime) * 60), // Convert minutes to seconds
        alarmType: formData.alarmType,
        assemblyPoint: formData.assemblyPoint.trim() || undefined,
        expectedHeadcount: formData.expectedHeadcount ? parseInt(formData.expectedHeadcount) : undefined,
        actualHeadcount: formData.actualHeadcount ? parseInt(formData.actualHeadcount) : undefined,
        allAccountedFor: formData.allAccountedFor,
        issues: formData.issues.trim() || undefined,
        observations: formData.observations.trim() || undefined,
        conductedBy: formData.conductedBy.trim() || undefined,
        signature: signature || undefined,
        latitude: gpsLocation?.latitude,
        longitude: gpsLocation?.longitude,
        locationAccuracy: gpsLocation?.accuracy,
        weatherConditions: formData.weatherConditions.trim() || undefined,
        nextDrillDue: formData.nextDrillDue ? new Date(formData.nextDrillDue) : undefined,
        updatedAt: new Date(),
      });

      await fetchDrills();
      setShowEditModal(false);
      setEditingDrill(null);
      resetForm();
    } catch (err: any) {
      console.error('Error updating fire drill:', err);
      setError(err.message || 'Failed to update fire drill');
    }
  };

  const handleDeleteDrill = async (drill: FireDrill) => {
    if (!confirm(`Are you sure you want to delete this fire drill record?`)) return;

    try {
      await deleteDoc(doc(db, 'fire_drills', drill.id));
      await fetchDrills();
    } catch (err) {
      console.error('Error deleting fire drill:', err);
      alert('Failed to delete fire drill');
    }
  };

  const openEditModal = (drill: FireDrill) => {
    setEditingDrill(drill);
    setFormData({
      siteId: drill.siteId,
      date: formatUKDate(drill.date, 'yyyy-MM-dd'),
      startTime: drill.startTime,
      evacuationTime: (drill.evacuationTime / 60).toString(), // Convert seconds to minutes
      alarmType: drill.alarmType,
      assemblyPoint: drill.assemblyPoint || '',
      expectedHeadcount: drill.expectedHeadcount?.toString() || '',
      actualHeadcount: drill.actualHeadcount?.toString() || '',
      allAccountedFor: drill.allAccountedFor,
      issues: drill.issues || '',
      observations: drill.observations || '',
      conductedBy: drill.conductedBy || '',
      weatherConditions: drill.weatherConditions || '',
      nextDrillDue: drill.nextDrillDue ? formatUKDate(drill.nextDrillDue, 'yyyy-MM-dd') : '',
    });
    setSignature(drill.signature || '');
    if (drill.latitude && drill.longitude) {
      setGpsLocation({
        latitude: drill.latitude,
        longitude: drill.longitude,
        accuracy: drill.locationAccuracy || 0,
      });
    }
    setShowEditModal(true);
  };

  const getSiteName = (siteId: string) => {
    return sites.find((s) => s.id === siteId)?.name || 'Unknown Site';
  };

  const formatEvacuationTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const filteredDrills = drills.filter((drill) => {
    if (selectedSite !== 'all' && drill.siteId !== selectedSite) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading fire drills...</div>
      </div>
    );
  }

  const renderDrillForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormError message={error} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Site *</label>
          <select
            value={formData.siteId}
            onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          >
            <option value="">Select site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Start Time *</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">
            Evacuation Time (minutes) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.evacuationTime}
            onChange={(e) => setFormData({ ...formData, evacuationTime: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g., 3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Alarm Type</label>
          <select
            value={formData.alarmType}
            onChange={(e) => setFormData({ ...formData, alarmType: e.target.value as FireDrill['alarmType'] })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ALARM_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Assembly Point</label>
        <input
          type="text"
          value={formData.assemblyPoint}
          onChange={(e) => setFormData({ ...formData, assemblyPoint: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="e.g., Main car park, North entrance"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Expected Headcount</label>
          <input
            type="number"
            value={formData.expectedHeadcount}
            onChange={(e) => setFormData({ ...formData, expectedHeadcount: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            min="0"
            placeholder="Number of people expected"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Actual Headcount</label>
          <input
            type="number"
            value={formData.actualHeadcount}
            onChange={(e) => setFormData({ ...formData, actualHeadcount: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            min="0"
            placeholder="Number of people evacuated"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.allAccountedFor}
            onChange={(e) => setFormData({ ...formData, allAccountedFor: e.target.checked })}
            className="rounded border-brand-300"
          />
          <span className="text-sm text-brand-700">All personnel accounted for</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Conducted By</label>
        <input
          type="text"
          value={formData.conductedBy}
          onChange={(e) => setFormData({ ...formData, conductedBy: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Name of person who conducted the drill"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Weather Conditions</label>
        <input
          type="text"
          value={formData.weatherConditions}
          onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="e.g., Dry, Raining, Cold"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">
          Issues / Problems Encountered
        </label>
        <textarea
          value={formData.issues}
          onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          placeholder="Any problems, delays, or safety concerns"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">
          Observations / Lessons Learned
        </label>
        <textarea
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          placeholder="Positive points, areas for improvement, recommendations"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Next Drill Due</label>
        <input
          type="date"
          value={formData.nextDrillDue}
          onChange={(e) => setFormData({ ...formData, nextDrillDue: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-brand-600 mt-1">Typically 6 months from this drill</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">GPS Location</label>
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={captureGpsLocation}
            disabled={capturingGps}
            className="w-full"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {capturingGps ? 'Capturing location...' : gpsLocation ? 'Recapture Location' : 'Capture Location'}
          </Button>
          {gpsLocation && (
            <div className="p-2 bg-green-50 border border-green-300 rounded text-xs">
              <p className="font-medium text-green-900">Location captured</p>
              <p className="text-green-700">
                {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
              </p>
              <p className="text-green-600">Accuracy: ±{gpsLocation.accuracy.toFixed(0)}m</p>
            </div>
          )}
          {gpsError && (
            <div className="p-2 bg-orange-50 border border-orange-300 rounded text-xs">
              <p className="text-orange-700">{gpsError}</p>
            </div>
          )}
          <p className="text-xs text-brand-600">GPS location verifies drill happened at site</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Signature</label>
        <SignaturePad
          value={signature}
          onSave={setSignature}
        />
        <p className="text-xs text-brand-600 mt-1">Digital signature for compliance record</p>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {isEdit ? 'Save Changes' : 'Create Record'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingDrill(null);
            } else {
              setShowCreateModal(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Fire Drills</h1>
          <p className="text-sm text-brand-600 mt-1">
            Record evacuation drills and emergency procedures testing
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Drill
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-brand-600" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-brand-700 mb-1">Site</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-brand-600">
              {filteredDrills.length} drill{filteredDrills.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Fire Drills List */}
      {filteredDrills.length === 0 ? (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <Siren className="w-12 h-12 text-brand-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-brand-900 mb-2">No fire drills yet</h3>
              <p className="text-sm text-brand-600 mb-4">
                Start recording evacuation drills and testing your emergency procedures
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Record First Drill
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDrills.map((drill) => {
            const isOverdue = drill.nextDrillDue && new Date(drill.nextDrillDue) < new Date();
            const headcountMatch = drill.expectedHeadcount && drill.actualHeadcount
              ? drill.expectedHeadcount === drill.actualHeadcount
              : null;

            return (
              <Card key={drill.id}>
                <Card.Content>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Siren className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-brand-900">
                            {getSiteName(drill.siteId)}
                          </span>
                          <span className="text-xs text-brand-600">
                            {formatUKDate(drill.date, 'dd/MM/yyyy')} at {drill.startTime}
                          </span>
                          <Badge variant={drill.allAccountedFor ? 'pass' : 'fail'}>
                            {drill.allAccountedFor ? 'All Accounted' : 'Missing Personnel'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-brand-600" />
                          <span className="font-medium text-brand-900">
                            {formatEvacuationTime(drill.evacuationTime)}
                          </span>
                          <span className="text-xs text-brand-600">evacuation</span>
                        </div>

                        {drill.assemblyPoint && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-brand-600" />
                            <span className="text-brand-700 truncate">{drill.assemblyPoint}</span>
                          </div>
                        )}

                        {drill.actualHeadcount !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-brand-600" />
                            <span className="text-brand-700">
                              {drill.actualHeadcount}
                              {drill.expectedHeadcount && ` / ${drill.expectedHeadcount}`}
                            </span>
                            {headcountMatch !== null && (
                              headcountMatch ? (
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              )
                            )}
                          </div>
                        )}

                        {drill.conductedBy && (
                          <div className="text-xs text-brand-600">
                            By: {drill.conductedBy}
                          </div>
                        )}
                      </div>

                      {drill.issues && (
                        <div className="mb-2 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                          <p className="text-xs font-medium text-red-900 mb-1">Issues:</p>
                          <p className="text-xs text-red-700">{drill.issues}</p>
                        </div>
                      )}

                      {drill.observations && (
                        <div className="mb-2 p-2 bg-brand-50 rounded">
                          <p className="text-xs font-medium text-brand-900 mb-1">Observations:</p>
                          <p className="text-xs text-brand-700">{drill.observations}</p>
                        </div>
                      )}

                      {drill.signature && (
                        <div className="mb-2 p-2 bg-white border border-brand-300 rounded">
                          <p className="text-xs font-medium text-brand-900 mb-2">Signature:</p>
                          <img
                            src={drill.signature}
                            alt="Drill signature"
                            className="h-16 border-b border-brand-300"
                          />
                        </div>
                      )}

                      {drill.latitude && drill.longitude && (
                        <div className="mb-2 p-2 bg-green-50 border border-green-300 rounded">
                          <p className="text-xs font-medium text-green-900 mb-1">GPS Location:</p>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-green-600" />
                            <a
                              href={`https://www.google.com/maps?q=${drill.latitude},${drill.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-700 hover:underline"
                            >
                              {drill.latitude.toFixed(6)}, {drill.longitude.toFixed(6)}
                            </a>
                            {drill.locationAccuracy && (
                              <span className="text-xs text-green-600">
                                (±{drill.locationAccuracy.toFixed(0)}m)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-brand-600">
                        <span>Alarm: {ALARM_TYPE_OPTIONS.find((a) => a.value === drill.alarmType)?.label}</span>
                        {drill.weatherConditions && <span>Weather: {drill.weatherConditions}</span>}
                        {drill.nextDrillDue && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            Next due: {formatUKDate(drill.nextDrillDue, 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(drill)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDrill(drill)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Drill Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="New Fire Drill"
        size="lg"
      >
        {renderDrillForm(handleCreateDrill, false)}
      </Modal>

      {/* Edit Drill Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDrill(null);
          resetForm();
        }}
        title="Edit Fire Drill"
        size="lg"
      >
        {renderDrillForm(handleEditDrill, true)}
      </Modal>
    </div>
  );
}
