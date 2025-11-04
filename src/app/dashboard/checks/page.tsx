'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckSchedule, Asset, CheckTask } from '@/types';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';
import { generateTasksForSchedule } from '@/lib/utils/task-generator';
import { ClipboardCheck, Plus, Calendar, AlertCircle, CheckCircle2, Clock, Zap, User, UserCheck } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { isToday, isPast, startOfDay, differenceInHours } from 'date-fns';

export default function ChecksPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [schedules, setSchedules] = useState<CheckSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<CheckTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch assets
      const assetsQuery = query(
        collection(db, 'assets'),
        where('orgId', '==', userData!.orgId)
      );
      const assetsSnapshot = await getDocs(assetsQuery);
      const assetsData = assetsSnapshot.docs.map((doc) => doc.data() as Asset);
      setAssets(assetsData);

      // Fetch schedules
      const schedulesQuery = query(
        collection(db, 'check_schedules'),
        where('orgId', '==', userData!.orgId)
      );
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedulesData = schedulesSnapshot.docs.map((doc) => doc.data() as CheckSchedule);
      setSchedules(schedulesData);

      // Fetch tasks
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('orgId', '==', userData!.orgId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map((doc) => doc.data() as CheckTask);

      // Auto-release expired claims
      const releasePromises = tasksData
        .filter((task) => {
          if (!task.claimedAt || task.status !== 'pending') return false;
          const claimedDate = task.claimedAt instanceof Date ? task.claimedAt : (task.claimedAt as any).toDate();
          return differenceInHours(new Date(), claimedDate) >= 4;
        })
        .map((task) =>
          updateDoc(doc(db, 'tasks', task.id), {
            claimedBy: null,
            claimedByName: null,
            claimedAt: null,
            updatedAt: new Date(),
          })
        );

      if (releasePromises.length > 0) {
        await Promise.all(releasePromises);
        // Refresh task data after releasing
        const refreshedSnapshot = await getDocs(tasksQuery);
        const refreshedTasks = refreshedSnapshot.docs.map((doc) => doc.data() as CheckTask);
        setTasks(refreshedTasks);
      } else {
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTasks = async () => {
    try {
      setGenerating(true);
      let createdCount = 0;

      // Generate tasks for each schedule
      for (const schedule of schedules) {
        const newTasks = generateTasksForSchedule(schedule, tasks, 30); // Next 30 days

        // Create each task in Firestore
        for (const taskData of newTasks) {
          const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await setDoc(doc(db, 'tasks', taskId), {
            ...taskData,
            id: taskId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          createdCount++;
        }
      }

      // Refresh tasks
      await fetchData();

      alert(`Generated ${createdCount} new tasks`);
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('Failed to generate tasks');
    } finally {
      setGenerating(false);
    }
  };

  const handleClaimTask = async (taskId: string) => {
    if (!userData) return;

    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        claimedBy: userData.id,
        claimedByName: userData.name,
        claimedAt: new Date(),
        updatedAt: new Date(),
      });

      // Refresh tasks
      await fetchData();
    } catch (error) {
      console.error('Error claiming task:', error);
      alert('Failed to claim task');
    }
  };

  const handleReleaseTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        claimedBy: null,
        claimedByName: null,
        claimedAt: null,
        updatedAt: new Date(),
      });

      // Refresh tasks
      await fetchData();
    } catch (error) {
      console.error('Error releasing task:', error);
      alert('Failed to release task');
    }
  };

  const isTaskClaimExpired = (task: CheckTask): boolean => {
    if (!task.claimedAt) return false;
    const claimedDate = task.claimedAt instanceof Date ? task.claimedAt : (task.claimedAt as any).toDate();
    return differenceInHours(new Date(), claimedDate) >= 4;
  };

  const getAssetName = (assetId: string | undefined) => {
    if (!assetId) return 'N/A';
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getTemplateName = (templateId: string) => {
    const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === templateId);
    return template?.name || templateId;
  };

  const getDueTodayTasks = () => {
    return tasks.filter((task) => {
      if (task.status !== 'pending') return false;
      if (!task.dueAt) return false;
      const dueDate = task.dueAt instanceof Date ? task.dueAt : (task.dueAt as any).toDate();
      return isToday(dueDate);
    });
  };

  const getOverdueTasks = () => {
    return tasks.filter((task) => {
      if (task.status !== 'pending') return false;
      if (!task.dueAt) return false;
      const dueDate = task.dueAt instanceof Date ? task.dueAt : (task.dueAt as any).toDate();
      return isPast(startOfDay(dueDate)) && !isToday(dueDate);
    });
  };

  const getCompletedTasks = () => {
    return tasks.filter((task) => task.status === 'completed');
  };

  const getPendingTasks = () => {
    return tasks.filter((task) => task.status === 'pending');
  };

  const getClaimedByMeTasks = () => {
    return tasks.filter((task) => {
      if (task.status !== 'pending') return false;
      if (task.claimedBy !== userData?.id) return false;
      if (isTaskClaimExpired(task)) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading checks...</div>
      </div>
    );
  }

  const dueTodayTasks = getDueTodayTasks();
  const overdueTasks = getOverdueTasks();
  const completedTasks = getCompletedTasks();
  const pendingTasks = getPendingTasks();
  const claimedByMeTasks = getClaimedByMeTasks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Checks</h1>
          <p className="text-sm text-brand-600 mt-1">
            Schedule and complete fire safety checks
          </p>
        </div>
        <div className="flex gap-2">
          {schedules.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleGenerateTasks}
              isLoading={generating}
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Tasks
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard/checks/schedule')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Check
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{schedules.length}</div>
                <div className="text-sm text-brand-600">Scheduled</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{dueTodayTasks.length}</div>
                <div className="text-sm text-brand-600">Due Today</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{overdueTasks.length}</div>
                <div className="text-sm text-brand-600">Overdue</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{claimedByMeTasks.length}</div>
                <div className="text-sm text-brand-600">Claimed by You</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{completedTasks.length}</div>
                <div className="text-sm text-brand-600">Completed</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Scheduled Checks */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduled Checks
            </div>
            {schedules.length > 0 && (
              <span className="text-sm text-brand-600">{schedules.length} active</span>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Scheduled Checks
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                Create recurring check schedules for your assets to ensure compliance.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard/checks/schedule')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule First Check
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                  onClick={() => {
                    // For now, allow user to toggle active status
                    // TODO: Create dedicated schedule edit page
                    const newActiveStatus = !schedule.active;
                    updateDoc(doc(db, 'check_schedules', schedule.id), {
                      active: newActiveStatus,
                      updatedAt: new Date(),
                    }).then(() => fetchData());
                  }}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-brand-900 mb-1">
                      {getTemplateName(schedule.templateId)}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-brand-600">
                      <span>{schedule.assetIds && schedule.assetIds.length > 0 ? (schedule.assetIds.length === 1 ? getAssetName(schedule.assetIds[0]) : `${schedule.assetIds.length} assets`) : 'All assets'}</span>
                      <span>•</span>
                      <span className="text-xs italic">Click to {schedule.active ? 'pause' : 'activate'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={schedule.active ? 'pass' : 'pending'}>
                      {schedule.active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Due Checks */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Due Checks
            </div>
            {pendingTasks.length > 0 && (
              <span className="text-sm text-brand-600">{pendingTasks.length} pending</span>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Pending Tasks
              </h3>
              <p className="text-sm text-brand-600">
                {schedules.length > 0
                  ? 'Click "Generate Tasks" to create tasks from your schedules.'
                  : 'Create schedules first, then generate tasks.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.slice(0, 10).map((task) => {
                // Skip tasks without due dates
                if (!task.dueAt) return null;
                const dueDate = task.dueAt instanceof Date ? task.dueAt : (task.dueAt as any).toDate();
                const isDueToday = isToday(dueDate);
                const isOverdue = isPast(startOfDay(dueDate)) && !isDueToday;
                const isClaimExpired = isTaskClaimExpired(task);
                const isClaimedByMe = task.claimedBy === userData?.id;
                const isClaimedByOther = task.claimedBy && !isClaimedByMe && !isClaimExpired;

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-brand-200 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => router.push(`/dashboard/checks/tasks/${task.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-brand-900">
                          {getTemplateName(task.templateId)}
                        </h4>
                        {/* Only show badge when someone else is working on it */}
                        {isClaimedByOther && (
                          <Badge variant="warning">
                            <User className="w-3 h-3 mr-1" />
                            In Progress - {task.claimedByName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-brand-600">
                        <span>{getAssetName(task.assetId)}</span>
                        <span>•</span>
                        <span>Due: {formatUKDate(dueDate, 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={isOverdue ? 'fail' : isDueToday ? 'warning' : 'pending'}
                      >
                        {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : 'Pending'}
                      </Badge>

                      {/* Show Complete button unless someone else is actively working on it */}
                      {isClaimedByOther ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                        >
                          In Progress
                        </Button>
                      ) : (
                        <>
                          {isClaimedByMe && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReleaseTask(task.id);
                              }}
                              className="text-xs"
                            >
                              Release
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => router.push(`/dashboard/checks/complete/${task.id}`)}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {pendingTasks.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-brand-600">
                    Showing 10 of {pendingTasks.length} tasks
                  </p>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Completed Checks */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Recent Completions
            </div>
            {completedTasks.length > 0 && (
              <span className="text-sm text-brand-600">{completedTasks.length} completed</span>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {completedTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Completed Checks Yet
              </h3>
              <p className="text-sm text-brand-600">
                Completed checks will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTasks.slice(0, 5).map((task) => {
                const completedDate = task.completedAt instanceof Date
                  ? task.completedAt
                  : (task.completedAt as any)?.toDate();

                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border border-brand-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-brand-900 mb-1">
                        {getTemplateName(task.templateId)}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-brand-600">
                        <span>{getAssetName(task.assetId)}</span>
                        <span>•</span>
                        {completedDate && (
                          <span>Completed: {formatUKDate(completedDate, 'dd/MM/yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="pass">Completed</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
