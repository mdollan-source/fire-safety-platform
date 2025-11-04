'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import { CheckSchedule, Asset, Site, CheckTask } from '@/types';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';
import { getAssetTypeDefinition } from '@/data/asset-types';
import { ArrowLeft, Save, Trash2, Calendar, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';

// Frequency options with RRULE patterns
const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly', rrule: 'FREQ=WEEKLY;BYDAY=MO' },
  { value: 'monthly', label: 'Monthly', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1' },
  { value: 'quarterly', label: 'Quarterly', rrule: 'FREQ=MONTHLY;INTERVAL=3' },
  { value: 'annual', label: 'Annual', rrule: 'FREQ=YEARLY' },
  { value: 'daily', label: 'Daily', rrule: 'FREQ=DAILY' },
];

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const scheduleId = params.id as string;

  const [schedule, setSchedule] = useState<CheckSchedule | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [relatedTasks, setRelatedTasks] = useState<CheckTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  // Form state
  const [frequency, setFrequency] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (userData?.orgId) {
      fetchScheduleDetails();
    }
  }, [scheduleId, userData]);

  const fetchScheduleDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching schedule:', scheduleId);
      console.log('User data:', userData);
      console.log('User orgId:', userData?.orgId);

      if (!userData?.orgId) {
        setError('User organization not loaded. Please refresh the page.');
        return;
      }

      // Fetch schedule
      const scheduleDoc = await getDoc(doc(db, 'check_schedules', scheduleId));
      console.log('Schedule doc exists:', scheduleDoc.exists());

      if (!scheduleDoc.exists()) {
        setError('Schedule not found');
        return;
      }

      const scheduleData = scheduleDoc.data() as CheckSchedule;
      console.log('Schedule data:', scheduleData);
      setSchedule(scheduleData);
      setFrequency((scheduleData as any).frequency || 'weekly');
      setActive(scheduleData.active);

      if (scheduleData.startDate) {
        const date = scheduleData.startDate instanceof Date
          ? scheduleData.startDate
          : (scheduleData.startDate as any).toDate();
        setStartDate(date.toISOString().split('T')[0]);
      }

      // Fetch asset
      const assetId = (scheduleData as any).assetId || (scheduleData.assetIds && scheduleData.assetIds[0]);
      console.log('Asset ID:', assetId);

      if (assetId) {
        console.log('Fetching asset...');
        const assetDoc = await getDoc(doc(db, 'assets', assetId));
        console.log('Asset doc exists:', assetDoc.exists());

        if (assetDoc.exists()) {
          setAsset(assetDoc.data() as Asset);

          // Fetch site
          const assetData = assetDoc.data() as Asset;
          console.log('Asset siteId:', assetData.siteId);

          if (assetData.siteId) {
            console.log('Fetching site...');
            const siteDoc = await getDoc(doc(db, 'sites', assetData.siteId));
            console.log('Site doc exists:', siteDoc.exists());

            if (siteDoc.exists()) {
              setSite(siteDoc.data() as Site);
            }
          }
        }
      }

      // Fetch related tasks
      console.log('Fetching tasks for schedule:', scheduleId);
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('scheduleId', '==', scheduleId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      console.log('Tasks found:', tasksSnapshot.docs.length);
      const tasksData = tasksSnapshot.docs.map((doc) => doc.data() as CheckTask);
      setRelatedTasks(tasksData);
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError(`Failed to load schedule details: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!schedule) return;

    try {
      setSaving(true);
      setError('');

      // Get RRULE for frequency
      const frequencyOption = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
      const rrule = frequencyOption?.rrule || 'FREQ=WEEKLY;BYDAY=MO';

      await updateDoc(doc(db, 'check_schedules', scheduleId), {
        frequency: frequency,
        rrule: rrule,
        startDate: new Date(startDate),
        active: active,
        updatedAt: new Date(),
      });

      setEditing(false);
      await fetchScheduleDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this schedule? This will not delete tasks already created.')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'check_schedules', scheduleId));
      router.push('/dashboard/checks');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete schedule');
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!schedule) return;

    try {
      const newActiveStatus = !schedule.active;
      await updateDoc(doc(db, 'check_schedules', scheduleId), {
        active: newActiveStatus,
        updatedAt: new Date(),
      });
      await fetchScheduleDetails();
    } catch (err) {
      console.error('Error toggling active status:', err);
      alert('Failed to update schedule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading schedule...</div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">{error}</h3>
              <Button variant="primary" onClick={() => router.push('/dashboard/checks')}>
                Back to Checks
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === schedule.templateId);
  const assetType = asset ? getAssetTypeDefinition(asset.type) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">
              {template?.name || schedule.templateId}
            </h1>
            <p className="text-sm text-brand-600 mt-1">Scheduled Check Details</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={schedule.active ? 'pass' : 'pending'}>
              {schedule.active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Information */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Details
                </div>
                {!editing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  {error && <FormError message={error} />}

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-brand-900 mb-2">
                      Frequency <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      required
                      disabled={saving}
                      className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    disabled={saving}
                  />

                  {/* Active Status */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      disabled={saving}
                      className="w-4 h-4 text-brand-900 border-brand-300 focus:ring-brand-500"
                    />
                    <label htmlFor="active" className="text-sm text-brand-900">
                      Schedule is active
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditing(false);
                        setError('');
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {asset && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-brand-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-brand-600">Asset</div>
                        <div className="font-medium text-brand-900">
                          {asset.name || assetType?.name}
                        </div>
                        <div className="text-sm text-brand-600">{assetType?.name}</div>
                        {asset.location && (
                          <div className="text-sm text-brand-600">{asset.location}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {site && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-brand-600">Site</div>
                        <div className="font-medium text-brand-900">{site.name}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Frequency</div>
                      <div className="font-medium text-brand-900 capitalize">{(schedule as any).frequency}</div>
                    </div>
                  </div>

                  {schedule.startDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-brand-600">Start Date</div>
                        <div className="font-medium text-brand-900">
                          {formatUKDate(
                            schedule.startDate instanceof Date
                              ? schedule.startDate
                              : (schedule.startDate as any).toDate(),
                            'dd/MM/yyyy'
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Status</div>
                      <Badge variant={schedule.active ? 'pass' : 'pending'}>
                        {schedule.active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Check Template Information */}
          {template && (
            <Card>
              <Card.Header>Check Template</Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-brand-900 mb-2">Template Name</div>
                    <p className="text-sm text-brand-700">{template.name}</p>
                  </div>

                  {template.description && (
                    <div>
                      <div className="text-sm font-medium text-brand-900 mb-2">Description</div>
                      <p className="text-sm text-brand-700">{template.description}</p>
                    </div>
                  )}

                  {template.guidance && (
                    <div>
                      <div className="text-sm font-medium text-brand-900 mb-2">Guidance</div>
                      <p className="text-sm text-brand-700">{template.guidance}</p>
                    </div>
                  )}

                  {template.references && template.references.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-brand-900 mb-2">
                        Compliance Standards
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {template.references.map((ref) => (
                          <Badge key={ref} variant="pending">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Related Tasks */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>Tasks Generated from this Schedule</div>
                <span className="text-sm text-brand-600">{relatedTasks.length} total</span>
              </div>
            </Card.Header>
            <Card.Content>
              {relatedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-brand-600">
                    No tasks have been generated yet. Click "Generate Tasks" on the checks page.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {relatedTasks.slice(0, 10).map((task) => {
                    const dueDate = task.dueAt
                      ? task.dueAt instanceof Date
                        ? task.dueAt
                        : (task.dueAt as any).toDate()
                      : null;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/checks/tasks/${task.id}`)}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-brand-900">
                            {dueDate ? formatUKDate(dueDate, 'dd/MM/yyyy') : 'No due date'}
                          </div>
                        </div>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'pass'
                              : task.status === 'overdue'
                              ? 'fail'
                              : 'pending'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    );
                  })}
                  {relatedTasks.length > 10 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-brand-600">
                        Showing 10 of {relatedTasks.length} tasks
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <Card.Header>Statistics</Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-brand-900">{relatedTasks.length}</div>
                  <div className="text-sm text-brand-600">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">
                    {relatedTasks.filter((t) => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-brand-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">
                    {relatedTasks.filter((t) => t.status === 'pending').length}
                  </div>
                  <div className="text-sm text-brand-600">Pending</div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Actions */}
          <Card>
            <Card.Header>Actions</Card.Header>
            <Card.Content>
              <div className="space-y-2">
                <Button
                  variant={schedule.active ? 'secondary' : 'primary'}
                  className="w-full"
                  onClick={handleToggleActive}
                >
                  {schedule.active ? 'Pause Schedule' : 'Activate Schedule'}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setEditing(true)}
                  disabled={editing}
                >
                  Edit Schedule
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Schedule
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
