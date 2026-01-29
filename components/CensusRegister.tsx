import React, { useState, useEffect, useRef } from 'react';
import { userService, systemService, unitService, storageService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { User, ResidentType, PreferredChannel, UserRole, UserStatus, SystemInfo, TerritorialUnit } from '../types';
import {
    Loader2, CheckCircle2, UserPlus, ShieldCheck, X,
    Smartphone, Mail, MapPin, User as UserIcon, ArrowRight, Zap,
    Fingerprint, Info, Save, Camera, ScanLine, Upload, Building,
    Shield, Key, Radio, UserCheck, Globe, Smartphone as WhatsAppIcon,
    Search, Home, Navigation, AlertTriangle, ZapOff, Download,
    ChevronLeft, ChevronRight, Eye, EyeOff, ClipboardCheck, ClipboardPaste, UserSearch // Ícones completos
} from 'lucide-react';

// Função auxiliar de máscara de CEP
const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);

// UTILIDADE CRÍTICA: Converte Data URL (Base64) para objeto File (Obrigatório para Upload Seguro)
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    // Detecta o tipo MIME (ex: image/jpeg)
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    // CORREÇÃO: 'Uint8array' para 'Uint8Array'
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const CensusRegister = ({ onClose, primaryColor = '#4f46e5' }: { onClose?: () => void, primaryColor?: string }) => {

    // 1. ESTADO DO STEPPER (Fluxo de 5 Etapas)
    const [currentStep, setCurrentStep] = useState(0); // Inicia no Step 0: CPF
    const steps = [
        { id: 0, title: 'Identidade', icon: UserSearch }, // Nova etapa
        { id: 1, title: 'Biometria', icon: Fingerprint },
        { id: 2, title: 'Civil', icon: UserIcon },
        { id: 3, title: 'Território', icon: MapPin },
        { id: 4, title: 'Acesso', icon: Shield }
    ];

    // 2. MATRIZ DE ESTADO V260.1
    const [formData, setFormData] = useState({
        id: null as (string | number | null), // Adiciona ID para UPDATE
        name: '', username: '', cpf_cnpj: '', birth_date: '', rg: '', issuing_authority: '', gender: '', profession: '',
        // Endereço Atômico
        cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
        // Vínculo Territorial
        unit: '', unit_type: 'CASA' as 'LOTE' | 'CASA' | 'CHACARA' | 'COMERCIO', // ✅ Tipo de Unidade
        resident_type: 'TITULAR' as ResidentType, voting_rights: 1,
        // Governança e Acesso
        role: 'RESIDENT' as UserRole | string, status: 'ACTIVE' as UserStatus,
        password: '', confirmPassword: '',
        email: '', phone: '', whatsapp: '', preferred_channel: 'WHATSAPP' as PreferredChannel,
        avatar_url: '', coordinates: { lat: 0, lng: 0 },
        lgpd_consent: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState<number | null>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [availableUnits, setAvailableUnits] = useState<TerritorialUnit[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemInfo | null>(null);

    // Estado para a Verificação de CPF
    const [isCheckingCpf, setIsCheckingCpf] = useState(false);
    const [verifiedExistingUser, setVerifiedExistingUser] = useState<User | null>(null); // Armazena usuário se encontrado

    // Camera Refs
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- 3. BOOT: HANDSHAKE DE CONFIGURAÇÕES E HERANÇA ---
    useEffect(() => {
        const bootProtocol = async () => {
            try {
                // CORREÇÃO CRÍTICA: Isolar falhas de API para garantir que o formulário abra
                const [resRoles, resSystem, resUnits] = await Promise.all([
                    systemService.getRoles().catch((e) => {
                        console.error("SRE_BOOT_FAILURE: Falha ao carregar roles. Retornando vazio.", e);
                        return { data: { data: [] } };
                    }),
                    systemService.getInfo().catch((e) => {
                        console.error("SRE_BOOT_FAILURE: Falha ao carregar info de sistema.", e);
                        return { data: { data: {} } };
                    }),
                    unitService.getAll().catch((e) => {
                        console.error("SRE_BOOT_FAILURE: Falha ao carregar unidades.", e);
                        return { data: { data: [] } };
                    })
                ]);

                setRoles(resRoles.data.data || []);
                setAvailableUnits(resUnits.data.data || []);

                const sys = resSystem.data?.data || resSystem.data;
                setSystemSettings(sys);

                // HERANÇA AUTOMÁTICA: Preenche o endereço do usuário com o endereço da Associação
                if (sys) {
                    setFormData(prev => ({
                        ...prev,
                        cep: formatCEP(sys.cep || ''),
                        street: sys.street || '',
                        neighborhood: sys.neighborhood || '',
                        city: sys.city || '',
                        state: sys.state || '',
                        unit: prev.unit || '',
                        coordinates: sys.coordinates || prev.coordinates
                    }));
                }

                // Carrega CPF de URL, se houver
                const params = new URLSearchParams(window.location.search);
                const cpfParam = params.get('cpf');
                if (cpfParam) setFormData(prev => ({ ...prev, cpf_cnpj: formatCPF(cpfParam) }));
            } catch (e) {
                console.error("SRE_KERNEL_FAILURE: Erro fatal na carga de metadados.", e);
            }
        };
        bootProtocol();
    }, []);

    // --- 4. GATILHOS E VALIDAÇÕES ---

    const handleCEPBlur = async () => {
        const cep = formData.cep.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsSearchingCEP(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(p => ({ ...p, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
                setError('');
            } else { setError('PROTOCOLO POSTAL: CEP não localizado.'); }
        } catch (e) { setError('FALHA DE REDE: Serviço postal indisponível.'); }
        finally { setIsSearchingCEP(false); }
    };

    // --- LÓGICA DE VERIFICAÇÃO DE CPF (STEP 0) ---
    const handleCpfCheck = async () => {
        const cpfClean = normalizeCPF(formData.cpf_cnpj);
        if (!validateCPF(cpfClean)) {
            setError('CPF inválido ou incompleto.');
            return;
        }

        setError('');
        setIsCheckingCpf(true);

        try {
            // Busca o usuário. Assumindo que userService.getAll permite busca por CPF/search
            const res = await userService.getAll(1, 1, cpfClean);
            const userFound = res.data.data.find((u: User) => normalizeCPF(u.cpf_cnpj) === cpfClean);

            if (userFound) {
                // CPF ENCONTRADO: Carrega dados para atualização do censo/pesquisa
                setVerifiedExistingUser(userFound);
                setFormData(prev => ({
                    ...prev,
                    ...userFound,
                    cpf_cnpj: formatCPF(userFound.cpf_cnpj),
                    // Garante que campos de senha e confirmação fiquem vazios por segurança
                    password: '',
                    confirmPassword: ''
                }));
                setError(`Identidade Encontrada. Preencha ou atualize o Censo para o usuário ${userFound.name}.`);
            } else {
                // CPF NÃO ENCONTRADO: Inicia novo cadastro
                setError('Identidade não registrada. Prossiga para um novo cadastro.');
            }
            setCurrentStep(1); // Vai para o Step 1 (Biometria)
        } catch (e) {
            setError('Falha de rede ao verificar identidade. Tente novamente.');
        } finally {
            setIsCheckingCpf(false);
        }
    };

    // --- Biometria e Câmera (mantidas) ---
    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (e) { alert("Hardware Vision indisponível. Verifique permissões."); }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            setFormData({ ...formData, avatar_url: canvasRef.current.toDataURL('image/jpeg', 0.7) });
            stopCamera();
        }
    };

    // --- Navegação Stepper e Validação de Transição ---
    const nextStep = () => {
        // Validação Step 0
        if (currentStep === 0) return handleCpfCheck();

        // Validações Mínimas de Transição (Steps 1 a 4)
        if (currentStep === 1 && !formData.avatar_url) return setError('Capture ou anexe sua foto para continuar (Vision ID obrigatório).');
        if (currentStep === 2) {
            if (!formData.name) return setError('O nome completo é obrigatório.');
            if (!validateCPF(normalizeCPF(formData.cpf_cnpj))) return setError('Preencha um CPF válido para identificação.');
        }
        if (currentStep === 3 && (!formData.unit || !formData.cep)) return setError('A Referência da Unidade e o CEP são obrigatórios.');

        setError('');
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    // Permite voltar do Step 1 para o Step 0 para re-verificação de CPF
    const prevStep = () => { setError(''); setCurrentStep(prev => Math.max(prev - 1, 0)); };

    // --- Submissão Final (CREATE ou UPDATE) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação de Senha SÓ é necessária se o usuário for NOVO ou se ele preencheu as senhas
        if (!verifiedExistingUser || (formData.password || formData.confirmPassword)) {
            if (formData.password !== formData.confirmPassword) return setError('Senhas não conferem. Verifique a confirmação.');
        }

        if (!formData.lgpd_consent) return setError('Você deve aceitar os Termos da LGPD para finalizar o protocolo.');

        setIsLoading(true);

        let finalAvatarUrl = formData.avatar_url;
        const cpfClean = normalizeCPF(formData.cpf_cnpj);

        // Upload da Imagem, se for Base64 (capturada ou carregada localmente)
        if (formData.avatar_url.startsWith('data:')) {
            const filename = `${cpfClean}_${Date.now()}_avatar.jpeg`;
            try {
                const file = dataURLtoFile(formData.avatar_url, filename);
                const uploadRes = await storageService.upload(file);
                finalAvatarUrl = uploadRes.data.url;
            } catch (uploadError: any) {
                console.error("SRE_UPLOAD_FAULT:", uploadError);
                setError(uploadError?.response?.data?.error || 'SRE_UPLOAD_FAULT: Falha ao enviar a imagem para o servidor de armazenamento.');
                setIsLoading(false);
                return;
            }
        }

        try {

            const basePayload = {
                ...formData,
                name: formData.name.toUpperCase(),
                username: formData.username || cpfClean,
                cpf_cnpj: cpfClean,
                active: 1,
                unit: formData.unit || formData.complement,
                address: `${formData.street}, ${formData.number}`,
                avatar_url: finalAvatarUrl,
            };

            // 1. Remove o campo de confirmação antes de enviar o payload para a API
            const { confirmPassword, ...payloadWithoutConfirmation } = basePayload;

            // CORREÇÃO TS 2741: Tipamos o payload como 'any' para permitir a modificação de estrutura (omissão de password)
            let finalPayload: any = payloadWithoutConfirmation;
            let res;

            if (verifiedExistingUser && verifiedExistingUser.id) {
                // ROTA DE UPDATE (CENSO/PESQUISA)
                // Se a senha estiver vazia, removemos o campo 'password' do payload para não sobrescrever o hash
                if (!finalPayload.password) {
                    // Usamos desestruturação segura, sabendo que isso removerá a propriedade 'password'
                    const { password, ...safePayload } = finalPayload;
                    finalPayload = safePayload;
                }

                // Chamada de update, agora com payload tipado como 'any'
                res = await userService.update(verifiedExistingUser.id, finalPayload);
            } else {
                // ROTA DE CREATE (NOVO REGISTRO)
                res = await userService.create(finalPayload);
            }

            setSuccessId(res.data.id || res.data.data?.id);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'SRE_FAULT: Erro na sincronização com o Kernel.');
        } finally { setIsLoading(false); }
    };

    // --- RENDERIZADORES DE ETAPA ---
    const renderStepIndicator = () => (
        <div className="flex justify-between mb-12 relative px-4 max-w-4xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
            {steps.map((s) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${currentStep >= s.id ? 'bg-indigo-600 text-white border-indigo-100 shadow-lg scale-110' : 'bg-white text-slate-300 border-slate-50'}`}>
                        <s.icon size={24} />
                    </div>
                    <span className={`text-[9px] font-black uppercase mt-3 tracking-widest text-center ${currentStep >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</span>
                </div>
            ))}
        </div>
    );

    const renderCpfCheck = () => (
        <div className="animate-fade-in space-y-10 text-center max-w-lg mx-auto py-20">
            <UserSearch size={64} className="mx-auto text-indigo-500 mb-6" />
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Validação de Identidade</h3>
            <p className="text-slate-500 font-medium text-sm">
                Informe seu CPF para verificarmos se você já possui um cadastro no sistema S.I.E.
            </p>

            <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">CPF (Obrigatório)</label>
                <input
                    required
                    className="w-full h-16 bg-white border border-slate-300 rounded-2xl px-6 text-2xl font-mono font-black outline-none focus:border-indigo-500 transition-all text-center tracking-wider"
                    value={formData.cpf_cnpj}
                    onChange={e => setFormData({ ...formData, cpf_cnpj: formatCPF(e.target.value) })}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    disabled={isCheckingCpf}
                />
                {isCheckingCpf && <Loader2 className="absolute right-4 top-1/2 mt-3 -translate-y-1/2 animate-spin text-indigo-500" size={20} />}
            </div>

            {verifiedExistingUser && (
                <div className='p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-sm mt-8'>
                    <ClipboardCheck size={20} className='inline mr-2' /> Usuário **{verifiedExistingUser.name}** encontrado. Prossiga para atualização.
                </div>
            )}

        </div>
    );

    const renderContent = () => {
        switch (currentStep) {
            case 0:
                return renderCpfCheck();
            case 1:
                return (
                    <div className="animate-fade-in space-y-10">
                        <div className="bg-slate-50 p-6 md:p-12 rounded-[4rem] border border-slate-100 flex flex-col items-center gap-10 shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative">
                                <div className="w-56 h-56 rounded-[3.5rem] bg-slate-200 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center ring-8 ring-slate-100/50 relative">
                                    {formData.avatar_url ? (<img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar Biométrico" />) : cameraActive ? (<div className="relative w-full h-full"><video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" /><div className="absolute inset-0 border-[30px] border-black/30 rounded-[3rem] pointer-events-none"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-52 border-2 border-dashed border-white/50 rounded-[100%]"></div></div>) : (<UserIcon size={80} className="text-slate-300" />)}
                                </div>
                                {cameraActive && (<button type="button" onClick={capturePhoto} className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-10 py-3 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl border-4 border-white active:scale-95 transition-all">Capturar Face</button>)}
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 pt-6">
                                {!cameraActive ? (<button type="button" onClick={startCamera} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all tracking-widest"><Camera size={20} /> Ativar Câmera</button>) : (<button type="button" onClick={stopCamera} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 border border-rose-100 tracking-widest"><ZapOff size={20} /> Encerrar Scan</button>)}
                                <label className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 cursor-pointer shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition-all tracking-widest"><Upload size={20} /> Carregar Arquivo <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onloadend = () => setFormData({ ...formData, avatar_url: r.result as string }); r.readAsDataURL(file); } }} /></label>
                            </div>
                            <p className='text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-4'>Protocolo Vision ID: OBRIGATÓRIO PARA PROSSEGUIR</p>
                        </div>
                    </div>
                );
            case 2:
                // Civil
                return (
                    <div className="animate-fade-in space-y-12">
                        <div className="flex items-center gap-4 border-l-4 border-indigo-500 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.4em]">Protocolo Civil</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo (Imutável após Commit)</label>
                                <input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder='NOME COMPLETO' readOnly={!!verifiedExistingUser} />
                                {!!verifiedExistingUser && <p className='text-xs text-indigo-500 font-medium ml-1'>Campo carregado de registro existente. Não editável.</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Soberania Única)</label>
                                <input required className="w-full h-16 bg-slate-100 border border-slate-200 rounded-2xl px-6 text-lg font-mono font-black outline-none transition-all cursor-not-allowed" value={formData.cpf_cnpj} readOnly />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nascimento</label>
                                <input type="date" required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG / Documento</label>
                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                // Território
                return (
                    <div className="animate-fade-in space-y-12">
                        <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.4em]">Localização Geográfica (BI Territorial)</h4>
                        </div>

                        {/* Tipo de Unidade e Referência */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Identificação</label>
                                <select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase outline-none focus:border-emerald-500 transition-all" value={formData.unit_type} onChange={e => setFormData({ ...formData, unit_type: e.target.value as any })}>
                                    <option value="CASA">Casa (Número)</option>
                                    <option value="LOTE">Lote (Quadra/Lote)</option>
                                    <option value="CHACARA">Chácara / Sítio</option>
                                    <option value="COMERCIO">Comércio</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência da Unidade (Obrigatório)</label>
                                <div className="relative">
                                    <input required list="units-list" className="w-full h-16 bg-indigo-50 border border-indigo-200 rounded-2xl px-6 text-lg font-black uppercase text-indigo-700 outline-none focus:border-indigo-500 transition-all" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value, complement: e.target.value })} placeholder="EX: LOTE 15, CASA 100, APTO 201" />
                                    {/* Datalist para unidades pre-cadastradas */}
                                    <datalist id="units-list">{availableUnits.map(u => <option key={u.id} value={u.label}>{u.street_name || 'Unidade Cadastrada'}</option>)}</datalist>
                                    <Home className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                                </div>
                            </div>
                        </div>

                        {/* Endereço Atômico (Via CEP) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                                <div className="relative">
                                    <input className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-6 text-lg focus:border-emerald-500 outline-none transition-all" value={formData.cep} onChange={e => setFormData({ ...formData, cep: formatCEP(e.target.value) })} onBlur={handleCEPBlur} maxLength={9} placeholder='00000-000' />
                                    {isSearchingCEP && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" size={20} />}
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rua / Logradouro</label>
                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-base uppercase outline-none" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                <input className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 text-base outline-none focus:border-emerald-500 transition-all" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} placeholder="S/N" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                                <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-base uppercase outline-none" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade / UF</label>
                                <div className="flex gap-2">
                                    <input readOnly className="flex-1 h-16 bg-slate-100 border border-slate-200 rounded-2xl px-6 font-bold uppercase" value={formData.city} />
                                    <input readOnly className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl text-center font-bold" value={formData.state} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                // Segurança e Acesso
                return (
                    <div className="animate-fade-in space-y-12">
                        <div className="flex items-center gap-4 border-l-4 border-slate-900 pl-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.4em]">Segurança & Acesso</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Campo Senha */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha do App {verifiedExistingUser && "(OPCIONAL: Deixe em branco para não alterar)"}</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type={showPass ? "text" : "password"}
                                        required={!verifiedExistingUser} // Requerida só se for novo cadastro
                                        className="w-full h-16 pl-12 bg-white border border-slate-200 rounded-2xl px-6 font-bold outline-none focus:border-indigo-500 transition-all"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            {/* Campo Confirmação de Senha */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        required={!verifiedExistingUser} // Requerida só se for novo cadastro
                                        className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 font-bold outline-none focus:border-indigo-500 transition-all"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {(formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword && (
                                    <p className='text-rose-600 text-[10px] font-bold uppercase flex items-center gap-2 pt-1'><AlertTriangle size={14} /> As senhas não coincidem.</p>
                                )}
                            </div>

                            {/* Contatos */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail (Recuperação)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        type='email'
                                        className="w-full h-16 pl-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        className="w-full h-16 pl-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                        placeholder="(24) 9...."
                                    />
                                </div>
                            </div>

                            {/* Canal Preferencial e Tipo de Residente */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal Preferencial</label>
                                <select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold uppercase outline-none focus:border-indigo-500 transition-all" value={formData.preferred_channel} onChange={e => setFormData({ ...formData, preferred_channel: e.target.value as PreferredChannel })}>
                                    <option value="WHATSAPP">WhatsApp</option>
                                    <option value="EMAIL">E-mail</option>
                                    <option value="APP">App Mobile</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Vínculo</label>
                                <select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold uppercase outline-none focus:border-indigo-500 transition-all" value={formData.resident_type} onChange={e => setFormData({ ...formData, resident_type: e.target.value as ResidentType })}>
                                    <option value="TITULAR">Titular (Proprietário / Morador Principal)</option>
                                    <option value="INQUILINO">Inquilino (Locatário)</option>
                                    <option value="DEPENDENTE">Dependente (Familiar / Outros)</option>
                                </select>
                            </div>

                            {/* LGPD Compliance */}
                            <div className="md:col-span-2 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-inner mt-4">
                                <label className="flex items-start gap-4 cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        checked={formData.lgpd_consent}
                                        onChange={e => setFormData({ ...formData, lgpd_consent: e.target.checked })}
                                        required
                                        className="mt-1 w-5 h-5 md:w-6 md:h-6 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                    />
                                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-relaxed">
                                        Aceito integralmente os Termos de Segurança LGPD e autorizo o processamento de dados para fins exclusivos de governança da associação/condomínio.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Variável que garante que a checagem de CPF é um booleano puro
    const isStepZeroDisabled = currentStep === 0 && !formData.cpf_cnpj;

    // RENDERIZADOR PRINCIPAL (Estrutura do Modal)

    if (successId) return (
        <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center animate-scale-in min-h-[600px] bg-white rounded-[3rem] shadow-2xl">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-8 border-emerald-100">
                <CheckCircle2 size={48} />
            </div>
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{verifiedExistingUser ? "Censo Atualizado" : "Protocolo Ativo"}</h3>
            <p className="text-slate-500 font-medium mt-4 mb-10 text-[11px] uppercase tracking-widest">
                REGISTRO SRE: <span className='text-indigo-600 font-black'>#{successId}</span>
            </p>
            <button onClick={() => onClose ? onClose() : window.location.reload()} className="px-14 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all">Encerrar Sessão</button>
        </div>
    );

    return (
        <div className="sie-modal-container max-w-6xl w-full self-center overflow-hidden flex flex-col h-[90vh] shadow-2xl rounded-[3rem] bg-white">
            {/* Header */}
            <div className="h-24 px-6 md:px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-20 rounded-t-[3rem]">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl border border-white/10" style={{ backgroundColor: primaryColor }}>
                        {currentStep === 0 ? <UserSearch size={28} /> : <Fingerprint size={28} />}
                    </div>
                    <div>
                        <h3 className="font-black text-xl md:text-2xl uppercase leading-none tracking-tight">Censo de Identidade</h3>
                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-[0.3em] opacity-80">Protocolo SRE V260.2 • {verifiedExistingUser ? "Atualização Censo" : "Novo Registro"}</p>
                    </div>
                </div>
                {onClose && <button onClick={onClose} className="p-3 md:p-4 hover:bg-rose-500 rounded-full transition-all border border-white/5"><X size={28} /></button>}
            </div>

            {/* Conteúdo do Stepper */}
            <div className="flex-1 overflow-y-auto p-4 md:p-16 custom-scrollbar bg-[#fcfdfe] relative">
                <div className='max-w-4xl mx-auto'>
                    {renderStepIndicator()}

                    <form onSubmit={(e) => { e.preventDefault(); if (currentStep === 4) handleSubmit(e); else nextStep(); }} className="pb-10">
                        {error && (<div className={`bg-rose-50 text-rose-600 p-6 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-4 mb-8 ${currentStep !== 0 && 'animate-shake'} tracking-widest`}>
                            <AlertTriangle size={20} /> {error}
                        </div>
                        )}

                        {renderContent()}

                        {/* BOTÕES DE NAVEGAÇÃO DO STEPPER */}
                        <div className="mt-12 flex justify-between gap-6 pt-10 border-t border-slate-100 max-w-4xl">
                            {/* Botão Voltar: Só aparece do Step 1 em diante */}
                            {currentStep > 0 ? (
                                <button type="button" onClick={prevStep} className="px-6 md:px-10 py-4 md:py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:text-slate-600 transition-all tracking-widest"><ChevronLeft size={20} /> Voltar</button>
                            ) : (<div />)}

                            {/* Botão Continuar/Finalizar (Renderização Condicional Correta) */}
                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={isCheckingCpf || isStepZeroDisabled}
                                    className={`ml-auto px-6 md:px-10 py-4 md:py-5 ${isCheckingCpf || isStepZeroDisabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600'} text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 transition-all shadow-xl tracking-widest`}
                                >
                                    {isCheckingCpf ? <Loader2 className="animate-spin" size={20} /> : (<>{currentStep === 0 ? 'Verificar Identidade' : 'Continuar'} <ChevronRight size={20} /></>)}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isLoading || ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) || !formData.lgpd_consent}
                                    style={{ backgroundColor: primaryColor }}
                                    className="ml-auto py-5 px-10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <><UserCheck size={24} /> {verifiedExistingUser ? "Atualizar Censo" : "Comitar Novo Registro"}</>}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-8 border-t bg-slate-50 flex flex-col md:flex-row justify-between items-center shrink-0 rounded-b-[3rem]">
                <div className="flex items-center gap-4 mb-2 md:mb-0">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_#10b981]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">S.I.E CORE KERNEL • READY SESSION</span>
                </div>
                <div className="flex gap-4 md:gap-8">
                    <button type="button" onClick={() => window.print()} className="text-[10px] font-black text-slate-400 uppercase hover:text-indigo-600 tracking-widest flex items-center gap-2 transition-colors">
                        <Download size={14} /> Backup PDF
                    </button>
                    <button type="button" onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-600 tracking-widest transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
            {/* O Canvas é mantido oculto, mas essencial para a captura da câmera */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CensusRegister;