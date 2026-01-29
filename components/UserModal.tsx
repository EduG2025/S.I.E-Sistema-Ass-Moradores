import React, { useState, useEffect, useRef } from 'react';
import { User, FinancialRecord, SystemInfo, ResidentType, PreferredChannel } from '../types';
import { systemService, userService, financialService, aiService } from '../services/api';
import { formatCPF, validateCPF, normalizeCPF } from '../utils/cpf';
import { FINANCIAL_CATEGORIES, DEFAULT_SYSTEM_INFO } from '../constants';
import {
    Save, X, Loader2, Users, Heart, Wallet, Brain,
    User as UserIcon, Plus, Trash2, AlertCircle, Sparkles,
    Camera, Upload, MapPin, Fingerprint, DollarSign,
    LocateFixed
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';
import { useGeocodeAddress } from '../controllers/useGeocodeAddress';

// --- IMPORTS DO LEAFLET (MAPA REAL) ---
// NOTA: Requer 'npm install leaflet react-leaflet @types/leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- CORREÇÃO SRE: Ícones via CDN (Evita erros de build com Webpack/Vite) ---
const ICON_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const ICON_RETINA_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const SHADOW_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: ICON_URL,
    iconRetinaUrl: ICON_RETINA_URL,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
// ---------------------------------------------------------------

const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);

const SYSTEM_TEXTS = {
    TITLE_MODAL: "Identidade Digital",
    SUBTITLE_MODAL: "ID • PROTOCOLO",
    BTN_COMMIT_NEW: "Commitar Novo Membro",
    BTN_SYNC: "Sincronizar Registro",
    TAB_PERSONAL: "Cadastro Core",
    TAB_FAMILY: "Hierarquia Familiar",
    TAB_SOCIAL: "Dossiê Bioestatístico",
    TAB_FINANCIAL: "Ledger de Títulos",
    TAB_AI: "Advisor Mentor",
    TITLE_BIOMETRIC: "Handshake Biométrico",
    DESC_BIOMETRIC: "Defina a identidade visual do membro através de captura ou upload direto.",
    LBL_NO_IMAGE: "Sem Imagem",
    BTN_CAPTURE: "Capturar",
    BTN_START_CAM: "Iniciar Câmera",
    BTN_STOP_CAM: "Encerrar",
    BTN_UPLOAD: "Upload Arquivo",
    TITLE_CIVIL: "Identificação Civil",
    TITLE_ADDRESS_ATOMIC: "Endereço Atômico (Governança Postal)",
    LBL_CEP: "CEP",
    LBL_STREET: "Rua / Logradouro",
    LBL_NUMBER: "Número",
    LBL_COMPLEMENT: "Complemento",
    LBL_NEIGHBORHOOD: "Bairro",
    LBL_CITY_STATE: "Cidade / UF",
    PLACEHOLDER_CEP: "00000-000",
    PLACEHOLDER_NUMBER: "S/N",
    PLACEHOLDER_COMPLEMENT: "APTO 101, FUNDOS...",
    ALERT_CEP_FAIL: "PROTOCOLO POSTAL: CEP não localizado.",
    ALERT_NETWORK_FAIL: "FALHA DE REDE: Serviço postal indisponível.",
    MAP_TITLE: "Georreferenciamento Satelital",
    MAP_HINT: "Toque no mapa para posicionar o pino na entrada exata da unidade.",
    MAP_SAVE: "Confirmar Coordenadas",
    BTN_ABORT: "Abortar",
    TITLE_UNIT: "Vínculo Habitacional",
    LBL_VOTING_RIGHTS: "Direito a Voto em Assembleia",
    TITLE_GOVERNANCE: "Governança & Acesso",
    LBL_NEW_PASSWORD: "Nova Chave (Opcional)",
    TITLE_CONTACT: "Contato & Comunicação",
    LBL_CPF_INVALID: "CPF INVÁLIDO OU FORA DO PADRÃO SRE.",
    LBL_PHONE_INVALID: "FORMATO DE TELEFONE INVÁLIDO.",
    LBL_WHATSAPP_INVALID: "FORMATO DE WHATSAPP INVÁLIDO.",
    ERR_SYNC: "Erro de Sincronia: Verifique se o CPF é único ou se há falha no cluster.",
    LBL_TITULAR: "Titular",
    LBL_DEPENDENT: "Dependente",
    LBL_INQUILINO: "Inquilino",
    LBL_RESPONSAVEL: "Responsável Legal",
    LBL_OCUPANTE: "Ocupante",
    LBL_ACTIVE: "Ativo (Online)",
    LBL_PENDING: "Pendente de Validação",
    LBL_SUSPENDED: "Suspenso Temporariamente",
    LBL_BLOCKED: "Bloqueado / Risco",
    LBL_ARCHIVED: "Arquivado (Inativo)",
    TITLE_LEDGER: "Ledger Individual",
    BTN_NEW_TITLE: "Novo Título",
    TITLE_AI_MENTOR: "Analista de Perfil Mentor.",
    DESC_AI_MENTOR: "Geração de dossiê preditivo baseado em histórico de participação, adimplência e comportamento social.",
    BTN_GENERATE_DOSSIER: "Gerar Dossiê",
    BTN_PROCESSING: "Processando...",
    TITLE_DEPENDENTS: "Dependentes & Hierarquia",
    DESC_DEPENDENTS: "Membros vinculados à mesma unidade habitacional sob responsabilidade do titular.",
    LBL_NO_FINANCE: "Nenhum registro financeiro vinculado a este membro.",
    LBL_NO_DEPENDENTS: "Nenhum dependente protocolado.",
    TITLE_FIN_DESCRIPTION: "Descrição do Lançamento",
    TITLE_FIN_AMOUNT: "Valor (R$)",
    TITLE_FIN_DATE: "Data Competência",
    TITLE_FIN_TYPE: "Natureza",
    TITLE_FIN_CATEGORY: "Categoria Ledger",
    BTN_SYNC_TITLE: "Sincronizar Título",
    LBL_RECEITA: "Receita",
    LBL_DEBITO: "Débito",
    PLACEHOLDER_FIN_DESC: "EX: CONDOMÍNIO MAIO/25"
};

interface UserModalProps {
    user: User;
    onClose: () => void;
    onSaveSuccess: () => void;
}

type ExtendedUser = User & {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    coordinates?: { lat: number; lng: number } | null;
};

interface MapModalProps {
    initialCoords: { lat: number; lng: number } | null | undefined;
    onClose: () => void;
    onSave: (coords: { lat: number; lng: number }) => void;
}

// CORREÇÃO TS7006: Tipagem explícita para evitar 'implicit any'
const MapEvents = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

const MapModal: React.FC<MapModalProps> = ({ initialCoords, onClose, onSave }) => {
    const defaultCenter = { lat: -23.550520, lng: -46.633308 };
    const [position, setPosition] = useState<{ lat: number; lng: number }>(
        initialCoords || defaultCenter
    );

    const handleSaveInternal = () => {
        onSave(position);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[600px] flex flex-col relative animate-in zoom-in duration-300">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl shrink-0">
                    <h4 className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
                        <MapPin className="text-rose-600" /> {SYSTEM_TEXTS.MAP_TITLE}
                    </h4>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-600 p-2 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 relative z-0 overflow-hidden bg-slate-100">
                    <MapContainer
                        center={[position.lat, position.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[position.lat, position.lng]} />
                        <MapEvents onLocationSelect={(latlng) => setPosition({ lat: latlng.lat, lng: latlng.lng })} />
                    </MapContainer>

                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[400] text-xs font-bold text-slate-600 border border-slate-200 pointer-events-none">
                        {SYSTEM_TEXTS.MAP_HINT}
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50 rounded-b-3xl flex justify-between items-center shrink-0">
                    <div className="text-[10px] font-mono text-slate-400">
                        LAT: {position.lat.toFixed(6)} | LNG: {position.lng.toFixed(6)}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-slate-500 font-black text-xs uppercase hover:bg-slate-200 rounded-xl transition-all">
                            {SYSTEM_TEXTS.BTN_ABORT}
                        </button>
                        <button onClick={handleSaveInternal} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg">
                            <LocateFixed size={16} /> {SYSTEM_TEXTS.MAP_SAVE}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserModal = ({ user, onClose, onSaveSuccess }: UserModalProps) => {
    const [editingUser, setEditingUser] = useState<ExtendedUser>(() => ({
        ...user,
        coordinates: user.coordinates || undefined
    }));

    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'FAMILY' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');
    const [isSaving, setIsSaving] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [roles, setRoles] = useState<any[]>([]);
    const [dependents, setDependents] = useState<User[]>([]);
    const [finRecords, setFinRecords] = useState<FinancialRecord[]>([]);
    const [aiDossier, setAiDossier] = useState<string>('');
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [isFinLoading, setIsFinLoading] = useState(false);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [isAddingFinance, setIsAddingFinance] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const [newFinanceData, setNewFinanceData] = useState({
        description: '',
        amount: '',
        type: 'INCOME' as 'INCOME' | 'EXPENSE',
        category: 'CONDOMÍNIO',
        status: 'PENDING',
        date: new Date().toISOString().split('T')[0],
        recurrence: 'NONE' as 'NONE' | 'MONTHLY'
    });

    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isAddressManual = useRef(false);

    // --- CORREÇÃO: Desestruturação com Alias para 'isLoading' -> 'isGeocoding' ---
    const { geocode, coords: geocodedCoords, isLoading: isGeocoding } = useGeocodeAddress();

    const isTempUser = String(user.id).startsWith('temp_');

    useEffect(() => {
        loadCoreData();
        if (user.id && !isTempUser) {
            loadDependents();
            loadFinancials();
        }
    }, [user.id, isTempUser]);

    useEffect(() => {
        if (geocodedCoords && !isAddressManual.current) {
            setEditingUser(prev => ({
                ...prev,
                coordinates: geocodedCoords
            }));
        }
    }, [geocodedCoords]);

    const loadCoreData = async () => {
        try {
            const [rolesRes, sysRes] = await Promise.all([
                systemService.getRoles(),
                systemService.getInfo()
            ]);
            setRoles(rolesRes.data.data || []);
            setSystemInfo(sysRes.data || DEFAULT_SYSTEM_INFO);
        } catch (e) { console.error("SRE Core Fail"); }
    };

    const loadDependents = async () => {
        try {
            const res = await userService.getDependents(user.id);
            setDependents(res.data.data || []);
        } catch (e) { }
    };

    const loadFinancials = async () => {
        setIsFinLoading(true);
        try {
            const res = await financialService.getAll({ user_id: user.id });
            setFinRecords(res.data.data || []);
        } catch (e) { console.error("Ledger Fail"); }
        finally { setIsFinLoading(false); }
    };

    const formatPhone = (val: string) => {
        const cleaned = val.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    const validatePhone = (val: string) => {
        const cleaned = val.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 11;
    };

    const fetchAddressByCEPInternal = async (cep: string) => {
        setIsSearchingCEP(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setEditingUser(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
                geocode({
                    cep,
                    street: data.logradouro,
                    number: editingUser.number || '1',
                    city: data.localidade,
                    state: data.uf
                });
            } else {
                setErrors(prev => ({ ...prev, cep: SYSTEM_TEXTS.ALERT_CEP_FAIL }));
            }
        } catch (error) {
            setErrors(prev => ({ ...prev, cep: SYSTEM_TEXTS.ALERT_NETWORK_FAIL }));
        } finally {
            setIsSearchingCEP(false);
        }
    };

    const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCep = formatCEP(e.target.value);
        setEditingUser(p => ({ ...p, cep: formattedCep }));

        if (formattedCep.length === 9) {
            fetchAddressByCEPInternal(formattedCep.replace('-', ''));
            isAddressManual.current = false;
        } else if (formattedCep.length < 9) {
            setErrors(prev => ({ ...prev, cep: '' }));
        }
    };

    const handleMapSave = (coords: { lat: number; lng: number }) => {
        setEditingUser(prev => ({
            ...prev,
            coordinates: coords
        }));
        setIsMapModalOpen(false);
    };

    const handleSaveNewFinance = async () => {
        if (!newFinanceData.description || !newFinanceData.amount) {
            return alert("SRE: Descrição e valor são campos obrigatórios.");
        }
        setIsSaving(true);
        try {
            await financialService.create({
                ...newFinanceData,
                user_id: user.id,
                amount: parseFloat(newFinanceData.amount.toString().replace(',', '.'))
            });
            setIsAddingFinance(false);
            setNewFinanceData({
                description: '',
                amount: '',
                type: 'INCOME',
                category: 'CONDOMÍNIO',
                status: 'PENDING',
                date: new Date().toISOString().split('T')[0],
                recurrence: 'NONE' as 'NONE' | 'MONTHLY'
            });
            loadFinancials();
        } catch (e) {
            alert("Erro ao comitar título no Ledger.");
        } finally {
            setIsSaving(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (e) { alert("Hardware de vídeo indisponível para captura biométrica."); }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const capturePhoto = async () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const b64 = canvasRef.current.toDataURL('image/jpeg', 0.8);

            setEditingUser(prev => ({ ...prev, avatar_url: b64 }));
            stopCamera();

            if (!isTempUser) {
                try {
                    await userService.updateAvatar(editingUser.id, b64);
                } catch (e) { console.error("Falha na sincronia atômica do avatar."); }
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const b64 = reader.result as string;
                setEditingUser(prev => ({ ...prev, avatar_url: b64 }));
                if (!isTempUser) {
                    try {
                        await userService.updateAvatar(editingUser.id, b64);
                    } catch (e) { console.error("Falha na sincronia atômica do avatar."); }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        const cleanCpf = normalizeCPF(editingUser.cpf_cnpj || '');

        if (!validateCPF(cleanCpf)) newErrors.cpf_cnpj = SYSTEM_TEXTS.LBL_CPF_INVALID;
        if (editingUser.phone && !validatePhone(editingUser.phone)) newErrors.phone = SYSTEM_TEXTS.LBL_PHONE_INVALID;
        if (editingUser.whatsapp && !validatePhone(editingUser.whatsapp)) newErrors.whatsapp = SYSTEM_TEXTS.LBL_WHATSAPP_INVALID;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setActiveTab('PERSONAL');
            return;
        }

        setIsSaving(true);
        try {
            const payload: any = { ...editingUser };
            if (tempPassword.trim()) payload.password = tempPassword;

            payload.cpf_cnpj = cleanCpf;
            if (payload.phone) payload.phone = payload.phone.replace(/\D/g, '');
            if (payload.whatsapp) payload.whatsapp = payload.whatsapp.replace(/\D/g, '');
            delete payload.address;

            payload.active = payload.active ? 1 : 0;
            payload.voting_rights = payload.voting_rights ? 1 : 0;
            payload.coordinates = payload.coordinates ? JSON.stringify(payload.coordinates) : null;

            if (isTempUser) {
                const { id, ...clean } = payload;
                await userService.create(clean);
            } else {
                await userService.update(editingUser.id, payload);
            }
            onSaveSuccess();
        } catch (e) {
            alert(SYSTEM_TEXTS.ERR_SYNC);
        } finally { setIsSaving(false); }
    };

    const handleDeleteFinance = async (id: string | number | undefined) => {
        if (!id) return;
        if (!confirm("Remover este título permanentemente?")) return;
        try {
            await financialService.delete(id);
            loadFinancials();
        } catch (e) { alert("Falha ao remover."); }
    };

    const handleGenerateAiDossier = async () => {
        if (isTempUser) return;
        setIsGeneratingDossier(true);
        try {
            const res = await aiService.generateUserDossier(editingUser.id);
            setAiDossier(res.data.text);
        } catch (e) {
            alert("Erro ao gerar dossiê via IA.");
        } finally {
            setIsGeneratingDossier(false);
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';
    const hasPendingFinancials = finRecords.some(r => r.status === 'PENDING');
    const isSocialDataIncomplete = !editingUser.socialData || Object.keys(editingUser.socialData).length === 0;
    const isAiDossierPending = !aiDossier;

    const getStatusIndicator = (tabId: 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER') => {
        if (tabId === 'FINANCIAL' && hasPendingFinancials) return <AlertCircle size={14} className="text-rose-500" />;
        if (tabId === 'SOCIAL' && isSocialDataIncomplete) return <AlertCircle size={14} className="text-amber-500" />;
        if (tabId === 'AI_DOSSIER' && isAiDossierPending) return <Sparkles size={14} className="text-blue-400" />;
        return null;
    };

    return (
        <div className="sie-editor-overlay">
            {isMapModalOpen && (
                <MapModal
                    initialCoords={editingUser.coordinates}
                    onClose={() => setIsMapModalOpen(false)}
                    onSave={handleMapSave}
                />
            )}
            <div className="sie-modal-container">
                <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-2xl" style={{ backgroundColor: primaryColor }}><UserIcon size={24} /></div>
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{editingUser.name || SYSTEM_TEXTS.TITLE_MODAL}</h3>
                            <p className="text-indigo-400 text-[10px] font-black mt-2 tracking-[0.4em] opacity-80">{systemInfo.shortName} {SYSTEM_TEXTS.SUBTITLE_MODAL} {editingUser.role || 'RESIDENT'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-4 shadow-2xl active:scale-95 group" style={{ backgroundColor: primaryColor }}>
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {isTempUser ? SYSTEM_TEXTS.BTN_COMMIT_NEW : SYSTEM_TEXTS.BTN_SYNC}
                        </button>
                        <button onClick={onClose} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5"><X size={28} /></button>
                    </div>
                </div>

                <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2 overflow-x-auto custom-scrollbar">
                    {[
                        { id: 'PERSONAL', label: SYSTEM_TEXTS.TAB_PERSONAL, icon: Fingerprint },
                        { id: 'FAMILY', label: SYSTEM_TEXTS.TAB_FAMILY, icon: Users },
                        { id: 'SOCIAL', label: SYSTEM_TEXTS.TAB_SOCIAL, icon: Heart, indicator: getStatusIndicator('SOCIAL') },
                        { id: 'FINANCIAL', label: SYSTEM_TEXTS.TAB_FINANCIAL, icon: Wallet, indicator: getStatusIndicator('FINANCIAL') },
                        { id: 'AI_DOSSIER', label: SYSTEM_TEXTS.TAB_AI, icon: Brain, indicator: getStatusIndicator('AI_DOSSIER') }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[180px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl border border-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`} style={activeTab === tab.id ? { color: primaryColor } : {}}>
                            <tab.icon size={16} /> {tab.label}
                            {tab.indicator && <span className="p-1 rounded-full">{tab.indicator}</span>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe]">
                    <div className="max-w-6xl mx-auto p-10 space-y-12 pb-20">

                        {activeTab === 'PERSONAL' && (
                            <div className="animate-fade-in space-y-12">
                                <div className="flex flex-col md:flex-row items-center gap-12 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner">
                                    <div className="relative group">
                                        <div className="w-56 h-56 rounded-[3rem] bg-slate-200 border-4 border-white shadow-2xl overflow-hidden relative flex items-center justify-center ring-4 ring-slate-100">
                                            {editingUser.avatar_url ? (
                                                <img src={editingUser.avatar_url} className="w-full h-full object-cover" />
                                            ) : cameraActive ? (
                                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
                                            ) : (
                                                <div className="text-center space-y-3">
                                                    <UserIcon size={80} className="text-slate-300 mx-auto" />
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_NO_IMAGE}</p>
                                                </div>
                                            )}
                                        </div>
                                        {cameraActive && (
                                            <button onClick={capturePhoto} className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-500 transition-all border-4 border-white">
                                                <Camera size={16} /> {SYSTEM_TEXTS.BTN_CAPTURE}
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-6 flex-1 text-center md:text-left">
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tightest">{SYSTEM_TEXTS.TITLE_BIOMETRIC}</h4>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">{SYSTEM_TEXTS.DESC_BIOMETRIC}</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            {!cameraActive ? (
                                                <button onClick={startCamera} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3">
                                                    <Camera size={20} /> {SYSTEM_TEXTS.BTN_START_CAM}
                                                </button>
                                            ) : (
                                                <button onClick={stopCamera} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-3"><X size={20} /> {SYSTEM_TEXTS.BTN_STOP_CAM}</button>
                                            )}
                                            <label className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center gap-3">
                                                <Upload size={20} /> {SYSTEM_TEXTS.BTN_UPLOAD}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{SYSTEM_TEXTS.TITLE_CIVIL}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-2 md:col-span-2 lg:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.name || ''} onChange={e => setEditingUser(prev => ({ ...prev, name: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Único)</label>
                                            <input
                                                inputMode="numeric"
                                                className={`w-full font-mono font-black h-14 bg-slate-50 border-2 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white transition-all ${errors.cpf_cnpj ? 'border-rose-500 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-500'}`}
                                                value={editingUser.cpf_cnpj || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEditingUser(prev => ({ ...prev, cpf_cnpj: formatCPF(val) }));
                                                    if (errors.cpf_cnpj) setErrors(prev => ({ ...prev, cpf_cnpj: '' }));
                                                }}
                                                maxLength={14}
                                            />
                                            {errors.cpf_cnpj && <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest ml-1">{errors.cpf_cnpj}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                                            <input type="date" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.birth_date ? editingUser.birth_date.slice(0, 10) : ''} onChange={e => setEditingUser(prev => ({ ...prev, birth_date: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.rg || ''} onChange={e => setEditingUser(prev => ({ ...prev, rg: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emissor</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={editingUser.issuing_authority || ''} onChange={e => setEditingUser(prev => ({ ...prev, issuing_authority: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.gender || ''} onChange={e => setEditingUser(prev => ({ ...prev, gender: e.target.value as any }))}>
                                                <option value="">Selecione...</option>
                                                <option value="MALE">Masculino</option>
                                                <option value="FEMALE">Feminino</option>
                                                <option value="OTHER">Outro</option>
                                                <option value="PREFER_NOT_TO_SAY">Prefiro não Informar</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.profession || ''} onChange={e => setEditingUser(prev => ({ ...prev, profession: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Seção Endereço Atômico */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{SYSTEM_TEXTS.TITLE_ADDRESS_ATOMIC}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CEP}</label>
                                            <div className="relative">
                                                <input
                                                    inputMode="numeric"
                                                    className={`w-full font-black h-14 bg-white border rounded-xl px-6 text-lg focus:outline-none transition-all ${errors.cep ? 'border-rose-500' : 'border-slate-200 focus:border-indigo-500'}`}
                                                    value={editingUser.cep || ''}
                                                    onChange={handleCEPChange}
                                                    maxLength={9}
                                                    placeholder={SYSTEM_TEXTS.PLACEHOLDER_CEP}
                                                />
                                                {(isSearchingCEP || isGeocoding) && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={20} />}
                                                {errors.cep && <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest ml-1 mt-1">{errors.cep}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_STREET}</label>
                                            <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base uppercase outline-none" value={editingUser.street || ''} onChange={e => setEditingUser(prev => ({ ...prev, street: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NUMBER}</label>
                                            <div className="flex gap-2">
                                                <input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-base outline-none focus:border-indigo-500 transition-all" value={editingUser.number || ''} onChange={e => setEditingUser(prev => ({ ...prev, number: e.target.value }))} placeholder={SYSTEM_TEXTS.PLACEHOLDER_NUMBER} />
                                                <button
                                                    onClick={() => setIsMapModalOpen(true)}
                                                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors shadow-sm ${editingUser.coordinates ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                                    title={editingUser.coordinates ? "Localização Definida" : "Ajustar Mapa"}
                                                >
                                                    {editingUser.coordinates ? <MapPin size={20} /> : <LocateFixed size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_COMPLEMENT}</label>
                                            <input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-base outline-none focus:border-indigo-500 transition-all" value={editingUser.complement || ''} onChange={e => setEditingUser(prev => ({ ...prev, complement: e.target.value }))} placeholder={SYSTEM_TEXTS.PLACEHOLDER_COMPLEMENT} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NEIGHBORHOOD}</label>
                                            <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base uppercase outline-none" value={editingUser.neighborhood || ''} onChange={e => setEditingUser(prev => ({ ...prev, neighborhood: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CITY_STATE}</label>
                                            <div className="flex gap-2">
                                                <input readOnly className="flex-1 h-14 bg-slate-100 border border-slate-200 rounded-xl px-6 font-bold uppercase" value={editingUser.city || ''} />
                                                <input readOnly className="w-16 h-14 bg-slate-100 border border-slate-200 rounded-xl text-center font-bold" value={editingUser.state || ''} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* FIM DA SEÇÃO ENDEREÇO ATÔMICO */}


                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{SYSTEM_TEXTS.TITLE_UNIT}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Cluster</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base focus:bg-white focus:border-indigo-500 shadow-inner outline-none uppercase transition-all" value={editingUser.unit || ''} onChange={e => setEditingUser(prev => ({ ...prev, unit: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Residente</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.resident_type || 'TITULAR'} onChange={e => setEditingUser(prev => ({ ...prev, resident_type: e.target.value as ResidentType }))}>
                                                <option value="TITULAR">{SYSTEM_TEXTS.LBL_TITULAR}</option>
                                                <option value="DEPENDENTE">{SYSTEM_TEXTS.LBL_DEPENDENT}</option>
                                                <option value="INQUILINO">{SYSTEM_TEXTS.LBL_INQUILINO}</option>
                                                <option value="RESPONSAVEL">{SYSTEM_TEXTS.LBL_RESPONSAVEL}</option>
                                                <option value="OCUPANTE">{SYSTEM_TEXTS.LBL_OCUPANTE}</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all" checked={!!editingUser.voting_rights} onChange={e => setEditingUser(prev => ({ ...prev, voting_rights: e.target.checked ? 1 : 0 }))} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{SYSTEM_TEXTS.LBL_VOTING_RIGHTS}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{SYSTEM_TEXTS.TITLE_GOVERNANCE}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Papel SRE</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.role || ''} onChange={e => setEditingUser(prev => ({ ...prev, role: e.target.value }))}>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Conta</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.status || ''} onChange={e => setEditingUser(prev => ({ ...prev, status: e.target.value as any }))}>
                                                <option value="ACTIVE">{SYSTEM_TEXTS.LBL_ACTIVE}</option>
                                                <option value="PENDING">{SYSTEM_TEXTS.LBL_PENDING}</option>
                                                <option value="SUSPENDED">{SYSTEM_TEXTS.LBL_SUSPENDED}</option>
                                                <option value="BLOCKED">{SYSTEM_TEXTS.LBL_BLOCKED}</option>
                                                <option value="ARCHIVED">{SYSTEM_TEXTS.LBL_ARCHIVED}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NEW_PASSWORD}</label>
                                            <input type="password" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-base shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={tempPassword} onChange={e => setTempPassword(e.target.value)} placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{SYSTEM_TEXTS.TITLE_CONTACT}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                            <input className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.email || ''} onChange={e => setEditingUser(prev => ({ ...prev, email: e.target.value }))} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / Fixo</label>
                                            <input
                                                inputMode="numeric"
                                                className={`w-full font-black h-14 bg-slate-50 border-2 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white transition-all ${errors.phone ? 'border-rose-500 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-500'}`}
                                                value={editingUser.phone || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEditingUser(prev => ({ ...prev, phone: formatPhone(val) }));
                                                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                                                }}
                                                placeholder="(00) 00000-0000"
                                            />
                                            {errors.phone && <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest ml-1">{errors.phone}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Bridge</label>
                                            <input
                                                inputMode="numeric"
                                                className={`w-full font-black h-14 bg-slate-50 border-2 rounded-xl px-6 text-sm shadow-inner outline-none focus:bg-white transition-all ${errors.whatsapp ? 'border-rose-500 focus:border-rose-600' : 'border-slate-200 focus:border-indigo-500'}`}
                                                value={editingUser.whatsapp || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEditingUser(prev => ({ ...prev, whatsapp: formatPhone(val) }));
                                                    if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: '' }));
                                                }}
                                                placeholder="(00) 00000-0000"
                                            />
                                            {errors.whatsapp && <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest ml-1">{errors.whatsapp}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal Preferencial</label>
                                            <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase shadow-inner appearance-none focus:bg-white focus:border-indigo-500 transition-all" value={editingUser.preferred_channel || 'WHATSAPP'} onChange={e => setEditingUser(prev => ({ ...prev, preferred_channel: e.target.value as PreferredChannel }))}>
                                                <option value="WHATSAPP">WhatsApp Messenger</option>
                                                <option value="EMAIL">E-mail Eletrônico</option>
                                                <option value="APP">App S.I.E Mobile</option>
                                                <option value="SMS">SMS Direto</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'SOCIAL' && (
                            <div className="animate-fade-in space-y-12">
                                <SocialQuestionnaire user={editingUser} onSave={(data) => setEditingUser(prev => ({ ...prev, socialData: data }))} onCancel={() => setActiveTab('PERSONAL')} />
                            </div>
                        )}

                        {activeTab === 'FINANCIAL' && (
                            <div className="animate-fade-in space-y-12">
                                <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-sm">
                                    <div className="p-10 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-8">
                                        <h4 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-4"><Wallet size={20} className="text-indigo-600" /> {SYSTEM_TEXTS.TITLE_LEDGER}</h4>
                                        <button onClick={() => setIsAddingFinance(!isAddingFinance)} className={`px-8 py-4 ${isAddingFinance ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-900 hover:bg-indigo-600'} text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl active:scale-95`}>
                                            {isAddingFinance ? <X size={16} /> : <Plus size={16} />} {isAddingFinance ? SYSTEM_TEXTS.BTN_ABORT : SYSTEM_TEXTS.BTN_NEW_TITLE}
                                        </button>
                                    </div>

                                    {/* FORMULÁRIO DE NOVO TÍTULO RESTAURADO */}
                                    {isAddingFinance && (
                                        <div className="p-10 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.TITLE_FIN_DESCRIPTION}</label>
                                                    <input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-5 text-sm font-black focus:border-indigo-500 outline-none uppercase shadow-sm" value={newFinanceData.description} onChange={e => setNewFinanceData({ ...newFinanceData, description: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_FIN_DESC} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.TITLE_FIN_AMOUNT}</label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                        <input type="number" step="0.01" className="w-full h-14 bg-white border border-slate-200 rounded-xl pl-12 pr-5 text-lg font-black focus:border-indigo-500 outline-none shadow-sm" value={newFinanceData.amount} onChange={e => setNewFinanceData({ ...newFinanceData, amount: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.TITLE_FIN_DATE}</label>
                                                    <input type="date" className="w-full h-14 bg-white border border-slate-200 rounded-xl px-5 text-sm font-black focus:border-indigo-500 outline-none shadow-sm" value={newFinanceData.date} onChange={e => setNewFinanceData({ ...newFinanceData, date: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.TITLE_FIN_TYPE}</label>
                                                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                                        <button onClick={() => setNewFinanceData({ ...newFinanceData, type: 'INCOME' })} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${newFinanceData.type === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>{SYSTEM_TEXTS.LBL_RECEITA}</button>
                                                        <button onClick={() => setNewFinanceData({ ...newFinanceData, type: 'EXPENSE' })} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${newFinanceData.type === 'EXPENSE' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>{SYSTEM_TEXTS.LBL_DEBITO}</button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.TITLE_FIN_CATEGORY}</label>
                                                    <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-5 text-[10px] font-black uppercase shadow-sm outline-none appearance-none" value={newFinanceData.category} onChange={e => setNewFinanceData({ ...newFinanceData, category: e.target.value })}>
                                                        {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-4">
                                                    <button onClick={handleSaveNewFinance} disabled={isSaving} className="flex-1 h-14 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {SYSTEM_TEXTS.BTN_SYNC_TITLE}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-separate border-spacing-0">
                                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                                <tr><th className="p-8">Identificação</th><th className="p-8 text-center">Protocolo</th><th className="p-8 text-center">Estado</th><th className="p-8 text-right">Montante</th><th className="p-8 text-right">Ações</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {finRecords.map(rec => (
                                                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="p-8"><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{rec.description}</p></td>
                                                        <td className="p-8 text-center text-xs font-bold text-slate-500">{new Date(rec.date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-8 text-center"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${rec.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{rec.status}</span></td>
                                                        <td className={`p-8 text-right font-black text-base ${rec.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {Number(rec.amount).toLocaleString('pt-BR')}</td>
                                                        <td className="p-8 text-right"><div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => handleDeleteFinance(rec.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={18} /></button></div></td>
                                                    </tr>
                                                ))}
                                                {finRecords.length === 0 && !isFinLoading && (
                                                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">{SYSTEM_TEXTS.LBL_NO_FINANCE}</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'AI_DOSSIER' && (
                            <div className="animate-fade-in space-y-10">
                                <div className="p-16 bg-slate-900 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12 border border-white/5">
                                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform rotate-12 scale-125"><Brain size={280} /></div>
                                    <div className="relative z-10 space-y-6">
                                        <h3 className="text-5xl font-black tracking-tightest uppercase leading-tight">{SYSTEM_TEXTS.TITLE_AI_MENTOR}</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm uppercase italic opacity-80">{SYSTEM_TEXTS.DESC_AI_MENTOR}</p>
                                    </div>
                                    <button onClick={handleGenerateAiDossier} disabled={isGeneratingDossier || isTempUser} className={`px-14 py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center gap-6 transition-all active:scale-95 ${isTempUser ? 'bg-slate-700 opacity-50' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                                        {isGeneratingDossier ? <Loader2 className="animate-spin" size={28} /> : <Brain size={28} />} {isGeneratingDossier ? SYSTEM_TEXTS.BTN_PROCESSING : SYSTEM_TEXTS.BTN_GENERATE_DOSSIER}
                                    </button>
                                </div>
                                {aiDossier && (
                                    <div className="bg-white border border-slate-200 rounded-[4rem] p-20 shadow-inner relative overflow-hidden animate-slide-up">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                                        <p className="font-serif text-2xl leading-[1.8] text-slate-800 uppercase tracking-tight whitespace-pre-wrap">{aiDossier}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'FAMILY' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-200 text-center">
                                    <Users size={64} className="mx-auto text-slate-300 mb-6" />
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">{SYSTEM_TEXTS.TITLE_DEPENDENTS}</h3>
                                    <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">{SYSTEM_TEXTS.DESC_DEPENDENTS}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {dependents.map(dep => (
                                        <div key={dep.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-inner">
                                                {dep.avatar_url ? <img src={dep.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={32} className="text-slate-300 m-4" />}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-slate-800 uppercase leading-none">{dep.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{dep.resident_type} • {dep.cpf_cnpj}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {dependents.length === 0 && (
                                        <div className="col-span-full py-20 border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_NO_DEPENDENTS}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">SRE Kernel Identity Management Session Active</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-10 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Fechar</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-14 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Commitar Mudanças</button>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default UserModal;