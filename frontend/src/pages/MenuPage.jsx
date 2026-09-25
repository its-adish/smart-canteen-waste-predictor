import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Leaf, 
  DollarSign, 
  X,
  CheckCircle2
} from 'lucide-react';
import { menuAPI } from '../services/api';

export const MenuPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Lunch',
    portion_size_g: 350.0,
    cost_per_portion: 2.50,
    co2_per_kg: 2.1,
    description: '',
    is_active: true
  });

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await menuAPI.getAll(categoryFilter || null, false);
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [categoryFilter]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Lunch',
      portion_size_g: 350.0,
      cost_per_portion: 2.50,
      co2_per_kg: 2.1,
      description: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      portion_size_g: item.portion_size_g,
      cost_per_portion: item.cost_per_portion,
      co2_per_kg: item.co2_per_kg,
      description: item.description || '',
      is_active: item.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        portion_size_g: parseFloat(formData.portion_size_g),
        cost_per_portion: parseFloat(formData.cost_per_portion),
        co2_per_kg: parseFloat(formData.co2_per_kg)
      };

      if (editingItem) {
        await menuAPI.update(editingItem.id, payload);
      } else {
        await menuAPI.create(payload);
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      alert("Failed to save menu item.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this menu item?")) return;
    try {
      await menuAPI.delete(id);
      fetchMenu();
    } catch (err) {
      alert("Failed to deactivate menu item.");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Culinary Catalogue & Eco-Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Menu Item & Recipe Specifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain dish serving portions, portion procurement cost, and carbon intensity factors.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search dish by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Meal:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">Loading menu items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400">No dishes match your query.</div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-slate-900/80 border shadow-lg transition-all flex flex-col justify-between ${
                item.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-medium text-[10px] uppercase">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{item.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Dish"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Deactivate"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {item.description || "Freshly prepared balanced meal offering tailored for campus dining service."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-2 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Portion</span>
                  <span className="font-semibold text-slate-200">{item.portion_size_g}g</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Unit Cost</span>
                  <span className="font-bold text-amber-400">${item.cost_per_portion.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">CO2 / kg</span>
                  <span className="font-semibold text-emerald-400">{item.co2_per_kg} kg</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add/Edit Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                <span>{editingItem ? 'Edit Dish Specifications' : 'Add New Menu Item'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tuscan White Bean Stew"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Meal Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Portion Weight (grams)</label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={formData.portion_size_g}
                    onChange={(e) => setFormData({ ...formData, portion_size_g: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cost Per Portion ($)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={formData.cost_per_portion}
                    onChange={(e) => setFormData({ ...formData, cost_per_portion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CO2 Footprint (kg CO2 / kg food)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.co2_per_kg}
                    onChange={(e) => setFormData({ ...formData, co2_per_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recipe / Ingredient Notes</label>
                <textarea
                  rows="2"
                  placeholder="Key ingredients, allergens, or preparation tips"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
