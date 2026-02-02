'use client';

import { useEffect, useState } from 'react';
import { notesAPI, NotePlan } from '@/lib/api';
import InfoModal from '@/components/InfoModal';

export default function NotesPage() {
  const [notes, setNotes] = useState<NotePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<NotePlan | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminderDate: '',
    reminderTime: '',
  });
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Completed'>('All');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const data = await notesAPI.getAll();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (editingNote?.id) {
        await notesAPI.update(editingNote.id, formData);
      } else {
        await notesAPI.create({
          title: formData.title,
          description: formData.description,
          reminderDate: formData.reminderDate,
          reminderTime: formData.reminderTime,
          status: 'Pending',
        });
      }
      setShowForm(false);
      setEditingNote(null);
      setFormData({ title: '', description: '', reminderDate: '', reminderTime: '' });
      loadNotes();
    } catch (err: any) {
      setError(err.message || 'Failed to save note/plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: NotePlan) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      description: note.description,
      reminderDate: note.reminderDate.split('T')[0],
      reminderTime: note.reminderTime || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (actionInFlight) return;
    if (!confirm('Are you sure you want to delete this note/plan?')) return;
    try {
      setActionInFlight(`delete_${id}`);
      await notesAPI.delete(id);
      loadNotes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete note/plan');
    } finally {
      setActionInFlight(null);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    if (actionInFlight) return;
    try {
      setActionInFlight(`complete_${id}`);
      await notesAPI.markCompleted(id);
      loadNotes();
    } catch (err: any) {
      setError(err.message || 'Failed to mark as completed');
    } finally {
      setActionInFlight(null);
    }
  };

  const filteredNotes = notes.filter((note) => {
    if (filterStatus === 'All') return true;
    return note.status === filterStatus;
  });

  const getReminderStatus = (note: NotePlan) => {
    if (note.status === 'Completed') {
      return { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    }
    
    const reminderDateTime = new Date(`${note.reminderDate}T${note.reminderTime || '00:00'}`);
    const now = new Date();
    
    if (reminderDateTime < now) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    
    const hoursUntilReminder = (reminderDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilReminder <= 24) {
      return { label: 'Soon', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
    }
    
    return { label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const notesInfoSections = [
    {
      heading: 'English',
      lines: [
        'Create notes or plans with reminder date and time.',
        'Use filters to view All, Pending, or Completed.',
        'Mark items as Complete when finished.',
        'Edit or delete items from the card actions.'
      ]
    },
    {
      heading: 'العربية',
      lines: [
        'أنشئ ملاحظات أو خطط مع تاريخ ووقت التذكير.',
        'استخدم الفلاتر لعرض الكل أو المعلقة أو المكتملة.',
        'قم بوضع الحالة مكتمل عند الانتهاء.',
        'يمكنك تعديل أو حذف العناصر من أزرار البطاقة.'
      ]
    }
  ];

  return (
    <>
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Notes & Plans</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={() => setShowInfo(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2"
          type="button"
        >
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          Info
        </button>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingNote(null);
            setFormData({ title: '', description: '', reminderDate: '', reminderTime: '' });
          }}
          disabled={isSubmitting || !!actionInFlight}
          className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 ${
            isSubmitting || actionInFlight
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:from-primary-700 hover:to-primary-800 hover:shadow-xl'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline">Add Note/Plan</span>
          <span className="xs:hidden">Add</span>
        </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setFilterStatus('All')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filterStatus === 'All'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('Pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filterStatus === 'Pending'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('Completed')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filterStatus === 'Completed'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-5 sm:mb-6 flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {editingNote ? 'Edit Note/Plan' : 'Add New Note/Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editingNote ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingNote(null);
                  setFormData({ title: '', description: '', reminderDate: '', reminderTime: '' });
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full p-8 sm:p-12 text-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">No notes/plans found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Click "Add Note/Plan" to get started</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const status = getReminderStatus(note);
            return (
              <div
                key={note.id}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex-1 pr-2">{note.title}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.color} shadow-sm flex-shrink-0`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap line-clamp-3">
                  {note.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-4 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(`${note.reminderDate}T${note.reminderTime || '00:00'}`).toLocaleString()}
                  </p>
                  {note.createdDate && (
                    <p className="flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created: {new Date(note.createdDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {note.status !== 'Completed' && note.id && (
                    <button
                      onClick={() => handleMarkCompleted(note.id!)}
                      disabled={!!actionInFlight}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-green-800 hover:shadow-lg"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(note)}
                    disabled={!!actionInFlight}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary-700 hover:to-primary-800 hover:shadow-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => note.id && handleDelete(note.id)}
                    disabled={!!actionInFlight}
                    className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-700 hover:to-red-800 hover:shadow-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    <InfoModal
      isOpen={showInfo}
      onClose={() => setShowInfo(false)}
      title="Notes & Plans Information"
      sections={notesInfoSections}
    />
    </>
  );
}
