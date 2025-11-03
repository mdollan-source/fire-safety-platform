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
import { FileText, Plus, Edit2, Copy, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { CheckTemplate, CheckField, AssetType } from '@/types';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';

const ASSET_TYPE_OPTIONS: { value: AssetType | 'none'; label: string }[] = [
  { value: 'none', label: 'All asset types' },
  { value: 'fire_alarm', label: 'Fire Alarm' },
  { value: 'emergency_lighting', label: 'Emergency Lighting' },
  { value: 'fire_door', label: 'Fire Door' },
  { value: 'extinguisher', label: 'Fire Extinguisher' },
  { value: 'hose_reel', label: 'Hose Reel' },
  { value: 'sprinkler_system', label: 'Sprinkler System' },
  { value: 'dry_riser', label: 'Dry Riser' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', rrule: 'FREQ=DAILY' },
  { value: 'weekly', label: 'Weekly', rrule: 'FREQ=WEEKLY;BYDAY=MO' },
  { value: 'monthly', label: 'Monthly', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1' },
  { value: 'quarterly', label: 'Quarterly', rrule: 'FREQ=MONTHLY;INTERVAL=3' },
  { value: 'annual', label: 'Annual', rrule: 'FREQ=YEARLY' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'enum', label: 'Multiple Choice' },
  { value: 'date', label: 'Date' },
];

export default function TemplatesPage() {
  const { userData } = useAuth();
  const [customTemplates, setCustomTemplates] = useState<CheckTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CheckTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<CheckTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assetType: 'none' as AssetType | 'none',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual',
    requiresEvidence: false,
    requiresGPS: true,
    requiresSignature: true,
    guidance: '',
    references: [] as string[],
    fields: [] as CheckField[],
  });

  // Field builder state
  const [editingField, setEditingField] = useState<CheckField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    label: '',
    type: 'text' as CheckField['type'],
    required: true,
    guidance: '',
    options: [] as string[],
  });

  useEffect(() => {
    if (userData?.orgId) {
      fetchCustomTemplates();
    }
  }, [userData]);

  const fetchCustomTemplates = async () => {
    try {
      setLoading(true);
      const templatesQuery = query(
        collection(db, 'check_templates'),
        where('orgId', '==', userData!.orgId)
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      const templatesData = templatesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as CheckTemplate[];
      setCustomTemplates(templatesData);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const allTemplates = [
    ...DEFAULT_CHECK_TEMPLATES.map((t, i) => ({ ...t, id: `default_${i}`, orgId: undefined })),
    ...customTemplates,
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      assetType: 'none',
      frequency: 'monthly',
      requiresEvidence: false,
      requiresGPS: true,
      requiresSignature: true,
      guidance: '',
      references: [],
      fields: [],
    });
    setError('');
  };

  const resetFieldForm = () => {
    setFieldForm({
      label: '',
      type: 'text',
      required: true,
      guidance: '',
      options: [],
    });
    setEditingField(null);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setError('');

      if (!formData.name.trim()) {
        setError('Template name is required');
        return;
      }
      if (formData.fields.length === 0) {
        setError('At least one check field is required');
        return;
      }

      const frequency = FREQUENCY_OPTIONS.find((f) => f.value === formData.frequency);

      await addDoc(collection(db, 'check_templates'), {
        orgId: userData.orgId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        assetType: formData.assetType === 'none' ? undefined : formData.assetType,
        frequency: formData.frequency,
        rrule: frequency?.rrule || 'FREQ=MONTHLY',
        fields: formData.fields,
        requiresEvidence: formData.requiresEvidence,
        requiresGPS: formData.requiresGPS,
        requiresSignature: formData.requiresSignature,
        guidance: formData.guidance.trim() || undefined,
        references: formData.references.filter((r) => r.trim()),
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await fetchCustomTemplates();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating template:', err);
      setError(err.message || 'Failed to create template');
    }
  };

  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !editingTemplate) return;

    try {
      setError('');

      if (!formData.name.trim()) {
        setError('Template name is required');
        return;
      }
      if (formData.fields.length === 0) {
        setError('At least one check field is required');
        return;
      }

      const frequency = FREQUENCY_OPTIONS.find((f) => f.value === formData.frequency);

      await updateDoc(doc(db, 'check_templates', editingTemplate.id), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        assetType: formData.assetType === 'none' ? undefined : formData.assetType,
        frequency: formData.frequency,
        rrule: frequency?.rrule || 'FREQ=MONTHLY',
        fields: formData.fields,
        requiresEvidence: formData.requiresEvidence,
        requiresGPS: formData.requiresGPS,
        requiresSignature: formData.requiresSignature,
        guidance: formData.guidance.trim() || undefined,
        references: formData.references.filter((r) => r.trim()),
        version: (editingTemplate.version || 1) + 1,
        updatedAt: new Date(),
      });

      await fetchCustomTemplates();
      setShowEditModal(false);
      setEditingTemplate(null);
      resetForm();
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError(err.message || 'Failed to update template');
    }
  };

  const handleCloneTemplate = (template: CheckTemplate | typeof DEFAULT_CHECK_TEMPLATES[0]) => {
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      assetType: template.assetType || 'none',
      frequency: template.frequency,
      requiresEvidence: template.requiresEvidence,
      requiresGPS: template.requiresGPS,
      requiresSignature: template.requiresSignature,
      guidance: template.guidance || '',
      references: template.references || [],
      fields: JSON.parse(JSON.stringify(template.fields)), // Deep clone
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (template: CheckTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'check_templates', template.id));
      await fetchCustomTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template');
    }
  };

  const openEditModal = (template: CheckTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      assetType: template.assetType || 'none',
      frequency: template.frequency,
      requiresEvidence: template.requiresEvidence,
      requiresGPS: template.requiresGPS,
      requiresSignature: template.requiresSignature,
      guidance: template.guidance || '',
      references: template.references || [],
      fields: JSON.parse(JSON.stringify(template.fields)),
    });
    setShowEditModal(true);
  };

  const handleAddField = () => {
    if (!fieldForm.label.trim()) {
      alert('Field label is required');
      return;
    }

    const newField: CheckField = {
      id: `field_${Date.now()}`,
      label: fieldForm.label.trim(),
      type: fieldForm.type,
      required: fieldForm.required,
      guidance: fieldForm.guidance.trim() || undefined,
      options: fieldForm.type === 'enum' ? fieldForm.options.filter((o) => o.trim()) : undefined,
    };

    if (editingField) {
      // Update existing field
      setFormData({
        ...formData,
        fields: formData.fields.map((f) => (f.id === editingField.id ? newField : f)),
      });
    } else {
      // Add new field
      setFormData({
        ...formData,
        fields: [...formData.fields, newField],
      });
    }

    resetFieldForm();
  };

  const handleEditField = (field: CheckField) => {
    setEditingField(field);
    setFieldForm({
      label: field.label,
      type: field.type,
      required: field.required,
      guidance: field.guidance || '',
      options: field.options || [],
    });
  };

  const handleDeleteField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((f) => f.id !== fieldId),
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formData.fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newFields.length) return;

    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFormData({ ...formData, fields: newFields });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading templates...</div>
      </div>
    );
  }

  const TemplateForm = ({ onSubmit, isEdit }: { onSubmit: (e: React.FormEvent) => void; isEdit: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormError message={error} />}

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Template Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="e.g., Monthly Fire Door Check"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={2}
          placeholder="Brief description of this check"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Asset Type</label>
          <select
            value={formData.assetType}
            onChange={(e) => setFormData({ ...formData, assetType: e.target.value as any })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ASSET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">Frequency *</label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-900 mb-2">Guidance</label>
        <textarea
          value={formData.guidance}
          onChange={(e) => setFormData({ ...formData, guidance: e.target.value })}
          className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          placeholder="Instructions for completing this check"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-brand-900">Requirements</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.requiresEvidence}
            onChange={(e) => setFormData({ ...formData, requiresEvidence: e.target.checked })}
            className="rounded border-brand-300"
          />
          <span className="text-sm text-brand-700">Requires photo evidence</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.requiresGPS}
            onChange={(e) => setFormData({ ...formData, requiresGPS: e.target.checked })}
            className="rounded border-brand-300"
          />
          <span className="text-sm text-brand-700">Requires GPS location</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.requiresSignature}
            onChange={(e) => setFormData({ ...formData, requiresSignature: e.target.checked })}
            className="rounded border-brand-300"
          />
          <span className="text-sm text-brand-700">Requires signature</span>
        </label>
      </div>

      {/* Check Fields Section */}
      <div className="border-t border-brand-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-brand-900">
            Check Fields * ({formData.fields.length})
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowFieldsModal(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Field
          </Button>
        </div>

        {formData.fields.length === 0 ? (
          <p className="text-xs text-brand-600 bg-brand-50 p-3 rounded">
            No fields added yet. Add at least one field for technicians to complete.
          </p>
        ) : (
          <div className="space-y-2">
            {formData.fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 p-2 bg-brand-50 rounded text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-900 truncate">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-brand-600">
                    {field.type === 'enum' ? `Multiple choice (${field.options?.length || 0} options)` : field.type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveField(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-brand-600 hover:bg-brand-100 rounded disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveField(index, 'down')}
                    disabled={index === formData.fields.length - 1}
                    className="p-1 text-brand-600 hover:bg-brand-100 rounded disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleEditField(field);
                      setShowFieldsModal(true);
                    }}
                    className="p-1 text-brand-600 hover:bg-brand-100 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {isEdit ? 'Save Changes' : 'Create Template'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingTemplate(null);
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
          <h1 className="text-2xl font-bold text-brand-900">Check Templates</h1>
          <p className="text-sm text-brand-600 mt-1">
            Manage standard inspection procedures and check forms
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {allTemplates.map((template) => {
          const isDefault = !template.orgId;
          const isCustom = !!template.orgId;

          return (
            <Card key={template.id}>
              <Card.Content>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-brand-600 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-brand-900 truncate">
                          {template.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={isDefault ? 'pending' : 'pass'}>
                          {isDefault ? 'System' : 'Custom'}
                        </Badge>
                        <Badge variant="pending">{template.frequency}</Badge>
                        {template.assetType && (
                          <Badge variant="pending">
                            {template.assetType.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-brand-700 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Requirements */}
                  <div className="flex items-center gap-4 text-xs text-brand-600">
                    {template.requiresEvidence && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Evidence
                      </span>
                    )}
                    {template.requiresGPS && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        GPS
                      </span>
                    )}
                    {template.requiresSignature && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Signature
                      </span>
                    )}
                  </div>

                  {/* Fields count */}
                  <p className="text-xs text-brand-600">
                    {template.fields.length} check field{template.fields.length !== 1 ? 's' : ''}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setViewingTemplate(template as any);
                        setShowFieldsModal(true);
                      }}
                      className="flex-1"
                    >
                      View Fields
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloneTemplate(template)}
                      title="Clone template"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    {isCustom && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(template as CheckTemplate)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template as CheckTemplate)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          );
        })}
      </div>

      {allTemplates.length === 0 && (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-brand-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-brand-900 mb-2">No templates yet</h3>
              <p className="text-sm text-brand-600 mb-4">
                Create your first custom check template
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Check Template"
        size="lg"
      >
        <TemplateForm onSubmit={handleCreateTemplate} isEdit={false} />
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
          resetForm();
        }}
        title="Edit Check Template"
        size="lg"
      >
        <TemplateForm onSubmit={handleEditTemplate} isEdit={true} />
      </Modal>

      {/* Field Builder Modal */}
      <Modal
        isOpen={showFieldsModal}
        onClose={() => {
          setShowFieldsModal(false);
          setViewingTemplate(null);
          resetFieldForm();
        }}
        title={viewingTemplate ? `Fields: ${viewingTemplate.name}` : editingField ? 'Edit Field' : 'Add Field'}
        size="md"
      >
        {viewingTemplate ? (
          // View mode
          <div className="space-y-3">
            {viewingTemplate.fields.map((field, index) => (
              <div key={field.id} className="p-3 bg-brand-50 rounded">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-brand-900">
                    {index + 1}. {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <Badge variant="pending" className="text-xs">
                    {field.type}
                  </Badge>
                </div>
                {field.guidance && (
                  <p className="text-xs text-brand-600 mb-2">{field.guidance}</p>
                )}
                {field.options && field.options.length > 0 && (
                  <div className="text-xs text-brand-600">
                    <span className="font-medium">Options:</span> {field.options.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Add/Edit mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Field Label *
              </label>
              <input
                type="text"
                value={fieldForm.label}
                onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g., Door closer functional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Field Type *
              </label>
              <select
                value={fieldForm.type}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, type: e.target.value as CheckField['type'] })
                }
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {fieldForm.type === 'enum' && (
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">
                  Options (one per line) *
                </label>
                <textarea
                  value={fieldForm.options.join('\n')}
                  onChange={(e) =>
                    setFieldForm({
                      ...fieldForm,
                      options: e.target.value.split('\n'),
                    })
                  }
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={4}
                  placeholder="Pass&#10;Fail&#10;N/A"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">Guidance</label>
              <textarea
                value={fieldForm.guidance}
                onChange={(e) => setFieldForm({ ...fieldForm, guidance: e.target.value })}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={2}
                placeholder="Help text for this field"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                className="rounded border-brand-300"
              />
              <span className="text-sm text-brand-700">Required field</span>
            </label>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleAddField} variant="primary" className="flex-1">
                {editingField ? 'Update Field' : 'Add Field'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowFieldsModal(false);
                  resetFieldForm();
                }}
              >
                {editingField ? 'Cancel' : 'Done'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
