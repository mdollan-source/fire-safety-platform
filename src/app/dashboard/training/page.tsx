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
import { GraduationCap, Plus, Edit2, Trash2, Users, Calendar, Clock, Filter } from 'lucide-react';
import { TrainingRecord, Site, User } from '@/types';
import { formatUKDate } from '@/lib/utils/date';

const TRAINING_TYPE_OPTIONS = [
  { value: 'induction', label: 'Induction', color: 'bg-blue-100 text-blue-800' },
  { value: 'refresher', label: 'Refresher Training', color: 'bg-green-100 text-green-800' },
  { value: 'specialist', label: 'Specialist Training', color: 'bg-purple-100 text-purple-800' },
];

export default function TrainingPage() {
  const { userData } = useAuth();
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null);

  // Filters
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'induction' as TrainingRecord['type'],
    syllabus: '',
    assessor: '',
    attendees: '',
    duration: '',
    outcomes: '',
    nextDue: '',
  });

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    await Promise.all([fetchTrainingRecords(), fetchSites()]);
  };

  const fetchTrainingRecords = async () => {
    try {
      setLoading(true);
      const recordsQuery = query(
        collection(db, 'training_records'),
        where('orgId', '==', userData!.orgId)
      );
      const recordsSnapshot = await getDocs(recordsQuery);
      const recordsData = recordsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        nextDue: doc.data().nextDue?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as TrainingRecord[];

      // Sort by date descending
      recordsData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTrainingRecords(recordsData);
    } catch (err) {
      console.error('Error fetching training records:', err);
      setError('Failed to load training records');
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

  const fetchUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', userData!.orgId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      siteId: sites.length > 0 ? sites[0].id : '',
      date: new Date().toISOString().split('T')[0],
      type: 'induction',
      syllabus: '',
      assessor: '',
      attendees: '',
      duration: '',
      outcomes: '',
      nextDue: '',
    });
    setError('');
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setError('');

      if (!formData.siteId || !formData.syllabus.trim() || !formData.assessor.trim()) {
        setError('Site, syllabus, and assessor are required');
        return;
      }

      const recordData: any = {
        orgId: userData.orgId,
        siteId: formData.siteId,
        date: new Date(formData.date),
        type: formData.type,
        syllabus: formData.syllabus.trim(),
        assessor: formData.assessor.trim(),
        attendees: formData.attendees.trim(),
        evidenceIds: [],
        createdBy: userData.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they have values
      if (formData.duration) {
        recordData.duration = parseInt(formData.duration);
      }
      if (formData.outcomes.trim()) {
        recordData.outcomes = formData.outcomes.trim();
      }
      if (formData.nextDue) {
        recordData.nextDue = new Date(formData.nextDue);
      }

      await addDoc(collection(db, 'training_records'), recordData);

      await fetchTrainingRecords();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating training record:', err);
      setError(err.message || 'Failed to create training record');
    }
  };

  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !editingRecord) return;

    try {
      setError('');

      if (!formData.siteId || !formData.syllabus.trim() || !formData.assessor.trim()) {
        setError('Site, syllabus, and assessor are required');
        return;
      }

      const updateData: any = {
        siteId: formData.siteId,
        date: new Date(formData.date),
        type: formData.type,
        syllabus: formData.syllabus.trim(),
        assessor: formData.assessor.trim(),
        attendees: formData.attendees.trim(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they have values
      if (formData.duration) {
        updateData.duration = parseInt(formData.duration);
      }
      if (formData.outcomes.trim()) {
        updateData.outcomes = formData.outcomes.trim();
      }
      if (formData.nextDue) {
        updateData.nextDue = new Date(formData.nextDue);
      }

      await updateDoc(doc(db, 'training_records', editingRecord.id), updateData);

      await fetchTrainingRecords();
      setShowEditModal(false);
      setEditingRecord(null);
      resetForm();
    } catch (err: any) {
      console.error('Error updating training record:', err);
      setError(err.message || 'Failed to update training record');
    }
  };

  const handleDeleteRecord = async (record: TrainingRecord) => {
    if (!confirm(`Are you sure you want to delete this training record?`)) return;

    try {
      await deleteDoc(doc(db, 'training_records', record.id));
      await fetchTrainingRecords();
    } catch (err) {
      console.error('Error deleting training record:', err);
      alert('Failed to delete training record');
    }
  };

  const openEditModal = (record: TrainingRecord) => {
    setEditingRecord(record);
    setFormData({
      siteId: record.siteId,
      date: formatUKDate(record.date, 'yyyy-MM-dd'),
      type: record.type,
      syllabus: record.syllabus,
      assessor: record.assessor,
      attendees: record.attendees || '',
      duration: record.duration?.toString() || '',
      outcomes: record.outcomes || '',
      nextDue: record.nextDue ? formatUKDate(record.nextDue, 'yyyy-MM-dd') : '',
    });
    setShowEditModal(true);
  };

  const getSiteName = (siteId: string) => {
    return sites.find((s) => s.id === siteId)?.name || 'Unknown Site';
  };

  const getTypeConfig = (type: string) => {
    return TRAINING_TYPE_OPTIONS.find((t) => t.value === type) || TRAINING_TYPE_OPTIONS[0];
  };

  const filteredRecords = trainingRecords.filter((record) => {
    if (selectedSite !== 'all' && record.siteId !== selectedSite) return false;
    if (selectedType !== 'all' && record.type !== selectedType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading training records...</div>
      </div>
    );
  }

  const renderTrainingForm = (onSubmit: (e: React.FormEvent) => void, isEdit: boolean) => (
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

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Training Type *</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TrainingRecord['type'] })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          required
        >
          {TRAINING_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">
          Syllabus / Content Covered *
        </label>
        <textarea
          value={formData.syllabus}
          onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          placeholder="Key topics covered during the training session"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">
          Trainer / Assessor Name *
        </label>
        <input
          type="text"
          value={formData.assessor}
          onChange={(e) => setFormData({ ...formData, assessor: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Name of the person who conducted the training"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            min="5"
            placeholder="e.g., 30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">
            Next Training Due
          </label>
          <input
            type="date"
            value={formData.nextDue}
            onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Attendees</label>
        <textarea
          value={formData.attendees}
          onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          placeholder="e.g., John Smith, Jane Doe, Bob Johnson"
        />
        <p className="text-xs text-brand-600 mt-1">
          Enter names of attendees, separated by commas
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">
          Outcomes / Notes
        </label>
        <textarea
          value={formData.outcomes}
          onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          placeholder="Any issues noted, lessons learned, improvements needed"
        />
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
              setEditingRecord(null);
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
          <h1 className="text-2xl font-bold text-brand-900">Training Records</h1>
          <p className="text-sm text-brand-600 mt-1">
            Log fire safety training, drills, and staff competency
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Record
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-brand-600" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-1">Site</label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Sites</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-700 mb-1">
                  Training Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  {TRAINING_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-sm text-brand-600">
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Training Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <GraduationCap className="w-12 h-12 text-brand-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-brand-900 mb-2">No training records yet</h3>
              <p className="text-sm text-brand-600 mb-4">
                Start logging fire safety training sessions and drills
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Record
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const typeConfig = getTypeConfig(record.type);
            const isOverdue = record.nextDue && new Date(record.nextDue) < new Date();

            return (
              <Card key={record.id}>
                <Card.Content>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <GraduationCap className="w-5 h-5 text-brand-600 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                          <span className="text-sm font-medium text-brand-900">
                            {getSiteName(record.siteId)}
                          </span>
                          <span className="text-xs text-brand-600">
                            {formatUKDate(record.date, 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-brand-700 mb-3">{record.syllabus}</p>

                      <div className="flex items-center gap-4 text-xs text-brand-600 mb-2">
                        {record.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {record.duration} mins
                          </span>
                        )}
                        <span>Trainer: {record.assessor}</span>
                        {record.nextDue && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            Next due: {formatUKDate(record.nextDue, 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>

                      {record.attendees && (
                        <div className="text-xs text-brand-600 mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="w-3 h-3" />
                            <span className="font-medium">Attendees:</span>
                          </div>
                          <div className="pl-4">
                            {record.attendees}
                          </div>
                        </div>
                      )}

                      {record.outcomes && (
                        <p className="text-xs text-brand-600 mt-2 p-2 bg-brand-50 rounded">
                          {record.outcomes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(record)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecord(record)}
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

      {/* Create Record Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="New Training Record"
        size="lg"
      >
        {renderTrainingForm(handleCreateRecord, false)}
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
          resetForm();
        }}
        title="Edit Training Record"
        size="lg"
      >
        {renderTrainingForm(handleEditRecord, true)}
      </Modal>
    </div>
  );
}
