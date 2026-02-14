'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    label: '',
    enabled: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = editingCategory
      ? { id: editingCategory.id, label: formData.label, enabled: formData.enabled }
      : { label: formData.label, enabled: formData.enabled };
    try {
      const url = '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        setShowModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('An error occurred');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      id: category.id || '',
      label: category.label || '',
      enabled: category.enabled !== false,
    });
    setShowModal(true);
  };

  const handleToggleEnabled = async (category) => {
    const newEnabled = category.enabled === false;
    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category.id,
          label: category.label,
          enabled: newEnabled,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error toggling category:', error);
      alert('An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      label: '',
      enabled: true,
    });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 lg:mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Category Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm lg:text-base min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
          Add Category
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 -mx-1 sm:mx-0">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[280px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-2.5 lg:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className={`hover:bg-gray-750 ${category.enabled === false ? 'opacity-60' : ''}`}
                >
                  <td className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4 text-white font-medium text-sm lg:text-base max-w-[100px] sm:max-w-none truncate">
                    {category.id}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4 text-gray-300 text-sm lg:text-base truncate">
                    {category.label}
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleEnabled(category)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                        category.enabled !== false
                          ? 'bg-green-600/30 text-green-400 hover:bg-green-600/50'
                          : 'bg-red-600/30 text-red-400 hover:bg-red-600/50'
                      }`}
                      title={category.enabled !== false ? 'Enabled - Click to disable' : 'Disabled - Click to enable'}
                    >
                      {category.enabled !== false ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Disabled
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-indigo-400 hover:text-indigo-300 touch-manipulation rounded-lg hover:bg-gray-700/50"
                        aria-label="Edit"
                      >
                        <Edit className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-red-400 hover:text-red-300 touch-manipulation rounded-lg hover:bg-gray-700/50"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl w-full max-w-md border border-gray-700 border-b-0 sm:border-b pb-[env(safe-area-inset-bottom)]">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 lg:mb-6 gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg active:bg-gray-700 touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
                {editingCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category ID</label>
                    <input
                      type="text"
                      value={formData.id}
                      readOnly
                      className="w-full px-3 lg:px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-400 text-sm lg:text-base"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                    placeholder="e.g., Appetizers, Main Course"
                  />
                </div>

                {editingCategory && (
                  <div className="flex items-center gap-3">
                    <label className="block text-sm font-medium text-gray-300">Status</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        formData.enabled
                          ? 'bg-green-600/30 text-green-400'
                          : 'bg-red-600/30 text-red-400'
                      }`}
                    >
                      {formData.enabled ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Disabled
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-500">
                      Disabled = all items in this category become unavailable
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm lg:text-base"
                  >
                    <Save className="w-4 h-4 lg:w-5 lg:h-5" />
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
