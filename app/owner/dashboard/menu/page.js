'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [extras, setExtras] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryIds: [],
    time: '',
    status: 'Available',
    tag: '',
    mainItems: [],
    uses: '',
    extraItemIds: [],
    discountType: 'percentage',
    discountValue: '',
  });
  const [mainItemInput, setMainItemInput] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    fetchMenuItems();
    fetchExtras();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.menu || []);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExtras = async () => {
    try {
      const response = await fetch('/api/extras');
      const data = await response.json();
      if (data.success) {
        setExtras(data.extras || []);
      }
    } catch (error) {
      console.error('Error fetching extras:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    // Add all form fields
    Object.keys(formData).forEach(key => {
      if (key === 'mainItems' || key === 'extraItemIds' || key === 'categoryIds') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (key === 'discountType' || key === 'discountValue') {
        // Handle discount separately
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Add discount as JSON object
    if (formData.discountValue) {
      const discount = {
        type: formData.discountType,
        value: parseFloat(formData.discountValue)
      };
      formDataToSend.append('discount', JSON.stringify(discount));
    }

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
      const url = editingItem ? '/api/menu' : '/api/menu';
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
        fetchMenuItems();
        setShowModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchMenuItems();
      } else {
        alert(data.error || 'Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('An error occurred');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      price: item.price || '',
      categoryIds: item.categoryIds || [],
      time: item.time || '',
      status: item.status || 'Available',
      tag: item.tag || '',
      mainItems: item.mainItems || [],
      uses: item.uses || '',
      extraItemIds: item.extraItemIds || [],
      discountType: item.discount?.type || 'percentage',
      discountValue: item.discount?.value || '',
    });
    setMainItemInput('');
    setExistingImages(item.images || []);
    setImagesToDelete([]);
    setNewImages([]);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      categoryIds: [],
      time: '',
      status: 'Available',
      tag: '',
      mainItems: [],
      uses: '',
      extraItemIds: [],
      discountType: 'percentage',
      discountValue: '',
    });
    setMainItemInput('');
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
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Menu Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm lg:text-base"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
          Add Menu Item
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 lg:px-6 py-2 lg:py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {menuItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-750">
                  <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-white font-medium text-sm lg:text-base">
                    {item.name}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-gray-300 text-xs lg:text-sm">
                    {item.categoryIds && item.categoryIds.length > 0
                      ? item.categoryIds.map(id => categories.find(c => c.id === id)?.label).filter(Boolean).join(', ')
                      : 'No categories'}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-green-400 font-semibold text-sm lg:text-base">
                    {item.finalPrice !== undefined ? Number(item.finalPrice).toFixed(2) : Number(item.price).toFixed(2)} BDT
                    {item.discount && (
                      <span className="ml-2 text-xs text-red-400 line-through">
                        {Number(item.price).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'Available'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 lg:p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[95vh] lg:max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 lg:mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categories
                  </label>
                  <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              categoryIds: checked
                                ? [...prev.categoryIds, category.id]
                                : prev.categoryIds.filter(id => id !== category.id)
                            }));
                          }}
                          className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-300 text-sm">
                          {category.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                    >
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tag
                    </label>
                    <input
                      type="text"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                      placeholder="e.g., Special, Popular"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Uses
                    </label>
                    <input
                      type="text"
                      value={formData.uses}
                      onChange={(e) => setFormData({ ...formData, uses: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Vegetarian, Vegan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Main Items
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={mainItemInput}
                      onChange={(e) => setMainItemInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (mainItemInput.trim()) {
                            setFormData(prev => ({
                              ...prev,
                              mainItems: [...prev.mainItems, mainItemInput.trim()]
                            }));
                            setMainItemInput('');
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Add main item and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (mainItemInput.trim()) {
                          setFormData(prev => ({
                            ...prev,
                            mainItems: [...prev.mainItems, mainItemInput.trim()]
                          }));
                          setMainItemInput('');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.mainItems.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-900 text-indigo-200 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              mainItems: prev.mainItems.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-indigo-300 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="price">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:text-base"
                      placeholder={formData.discountType === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 50 for 50 BDT'}
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Available Extras
                  </label>
                  <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2">
                    {extras.map((extra) => (
                      <label key={extra.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.extraItemIds.includes(extra.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              extraItemIds: checked
                                ? [...prev.extraItemIds, extra.id]
                                : prev.extraItemIds.filter(id => id !== extra.id)
                            }));
                          }}
                          className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-300 text-sm">
                          {extra.name} (+{Number(extra.price).toFixed(2)} BDT)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition text-sm lg:text-base"
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


