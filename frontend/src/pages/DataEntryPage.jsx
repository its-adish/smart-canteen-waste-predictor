import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { recordsAPI, menuAPI } from '../services/api';

export const DataEntryPage = () => {
  const [records, setRecords] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // New Record Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'Lunch',
    menu_item_id: '',
    prepared_qty: 200,
    consumed_qty: 180,
    waste_qty: 20,
    attendance_expected: 550,
    attendance_actual: 540,
    is_holiday: false,
    special_event: 'None',
    weather_condition: 'Sunny',
    temperature_c: 24.0,
    notes: ''
  });

  // CSV Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [recRes, menuRes] = await Promise.all([
        recordsAPI.getAll({ meal_type: mealFilter || undefined, limit: 100 }),
        menuAPI.getAll(null, false)
      ]);
      setRecords(recRes.data);
      setMenuItems(menuRes.data);
      if (menuRes.data.length > 0 && !formData.menu_item_id) {
        setFormData(prev => ({ ...prev, menu_item_id: menuRes.data[0].id }));
      }
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [mealFilter]);

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        menu_item_id: parseInt(formData.menu_item_id),
        prepared_qty: parseFloat(formData.prepared_qty),
        consumed_qty: parseFloat(formData.consumed_qty),
        waste_qty: parseFloat(formData.waste_qty),
        attendance_expected: parseInt(formData.attendance_expected),
        attendance_actual: parseInt(formData.attendance_actual),
        temperature_c: parseFloat(formData.temperature_c)
      };

      await recordsAPI.create(payload);
      setShowAddModal(false);
      fetchRecords();
    } catch (err) {
      console.error("Error creating record:", err);
      alert(err.response?.data?.detail || "Failed to create daily record.");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await recordsAPI.delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    setImportResult(null);
    try {
      const data = new FormData();
      data.append('file', csvFile);
      const res = await recordsAPI.importCSV(data);
      setImportResult(res.data);
      fetchRecords();
    } catch (err) {
      setImportResult({
        total_rows: 0,
        imported_count: 0,
        skipped_count: 0,
        errors: [err.response?.data?.detail || "Upload error occurred."]
      });
    } finally {
      setImporting(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const itemName = r.menu_item?.name || '';
    return itemName.toLowerCase().includes(search.toLowerCase()) || r.date.includes(search);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
            <Database className="w-3.5 h-3.5" />
            <span>Master Log Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Daily Preparation & Leftover Waste Records
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Log daily operational metrics, import historical POS logs, or export datasets for retraining.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Daily Entry</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <a
            href={recordsAPI.exportCSVUrl()}
            download
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-2 transition-all"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dish name or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Meal:</span>
          <select
            value={mealFilter}
            onChange={(e) => setMealFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Meal Services</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Main Records Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Meal</th>
                <th className="py-3 px-4">Dish Name</th>
                <th className="py-3 px-4 text-right">Prepared</th>
                <th className="py-3 px-4 text-right">Consumed</th>
                <th className="py-3 px-4 text-right">Waste (kg)</th>
                <th className="py-3 px-4 text-right">Waste %</th>
                <th className="py-3 px-4 text-right">Cost Lost</th>
                <th className="py-3 px-4">Weather / Temp</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    Loading records repository...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    No matching daily records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{r.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                        {r.meal_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {r.menu_item?.name || `Item #${r.menu_item_id}`}
                    </td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-medium">{r.prepared_qty}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-medium">{r.consumed_qty}</td>
                    <td className="py-3 px-4 text-right text-rose-400 font-bold">{r.waste_qty}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        r.waste_pct > 12 ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {r.waste_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400 font-medium">
                      ${r.cost_lost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.weather_condition} ({r.temperature_c}°C)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Daily Record */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Log Daily Meal Preparation & Waste</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Meal Service</label>
                  <select
                    value={formData.meal_type}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Menu Dish</label>
                <select
                  value={formData.menu_item_id}
                  onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                >
                  {menuItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Portions Prepared</label>
                  <input
                    type="number"
                    required
                    step="1"
                    value={formData.prepared_qty}
                    onChange={(e) => {
                      const prep = parseFloat(e.target.value) || 0;
                      const cons = parseFloat(formData.consumed_qty) || 0;
                      setFormData({ 
                        ...formData, 
                        prepared_qty: prep,
                        waste_qty: Math.max(0, prep - cons)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Portions Consumed</label>
                  <input
                    type="number"
                    required
                    step="1"
                    value={formData.consumed_qty}
                    onChange={(e) => {
                      const cons = parseFloat(e.target.value) || 0;
                      const prep = parseFloat(formData.prepared_qty) || 0;
                      setFormData({ 
                        ...formData, 
                        consumed_qty: cons,
                        waste_qty: Math.max(0, prep - cons)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Leftover Waste</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={formData.waste_qty}
                    onChange={(e) => setFormData({ ...formData, waste_qty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Attendance</label>
                  <input
                    type="number"
                    value={formData.attendance_actual}
                    onChange={(e) => setFormData({ ...formData, attendance_actual: e.target.value, attendance_expected: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Weather</label>
                  <select
                    value={formData.weather_condition}
                    onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Sunny">Sunny</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Stormy">Stormy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.temperature_c}
                    onChange={(e) => setFormData({ ...formData, temperature_c: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Shift Notes / Observations</label>
                <input
                  type="text"
                  placeholder="e.g., Higher demand due to rainy morning"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                >
                  Save Daily Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Bulk Import Canteen Records via CSV</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportCSV} className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="block text-slate-300 font-semibold mb-1 cursor-pointer">
                  <span>Choose a .CSV file</span>
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  {csvFile ? csvFile.name : "Columns: date, meal_type, menu_item_name, prepared_qty, consumed_qty, waste_qty, attendance, weather_condition"}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Need formatting reference?</span>
                <a
                  href={recordsAPI.templateCSVUrl()}
                  download
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Download Sample CSV Template
                </a>
              </div>

              {importResult && (
                <div className={`p-3 rounded-xl text-xs ${importResult.skipped_count === 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
                  <p className="font-bold">
                    Successfully imported {importResult.imported_count} of {importResult.total_rows} rows.
                  </p>
                  {importResult.errors?.length > 0 && (
                    <ul className="list-disc pl-4 mt-1 text-[11px] space-y-0.5">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing || !csvFile}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50"
                >
                  {importing ? "Processing CSV..." : "Upload & Ingest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
