'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import { UserX, AlertTriangle, CheckCircle2, Users, Calendar, ClipboardList } from 'lucide-react';

interface UserOffboardingModalProps {
  userId: string;
  userName: string;
  userOrgId: string;
  onClose: () => void;
  onComplete: () => void;
}

interface TaskSummary {
  id: string;
  templateId: string;
  assetId?: string;
  dueAt?: Date;
  status: string;
  claimedBy?: string;
}

interface ScheduleSummary {
  id: string;
  templateId: string;
  assignees: string[];
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UserOffboardingModal({
  userId,
  userName,
  userOrgId,
  onClose,
  onComplete,
}: UserOffboardingModalProps) {
  const [step, setStep] = useState<'loading' | 'review' | 'confirming' | 'complete'>('loading');
  const [pendingTasks, setPendingTasks] = useState<TaskSummary[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<TaskSummary[]>([]);
  const [userSchedules, setUserSchedules] = useState<ScheduleSummary[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [selectedReplacementUser, setSelectedReplacementUser] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOffboardingData();
  }, [userId, userOrgId]);

  const loadOffboardingData = async () => {
    try {
      setStep('loading');
      setError('');

      // Fetch pending tasks
      const pendingTasksQuery = query(
        collection(db, 'tasks'),
        where('orgId', '==', userOrgId),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingTasksQuery);
      const allPendingTasks = pendingSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          templateId: data.templateId,
          assetId: data.assetId,
          dueAt: data.dueAt?.toDate(),
          status: data.status,
          claimedBy: data.claimedBy,
        } as TaskSummary;
      });

      // Filter tasks claimed by or assigned to this user
      const userPendingTasks = allPendingTasks.filter(
        (task) => !task.claimedBy || task.claimedBy === userId
      );
      const userClaimedTasks = allPendingTasks.filter(
        (task) => task.claimedBy === userId
      );

      setPendingTasks(userPendingTasks);
      setClaimedTasks(userClaimedTasks);

      // Fetch schedules where user is an assignee
      const schedulesQuery = query(
        collection(db, 'check_schedules'),
        where('orgId', '==', userOrgId)
      );
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedules = schedulesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            templateId: data.templateId,
            assignees: data.assignees || [],
          } as ScheduleSummary;
        })
        .filter((schedule) => schedule.assignees.includes(userId));

      setUserSchedules(schedules);

      // Fetch available replacement users (active users in same org)
      const usersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', userOrgId),
        where('status', '==', 'active')
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs
        .filter((doc) => doc.id !== userId) // Exclude the user being offboarded
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            role: data.role,
          } as UserOption;
        });

      setAvailableUsers(users);
      setStep('review');
    } catch (err: any) {
      console.error('Error loading offboarding data:', err);
      setError(err.message || 'Failed to load user data');
    }
  };

  const handleOffboard = async () => {
    if (!selectedReplacementUser && (pendingTasks.length > 0 || userSchedules.length > 0)) {
      setError('Please select a user to reassign tasks and schedules to');
      return;
    }

    setProcessing(true);
    setStep('confirming');
    setError('');

    try {
      const batch = writeBatch(db);

      // Release all claimed tasks
      claimedTasks.forEach((task) => {
        const taskRef = doc(db, 'tasks', task.id);
        batch.update(taskRef, {
          claimedBy: null,
          claimedByName: null,
          claimedAt: null,
          updatedAt: new Date(),
        });
      });

      // Reassign pending tasks if replacement user selected
      if (selectedReplacementUser && pendingTasks.length > 0) {
        const replacementUser = availableUsers.find((u) => u.id === selectedReplacementUser);

        pendingTasks.forEach((task) => {
          const taskRef = doc(db, 'tasks', task.id);
          // Only update if this task was specifically claimed by the user being offboarded
          if (task.claimedBy === userId) {
            batch.update(taskRef, {
              claimedBy: selectedReplacementUser,
              claimedByName: replacementUser?.name,
              claimedAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      }

      // Update schedules - remove user from assignees, optionally add replacement
      if (userSchedules.length > 0) {
        userSchedules.forEach((schedule) => {
          const scheduleRef = doc(db, 'check_schedules', schedule.id);
          let newAssignees = schedule.assignees.filter((id) => id !== userId);

          // Add replacement user if selected and not already in assignees
          if (selectedReplacementUser && !newAssignees.includes(selectedReplacementUser)) {
            newAssignees.push(selectedReplacementUser);
          }

          batch.update(scheduleRef, {
            assignees: newAssignees,
            updatedAt: new Date(),
          });
        });
      }

      // Deactivate the user
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        status: 'inactive',
        updatedAt: new Date(),
        deactivatedAt: new Date(),
      });

      await batch.commit();

      setStep('complete');
    } catch (err: any) {
      console.error('Error offboarding user:', err);
      setError(err.message || 'Failed to offboard user');
      setProcessing(false);
      setStep('review');
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <UserX className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-brand-900">Offboard User</h2>
              <p className="text-sm text-brand-600">{userName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4">
              <FormError message={error} />
            </div>
          )}

          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="text-brand-600">Loading user data...</div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important: User Offboarding</p>
                  <p>
                    This will deactivate the user's account. Review and reassign their tasks
                    and schedule assignments before proceeding.
                  </p>
                </div>
              </div>

              {/* Claimed Tasks */}
              {claimedTasks.length > 0 && (
                <div className="border border-brand-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-brand-600" />
                    <h3 className="font-semibold text-brand-900">
                      Claimed Tasks ({claimedTasks.length})
                    </h3>
                  </div>
                  <p className="text-sm text-brand-600 mb-3">
                    These tasks are currently being worked on by this user. They will be released
                    automatically.
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {claimedTasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="text-sm bg-brand-50 p-2 rounded border border-brand-200"
                      >
                        {task.templateId}
                      </div>
                    ))}
                    {claimedTasks.length > 5 && (
                      <p className="text-xs text-brand-600">
                        + {claimedTasks.length - 5} more tasks
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="border border-brand-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-5 h-5 text-brand-600" />
                    <h3 className="font-semibold text-brand-900">
                      Pending Tasks ({pendingTasks.length})
                    </h3>
                  </div>
                  <p className="text-sm text-brand-600 mb-3">
                    These tasks are available to be reassigned to another user.
                  </p>
                </div>
              )}

              {/* Schedules */}
              {userSchedules.length > 0 && (
                <div className="border border-brand-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-brand-600" />
                    <h3 className="font-semibold text-brand-900">
                      Schedule Assignments ({userSchedules.length})
                    </h3>
                  </div>
                  <p className="text-sm text-brand-600 mb-3">
                    This user is assigned to receive tasks from these schedules. A replacement
                    user can be added to these schedules.
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="text-sm bg-brand-50 p-2 rounded border border-brand-200"
                      >
                        {schedule.templateId}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Impact */}
              {claimedTasks.length === 0 &&
                pendingTasks.length === 0 &&
                userSchedules.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">No Active Assignments</p>
                      <p>
                        This user has no pending tasks or schedule assignments. Safe to deactivate.
                      </p>
                    </div>
                  </div>
                )}

              {/* Replacement User Selection */}
              {(pendingTasks.length > 0 || userSchedules.length > 0) && (
                <div className="border border-brand-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-brand-600" />
                    <h3 className="font-semibold text-brand-900">Replacement User</h3>
                  </div>
                  <p className="text-sm text-brand-600 mb-3">
                    Select a user to take over tasks and schedule assignments
                  </p>
                  <select
                    value={selectedReplacementUser}
                    onChange={(e) => setSelectedReplacementUser(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 'confirming' && (
            <div className="text-center py-12">
              <div className="text-brand-600">Processing offboarding...</div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">User Offboarded</h3>
              <p className="text-sm text-brand-600 mb-4">
                {userName} has been successfully deactivated.
              </p>
              <div className="space-y-2 text-sm text-brand-700">
                {claimedTasks.length > 0 && (
                  <p>• {claimedTasks.length} claimed task(s) released</p>
                )}
                {selectedReplacementUser && pendingTasks.length > 0 && (
                  <p>• {pendingTasks.length} pending task(s) reassigned</p>
                )}
                {selectedReplacementUser && userSchedules.length > 0 && (
                  <p>• {userSchedules.length} schedule(s) updated</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-brand-50 border-t border-brand-200 px-6 py-4">
          <div className="flex gap-3 justify-end">
            {step === 'review' && (
              <>
                <Button variant="secondary" onClick={onClose} disabled={processing}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleOffboard}
                  disabled={processing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Deactivate User
                </Button>
              </>
            )}
            {step === 'complete' && (
              <Button variant="primary" onClick={handleComplete}>
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
