
# 💎 S.I.E PRO — PROTOCOLO DE DESIGN VISUAL (V120.0)

Este documento define o padrão de "Container Flutuante" (Floating Workspace) para formulários e editores imersivos, garantindo que o usuário nunca perca o contexto da barra lateral (Sidebar) e que o formulário sobreponha elegantemente o conteúdo do módulo.

---

## 🏗️ 1. Arquitetura do Container (CSS)

O padrão baseia-se em duas classes principais no `index.css`:

### A. O Overlay (`.sie-editor-overlay`)
Deve ser **absoluto** para respeitar o container pai (geralmente a tag `<main>` no `App.tsx`).
- **Posicionamento**: `absolute inset-0`
- **Fundo**: `rgba(2, 6, 23, 0.4)` (Slate 950 com 40% opacidade)
- **Efeito**: `backdrop-filter: blur(12px)`
- **Z-Index**: `50` (Sobrepõe o header do módulo, mas fica abaixo da Sidebar se ela for fixa).

### B. O Container (`.sie-modal-container`)
- **Largura**: `96%` (Máximo `1300px`)
- **Altura**: `92vh`
- **Bordas**: `rounded-[3rem]` (Fundamental para a estética moderna do S.I.E)
- **Sombra**: `shadow-2xl` com dispersão profunda.
- **Animação**: `modalSlideUp` (Entrada suave de baixo para cima com escala).

---

## 🧩 2. Estrutura Interna (Skeleton)

Todo formulário novo deve seguir esta hierarquia de tags:

```tsx
<div className="sie-editor-overlay">
    <div className="sie-modal-container">
        
        {/* 1. HEADER (Slate 900) */}
        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
            <div className="flex items-center gap-5">
                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Icon size={22}/></div>
                <div>
                    <h3 className="font-black text-xl uppercase tracking-tighter">Título do Módulo</h3>
                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest">SUBTÍTULO DO PROTOCOLO</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {/* Ações Primárias */}
                <button onClick={handleSave} className="...">Commitar Registro</button>
                <button onClick={close} className="p-3.5 hover:bg-rose-500 text-slate-400 rounded-xl transition-all"><X size={24}/></button>
            </div>
        </div>

        {/* 2. NAVEGAÇÃO / TABS (Slate 50) */}
        <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2">
            <button className="bg-white text-indigo-600 shadow-sm ...">Tab Ativa</button>
            <button className="text-slate-400 ...">Tab Inativa</button>
        </div>

        {/* 3. ÁREA DE CONTEÚDO (Fundo FDFDFE) */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative bg-[#fdfdfe]">
            {/* Grid de Inputs aqui */}
        </div>

        {/* 4. FOOTER (Opcional - Slate 50) */}
        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-black">Status SRE OK</span>
            <div className="flex gap-4">
                <button className="...">Fechar</button>
                <button className="...">Salvar</button>
            </div>
        </div>

    </div>
</div>
```

---

## 🎨 3. Paleta e Estilização de Inputs

- **Inputs**: Devem ter `bg-slate-50`, `border-slate-200` e `rounded-2xl`.
- **Foco**: `focus:bg-white` e `focus:border-indigo-500`.
- **Labels**: Sempre minúsculos, `text-[10px]`, `font-black`, `uppercase`, `tracking-widest`.
- **Botão Primário**: Indigo 600, texto branco, `tracking-[0.2em]`.

---

## 🚀 4. Check-list para Novos Módulos

Ao criar um novo formulário (Financeiro, Obras, etc), verifique:
1. [ ] O container pai no `App.tsx` possui `relative`? (Obrigatório para o modal absoluto).
2. [ ] O arredondamento é exatamente `3rem` (48px)?
3. [ ] O cabeçalho é `slate-900` (Quase preto)?
4. [ ] O scrollbar está customizado como `custom-scrollbar`?
5. [ ] O backdrop blur está configurado para `12px`?

---
**Status da Diretriz:** 🟢 HOMOLOGADA
**Versão:** 120.0
