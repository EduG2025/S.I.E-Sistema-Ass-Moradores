
import React, { useState, useEffect } from 'react';
import { CommunityProject } from '../types';
import { projectService } from '../services/api';
import { 
  Plus, Search, Briefcase, TrendingUp, DollarSign, 
  Calendar, CheckCircle, Clock, Loader2, ChevronRight,
  Filter, BarChart3, Building2, ShieldAlert, X, Save,
  Users, MessageSquare, ThumbsUp, Camera, Landmark, Trash2, Edit2, Printer, Zap, Shield
} from 'lucide-react';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([] as CommunityProject[]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data.data || []);
    } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setEditingProject({ title: '', description: '', budget: 0, spent: 0, progress: 0, startDate: new Date().toISOString().split('T')[0], category: 'INFRA', status: 'PLANNING' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProject.id) {
        await projectService.update(editingProject.id, editingProject);
      } else {
        await projectService.create(editingProject);
      }
      setIsModalOpen(false);
      loadProjects();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este projeto permanentemente?")) return;
    await projectService.delete(id);
    loadProjects();
  };

  const handlePrintReport = (project: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html><head><title>Relatório S.I.E</title><style>body{font-family:sans-serif;padding:40px} .header{border-bottom:2px solid #333;margin-bottom:20px;padding-bottom:10px} .stat{display:flex;justify-content:space-between;padding:10px;background:#f9f9f9;margin-bottom:5px}</style></head>
            <body>
                <div class="header"><h1>Relatório de Projeto: ${project.title}</h1><p>Data: ${new Date().toLocaleDateString()}</p></div>
                <p><strong>Descrição:</strong> ${project.description}</p>
                <div class="stat"><span>Orçamento Aprovado:</span><span>R$ ${Number(project.budget).toLocaleString()}</span></div>
                <div class="stat"><span>Gasto Realizado:</span><span>R$ ${Number(project.spent).toLocaleString()}</span></div>
                <div class="stat"><span>Progresso Físico:</span><span>${project.progress}%</span></div>
                <div class="stat"><span>Status:</span><span>${project.status}</span></div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48}/></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl shrink-0">
        <div>
          <h2 className="text-3xl font-black tracking-tightest leading-none uppercase">Obras & Projetos</h2>
          <p className="text-[10px] text-indigo-300 font-black uppercase tracking-[0.3em] mt-2">SRE Infrastructure Pipeline</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all">
          <Plus size={20}/> Novo Edital
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {projects.map(project => (
              <div key={project.id} className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all flex flex-col h-full relative">
                  <div className="absolute top-6 right-6 flex gap-2">
                      <button onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={() => handlePrintReport(project)} className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg"><Printer size={16}/></button>
                      <button onClick={() => handleDelete(Number(project.id))} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-8 mt-4">
                      <div className="p-5 bg-slate-900 text-white rounded-[2rem]">
                          {project.category === 'INFRA' ? <Building2 size={28}/> : <Landmark size={28}/>}
                      </div>
                      <div>
                          <h3 className="text-2xl font-black text-slate-800 leading-none">{project.title}</h3>
                          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">{project.status}</span>
                      </div>
                  </div>

                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1">{project.description}</p>

                  <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                          <span>Progresso</span>
                          <span>{project.progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Aprovado</p>
                          <p className="text-lg font-black text-slate-800">R$ {Number(project.budget).toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl">
                          <p className="text-[8px] font-black text-emerald-600 uppercase">Realizado</p>
                          <p className="text-lg font-black text-emerald-700">R$ {Number(project.spent).toLocaleString()}</p>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="sie-editor-overlay">
          <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-xl relative z-20">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><Zap size={24}/></div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest leading-none">Protocolar Edital / Obra</h3>
                    <p className="text-indigo-400 text-[8px] font-black uppercase mt-1 tracking-widest">SRE Asset Planning</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <button onClick={handleSave} disabled={isSaving} className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl active:scale-95">
                      {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={18}/>} Commitar Edital
                  </button>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-2"><X size={28}/></button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar bg-white">
            <form onSubmit={handleSave} className="max-w-5xl mx-auto space-y-16 pb-20">
                <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-200 shadow-inner space-y-12">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Título do Empreendimento</label>
                        <input required className="w-full font-black h-20 bg-white border border-slate-200 rounded-[2rem] px-8 text-3xl focus:border-indigo-500 transition-all shadow-sm" value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Orçamento Previsto (R$)</label><input type="number" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500" value={editingProject.budget} onChange={e => setEditingProject({...editingProject, budget: e.target.value})} /></div>
                        <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Gasto Efetivado (R$)</label><input type="number" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500" value={editingProject.spent} onChange={e => setEditingProject({...editingProject, spent: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Progresso Atual (%)</label><input type="number" min="0" max="100" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500" value={editingProject.progress} onChange={e => setEditingProject({...editingProject, progress: e.target.value})} /></div>
                        <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Fase de Projeto</label>
                            <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase appearance-none" value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})}>
                                <option value="PLANNING">Planejamento</option>
                                <option value="EM_EXECUÇÃO">Em Execução</option>
                                <option value="CONCLUÍDO">Concluído</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4"><label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Descrição Técnica</label><textarea rows={6} className="w-full font-medium bg-white border border-slate-200 rounded-[2rem] p-8 text-lg focus:border-indigo-500" value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} /></div>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
