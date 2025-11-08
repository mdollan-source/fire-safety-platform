'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckTask, Asset } from '@/types';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';
import { getAssetTypeDefinition } from '@/data/asset-types';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Package,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { isToday, isPast, startOfDay } from 'date-fns';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = params.id as string;

  const [task, setTask] = useState<CheckTask | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [fieldsExpanded, setFieldsExpanded] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);

      // Fetch task
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) {
        setError('Task not found');
        return;
      }

      const taskData = taskDoc.data() as CheckTask;
      setTask(taskData);

      // Fetch asset if assetId exists
      if (taskData.assetId) {
        const assetDoc = await getDoc(doc(db, 'assets', taskData.assetId));
        if (assetDoc.exists()) {
          setAsset(assetDoc.data() as Asset);
        }
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task || !user) return;

    try {
      setCompleting(true);

      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'completed',
        completedAt: new Date(),
        completedBy: user.uid,
        updatedAt: new Date(),
      });

      router.push('/dashboard/checks');
    } catch (err) {
      console.error('Error completing task:', err);
      alert('Failed to complete task');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading task...</div>
      </div>
    );
  }

  if (error || !task) {
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

  const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === task.templateId);
  const assetType = asset ? getAssetTypeDefinition(asset.type) : null;

  // Handle tasks with and without due dates
  let dueDate = null;
  let isDueToday = false;
  let isOverdue = false;

  if (task.dueAt) {
    dueDate = task.dueAt instanceof Date ? task.dueAt : (task.dueAt as any).toDate();
    isDueToday = isToday(dueDate);
    isOverdue = isPast(startOfDay(dueDate)) && !isDueToday;
  }

  const isCompleted = task.status === 'completed';

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
              {template?.name || task.templateId}
            </h1>
            <p className="text-sm text-brand-600 mt-1">{template?.description}</p>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={
                isCompleted
                  ? 'pass'
                  : isOverdue
                  ? 'fail'
                  : isDueToday
                  ? 'warning'
                  : 'pending'
              }
            >
              {isCompleted
                ? 'Completed'
                : isOverdue
                ? 'Overdue'
                : isDueToday
                ? 'Due Today'
                : 'Pending'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Information */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Task Details
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {dueDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Due Date</div>
                      <div className="font-medium text-brand-900">
                        {formatUKDate(dueDate, 'EEEE, dd MMMM yyyy')}
                      </div>
                    </div>
                  </div>
                )}

                {!dueDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Due Date</div>
                      <div className="font-medium text-brand-900">No due date set</div>
                    </div>
                  </div>
                )}

                {asset && (
                  <>
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-brand-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-brand-600">Asset</div>
                        <div className="font-medium text-brand-900">
                          {asset.name || assetType?.name}
                        </div>
                        <div className="text-sm text-brand-600">{assetType?.name}</div>
                      </div>
                    </div>

                    {asset.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-brand-500 mt-0.5" />
                        <div>
                          <div className="text-sm text-brand-600">Location</div>
                          <div className="font-medium text-brand-900">{asset.location}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-brand-500 mt-0.5" />
                  <div>
                    <div className="text-sm text-brand-600">Status</div>
                    <Badge variant={isOverdue ? 'fail' : isDueToday ? 'warning' : 'pending'}>
                      {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : task.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Check Template Information */}
          {template && (
            <Card>
              <Card.Header>Check Requirements</Card.Header>
              <Card.Content>
                <div className="space-y-4">
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

                  <div>
                    <div className="text-sm font-medium text-brand-900 mb-2">
                      Check Fields ({template.fields.length})
                    </div>
                    <div className="space-y-2">
                      {(fieldsExpanded ? template.fields : template.fields.slice(0, 5)).map((field) => (
                        <div key={field.id} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5" />
                          <div className="text-sm">
                            <span className="text-brand-900">{field.label}</span>
                            {field.required && (
                              <span className="text-red-600 ml-1">*</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {template.fields.length > 5 && (
                        <button
                          onClick={() => setFieldsExpanded(!fieldsExpanded)}
                          className="text-xs text-brand-600 hover:text-brand-700 underline"
                        >
                          {fieldsExpanded
                            ? 'Show less'
                            : `+ ${template.fields.length - 5} more fields`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <Card.Header>Actions</Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {!isCompleted ? (
                  <>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/checks/complete/${task.id}`)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Check
                    </Button>
                    <p className="text-xs text-brand-600">
                      Complete the full check form with evidence collection
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-brand-900">Task Completed</p>
                    {task.completedAt && (
                      <p className="text-xs text-brand-600 mt-1">
                        {formatUKDate(
                          task.completedAt instanceof Date
                            ? task.completedAt
                            : (task.completedAt as any).toDate(),
                          'dd/MM/yyyy HH:mm'
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Additional Info */}
          <Card>
            <Card.Header>Additional Info</Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-brand-600">Frequency</div>
                  <div className="text-brand-900 font-medium capitalize">
                    {task.scheduleId ? 'Recurring' : 'One-time'}
                  </div>
                </div>
                <div>
                  <div className="text-brand-600">Evidence Required</div>
                  <div className="text-brand-900 font-medium">
                    {template?.requiresEvidence ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="text-brand-600">GPS Required</div>
                  <div className="text-brand-900 font-medium">
                    {template?.requiresGPS ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="text-brand-600">Signature Required</div>
                  <div className="text-brand-900 font-medium">
                    {template?.requiresSignature ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
