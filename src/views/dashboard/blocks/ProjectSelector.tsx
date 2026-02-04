import { useState, useEffect } from 'react';
import { useDashboardStore } from '@/shared/stores';

interface Project {
  id: string;
  name: string;
}

interface Props {
  onSelect: (projectId: string) => void;
}

export const ProjectSelector = ({ onSelect }: Props) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [budget, setBudget] = useState<number>(0);
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(true);
  const setSelectedProjectId = useDashboardStore(state => state.setSelectedProjectId);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/proxy/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
          setSelectedProjectId(data[0].id);
          onSelect(data[0].id);
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки проектов', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const res = await fetch('/api/proxy/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
        body: JSON.stringify({ 
            name: newProjectName,
            description,
            clientName,
            budget,
            color,
            status: 'ACTIVE'
        }), 
      });

      if (res.ok) {
        const newProject = await res.json();
        setProjects([...projects, newProject]);
        setSelectedId(newProject.id);
        setSelectedProjectId(newProject.id);
        onSelect(newProject.id);
        setNewProjectName('');
        setDescription('');
        setClientName('');
        setBudget(0);
        setIsCreating(false);
      } else {
        alert('Ошибка создания проекта');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-xs font-bold text-gray-400 animate-pulse uppercase tracking-widest">Loading projects...</div>;

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-bold text-gray-800 tracking-tight uppercase text-[10px]">Project</h4>
          {!isCreating && (
            <button
               onClick={() => setIsCreating(true)}
               className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
            >
              + New
            </button>
          )}
        </div>

        {projects.length === 0 || isCreating ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Project Name"
                className="w-full border-b border-gray-100 py-2 text-sm font-bold outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <textarea
                placeholder="Description"
                className="w-full border-b border-gray-100 py-2 text-sm font-medium outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300 h-12 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <input
                type="text"
                placeholder="Client"
                className="w-full border-b border-gray-100 py-2 text-xs font-medium outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Budget"
                className="w-full border-b border-gray-100 py-2 text-xs font-medium outline-none focus:border-blue-500 transition-colors placeholder:text-gray-300"
                value={budget || ''}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
               <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  className="w-5 h-5 rounded-full cursor-pointer border-none p-0 overflow-hidden"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createProject}
                    className="bg-[#1A1A1A] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Create
                  </button>
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setSelectedProjectId(e.target.value);
                onSelect(e.target.value);
              }}
              className="w-full bg-transparent border-b border-gray-100 py-2 text-2xl font-black tracking-tighter outline-none cursor-pointer focus:border-blue-500 transition-colors appearance-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">
               Currently Editing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}