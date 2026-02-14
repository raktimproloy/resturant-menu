'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ExtrasManagement() {
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    categoryId: '',
    categoryLabel: '',
    status: 'Available',
  });
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      const response = await fetch('/api/extras');
      const data = await response.json();
      if (data.success) {
        setExtras(data.extras || []);
      }
    } catch (error) {
      console.error('Error fetching extras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    // Add all form fields
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });

    // Add images
    if (editingItem) {
      // For editing, send existing images and images to delete
      formDataToSend.append('existingImages', JSON.stringify(existingImages));
      if (imagesToDelete.length > 0) {
        formDataToSend.append('deleteImages', JSON.stringify(imagesToDelete));
      }
    }
    // Add new images (for both create and edit)
    newImages.forEach((file) => {
      formDataToSend.append('images', file);
    });

    try {
      const url = '/api/extras';
      const method = editingItem ? 'PUT' : 'POST';
      
      if (editingItem) {
        formDataToSend.append('id', editingItem.id);
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await response.json();
      if (data.success) {
        fetchExtras();
        setShowModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save extra item');
      }
    } catch (error) {
      console.error('Error saving extra item:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this extra item?')) return;

    try {
      const response = await fetch(`/api/extras?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchExtras();
      } else {
        alert(data.error || 'Failed to delete extra item');
      }
    } catch (error) {
      console.error('Error deleting extra item:', error);
      alert('An error occurred');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = (item.status || 'Available') === 'Available' ? 'Not Available' : 'Available';
    try {
      const response = await fetch('/api/extras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        fetchExtras();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('An error occurred');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name || '',
      price: item.price || '',
      categoryId: item.categoryId || '',
      categoryLabel: item.categoryLabel || '',
      status: item.status || 'Available',
    });
    setExistingImages(item.images || []);
    setImagesToDelete([]);
    setNewImages([]);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      price: '',
      categoryId: '',
      categoryLabel: '',
      status: 'Available',
    });
    setNewImages([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setEditingItem(null);
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Extras Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm lg:text-base min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
          Add Extra Item
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 -mx-1 sm:mx-0">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[520px] sm:min-w-0">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                  ID
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-2.5 lg:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {extras.map((item) => {
                const primaryImage = item.images?.[0] || `https://placehold.co/60x60/475569/f1f5f9?text=${item.name.split(' ')[0]}`;
                return (
                <tr key={item.id} className="hover:bg-gray-750">
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                    <img
                      src={primaryImage}
                      alt={item.name}
                      className="w-10 h-10 lg:w-12 lg:h-12 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-white font-medium text-sm lg:text-base hidden sm:table-cell max-w-[80px] truncate">
                    {item.id}
                  </td>
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 text-gray-300 text-sm lg:text-base max-w-[100px] sm:max-w-none truncate sm:whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-green-400 font-semibold text-sm lg:text-base">
                    {Number(item.price)} ৳
                  </td>
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-gray-300 text-xs lg:text-sm hidden md:table-cell">
                    {item.categoryLabel}
                  </td>
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        (item.status || 'Available') === 'Available'
                          ? 'bg-green-600/30 text-green-400 hover:bg-green-600/50'
                          : 'bg-red-600/30 text-red-400 hover:bg-red-600/50'
                      }`}
                      title={(item.status || 'Available') === 'Available' ? 'Click to set Unavailable' : 'Click to set Available'}
                    >
                      {(item.status || 'Available') === 'Available' ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Available
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Unavailable
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-2 sm:px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-indigo-400 hover:text-indigo-300 touch-manipulation rounded-lg hover:bg-gray-700/50"
                        aria-label="Edit"
                      >
                        <Edit className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 flex items-center justify-center text-red-400 hover:text-red-300 touch-manipulation rounded-lg hover:bg-gray-700/50"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-800 rounded-t-2xl sm:rounded-xl w-full max-w-md border border-gray-700 border-b-0 sm:border-b max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 lg:mb-6 gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                  {editingItem ? 'Edit Extra Item' : 'Add Extra Item'}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingItem}
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    placeholder="e.g., water, cheese"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category ID
                    </label>
                    <input
                      type="text"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., other, beverages"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category Label
                    </label>
                    <input
                      type="text"
                      value={formData.categoryLabel}
                      onChange={(e) => setFormData({ ...formData, categoryLabel: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Other, Beverages"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setNewImages(prev => [...prev, ...files]);
                    }}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {existingImages.map((img, index) => (
                      <div key={index} className="relative">
                        <img
                          src={img}
                          alt={`Existing ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagesToDelete(prev => [...prev, img]);
                            setExistingImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {newImages.map((file, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm lg:text-base"
                  >
                    <Save className="w-4 h-4 lg:w-5 lg:h-5" />
                    {editingItem ? 'Update' : 'Create'}
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


