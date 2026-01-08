
import React, { useState, useEffect } from 'react';
import { financialService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  AlertTriangle, Users, Loader2, TrendingUp, 
  Shield, ChevronRight, UserPlus, FileText, Activity, Zap, Landmark, Sparkles
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadStats = async () => {
          try {
              const res = await financialService.getDashboardStats();
              setStats(res.data);
          } catch (error) {
              setStats({ balance: 0, openIncidents: 0, totalUsers: 0, sla: 'N/A' });
          } finally {
              setLoading(false);
          }
      };
      loadStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={56}/>
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-[0.4em]">Sincronizando Cluster de Dados...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="space-y-6 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full w-fit border border-indigo-500/30">
                        <Shield size={16} className="text-indigo-400"/>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">SRE Operational Core V22.0</span>
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tightest leading-[0.9]">
                      Gestão Inteligente <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Ativa & Co-Gestiva</span>
                  </h1>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                      Plataforma integrada de governança, economia circular e inteligência demográfica.
                  </p>
              </div>
              <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Social Score Avg</p>
                      <h3 className="text-4xl font-black">782</h3>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                      <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Solvência Global</p>
                      <h3 className="text-4xl font-black">AAA</h3>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Caixa Operacional", value: `R$ ${(stats?.balance || 0).toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-emerald-500', tab: 'finance' },
          { title: "Alertas Críticos", value: stats?.openIncidents || 0, icon: AlertTriangle, color: 'text-rose-500', tab: 'operations' },
          { title: "Membros Ativos", value: stats?.totalUsers || 0, icon: Users, color: 'text-indigo-500', tab: 'users' },
          { title: "SLA Médio", value: stats?.sla || 'N/A', icon: Zap, color: 'text-amber-500', tab: 'timeline' }
        ].map((stat, i) => (
          <div key={stat.title} onClick={() => onNavigate(stat.tab)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
              <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-2xl bg-slate-50 ${stat.color} group-hover:scale-110 transition-transform`}><stat.icon size={28}/></div>
                  <ChevronRight size={18} className="text-slate-300"/>
              </div>
              <div className="mt-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1 tracking-tighter">{stat.value}</h3>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
