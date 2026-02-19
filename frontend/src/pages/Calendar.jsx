import { useState, useEffect } from'react';
import { Link } from'react-router-dom';
import api from'../services/api';
import { useToast } from'../contexts/ToastContext';

const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS = [
  'Janvier','Fevrier','Mars','Avril','Mai','Juin',
  'Juillet','Aout','Septembre','Octobre','Novembre','Decembre'
];

const TYPE_LABELS = {
  DEADLINE:'Echeance',
  HEARING:'Audience',
  MEETING:'Rendez-vous',
  REMINDER:'Rappel',
  TASK:'Tache',
  OTHER:'Autre',
};

const PRIORITY_COLORS = {
  LOW:'bg-gray-100 text-gray-700',
  NORMAL:'bg-blue-100 text-blue-700',
  HIGH:'bg-orange-100 text-orange-700',
  URGENT:'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  PENDING:'border-l-blue-500',
  IN_PROGRESS:'border-l-yellow-500',
  COMPLETED:'border-l-green-500',
  CANCELLED:'border-l-gray-400',
  OVERDUE:'border-l-red-500',
};

export default function Calendar() {
  const { success, error: showError } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState([]);
  const [deadlinesByDate, setDeadlinesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [overdueDeadlines, setOverdueDeadlines] = useState([]);
  const [folders, setFolders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchCalendarData();
    fetchUpcoming();
    fetchOverdue();
    fetchFolders();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const { data } = await api.get(`/deadlines/calendar?year=${year}&month=${month}`);
      setDeadlines(data.data?.deadlines || []);
      setDeadlinesByDate(data.data?.byDate || {});
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const { data } = await api.get('/deadlines/upcoming?days=14');
      setUpcomingDeadlines(data.data || []);
    } catch (err) {
      console.error('Error fetching upcoming:', err);
    }
  };

  const fetchOverdue = async () => {
    try {
      const { data } = await api.get('/deadlines/overdue');
      setOverdueDeadlines(data.data || []);
    } catch (err) {
      console.error('Error fetching overdue:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data } = await api.get('/folders?pageSize=100');
      setFolders(data.data || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7; // Adjust for Monday start

    const days = [];

    // Previous month's days
 const prevLastDay = new Date(year, month, 0).getDate();
 for (let i = startingDay - 1; i >= 0; i--) {
 days.push({ day: prevLastDay - i, isCurrentMonth: false, date: null });
 }

 // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        day: i,
        isCurrentMonth: true,
        date: dateKey,
        isToday: date.toDateString() === new Date().toDateString(),
        deadlines: deadlinesByDate[dateKey] || [],
      });
    }

    // Next month's days
 const remainingDays = 42 - days.length;
 for (let i = 1; i <= remainingDays; i++) {
 days.push({ day: i, isCurrentMonth: false, date: null });
 }

 return days;
 };

 const handleDayClick = (day) => {
 if (day.isCurrentMonth && day.date) {
 setSelectedDate(day.date);
 setEditingDeadline(null);
 setShowModal(true);
 }
 };

 const handleSaveDeadline = async (e) => {
 e.preventDefault();
 const formData = new FormData(e.target);

 const deadlineData = {
 title: formData.get('title'),
 description: formData.get('description'),
 dueDate: formData.get('dueDate'),
 dueTime: formData.get('dueTime') || null,
 type: formData.get('type'),
 priority: formData.get('priority'),
 folderId: formData.get('folderId') || null,
 };

 try {
 if (editingDeadline) {
 await api.put(`/deadlines/${editingDeadline.id}`, deadlineData);
 success('Echeance mise a jour');
 } else {
 await api.post('/deadlines', deadlineData);
 success('Echeance creee');
 }
 setShowModal(false);
 fetchCalendarData();
 fetchUpcoming();
 } catch (err) {
 showError(err.response?.data?.message ||'Erreur');
 }
 };

 const handleCompleteDeadline = async (id) => {
 try {
 await api.post(`/deadlines/${id}/complete`);
 success('Echeance terminee');
 fetchCalendarData();
 fetchUpcoming();
 fetchOverdue();
 } catch (err) {
 showError('Erreur');
 }
 };

 const handleDeleteDeadline = async (id) => {
 if (!confirm('Supprimer cette echeance ?')) return;
 try {
 await api.delete(`/deadlines/${id}`);
 success('Echeance supprimee');
 fetchCalendarData();
 fetchUpcoming();
 } catch (err) {
 showError('Erreur');
 }
 };

 return (
 <>
 <div className="flex gap-6">
 {/* Main Calendar */}
 <div className="flex-1">
 <div className="bg-white rounded-xl shadow-sm border border-gray-200">
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-gray-200">
 <div className="flex items-center gap-4">
 <h1 className="text-xl font-bold text-gray-900">
 {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
 </h1>
 <button
 onClick={goToToday}
 className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
 >
 Aujourd'hui
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ←
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-24 p-1 border rounded-lg cursor-pointer transition-colors ${
 day.isCurrentMonth
 ?'bg-white hover:bg-gray-50'
 :'bg-gray-50 text-gray-400'
 } ${day.isToday ?'ring-2 ring-blue-500' :'border-gray-200'}`}
                  >
                    <div className={`text-sm font-medium ${day.isToday ?'text-blue-600' :''}`}>
                      {day.day}
                    </div>
                    {day.deadlines?.slice(0, 3).map((deadline) => (
                      <div
                        key={deadline.id}
                        className={`text-xs truncate px-1 py-0.5 mt-1 rounded border-l-2 ${STATUS_COLORS[deadline.status]}`}
                        style={{ backgroundColor: deadline.folder?.color ? `${deadline.folder.color}20` : undefined }}
                        title={deadline.title}
                      >
                        {deadline.title}
                      </div>
                    ))}
                    {day.deadlines?.length > 3 && (
                      <div className="text-xs text-gray-500 mt-1">+{day.deadlines.length - 3} autres</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Add Button */}
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setEditingDeadline(null);
              setShowModal(true);
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            + Nouvelle echeance
          </button>

          {/* Overdue */}
          {overdueDeadlines.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="font-semibold text-red-800 mb-3">
                En retard ({overdueDeadlines.length})
              </h3>
              <div className="space-y-2">
                {overdueDeadlines.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-700 truncate flex-1">{d.title}</span>
                    <button
                      onClick={() => handleCompleteDeadline(d.id)}
                      className="text-green-600 hover:text-green-700 ml-2"
                      title="Marquer comme termine"
                    >
                      ✓
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              A venir (14 jours)
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune echeance</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((d) => (
                  <div
                    key={d.id}
                    className={`flex items-start gap-2 p-2 rounded-lg border-l-2 ${STATUS_COLORS[d.status]} bg-gray-50 `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{d.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(d.dueDate).toLocaleDateString('fr-FR')}
                        {d.dueTime && ` a ${d.dueTime}`}
                      </p>
                      {d.folder && (
                        <p className="text-xs text-gray-400">{d.folder.title}</p>
                      )}
                    </div>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${PRIORITY_COLORS[d.priority]}`}>
                      {d.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDeadline ?'Modifier l\'echeance' :'Nouvelle echeance'}
 </h3>
 <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
 </div>
 <form onSubmit={handleSaveDeadline} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
 <input
 type="text"
 name="title"
 required
 defaultValue={editingDeadline?.title}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
 <input
 type="date"
 name="dueDate"
 required
 defaultValue={editingDeadline?.dueDate?.split('T')[0] || selectedDate}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
 <input
 type="time"
 name="dueTime"
 defaultValue={editingDeadline?.dueTime}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
 <select
 name="type"
 defaultValue={editingDeadline?.type ||'DEADLINE'}
 className="w-full px-3 py-2 border rounded-lg"
 >
 {Object.entries(TYPE_LABELS).map(([value, label]) => (
 <option key={value} value={value}>{label}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Priorite</label>
 <select
 name="priority"
 defaultValue={editingDeadline?.priority ||'NORMAL'}
 className="w-full px-3 py-2 border rounded-lg"
 >
 <option value="LOW">Basse</option>
 <option value="NORMAL">Normale</option>
 <option value="HIGH">Haute</option>
 <option value="URGENT">Urgente</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Dossier</label>
 <select
 name="folderId"
 defaultValue={editingDeadline?.folderId ||''}
 className="w-full px-3 py-2 border rounded-lg"
 >
 <option value="">Aucun</option>
 {folders.map((f) => (
 <option key={f.id} value={f.id}>{f.reference} - {f.title}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
 <textarea
 name="description"
 rows={2}
 defaultValue={editingDeadline?.description}
 className="w-full px-3 py-2 border rounded-lg"
 />
 </div>
 <div className="flex justify-end gap-2 pt-4">
 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
 Annuler
 </button>
 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
 {editingDeadline ?'Modifier' :'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
