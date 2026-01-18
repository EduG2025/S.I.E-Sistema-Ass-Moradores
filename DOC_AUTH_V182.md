
# 💎 PROTOCOLO DE AUTH SOBERANA V182.0

O Kernel S.I.E PRO agora utiliza um motor de identificação híbrido que valida membros contra dados reais.

## ⚙️ Funcionamento do Handshake
1.  **Detecção de Padrão**: O frontend identifica se o input é um E-mail (presença de @) ou CPF (sequência numérica >= 11 dígitos).
2.  **Normalização de CPF**: Antes da consulta SQL, qualquer caractere não numérico é removido, garantindo que `000.000.000-00` e `00000000000` sejam tratados como a mesma entidade.
3.  **Consulta SQL Indexada**: O backend realiza buscas específicas por coluna (`email` ou `cpf_cnpj`), evitando full-table scans.
4.  **Verificação de Hash**: Senhas são validadas via `bcrypt`. A Master Key SRE (`Gegerminal180`) permanece ativa para auditoria e recuperação emergencial de clusters bloqueados.

## 🛡️ Segurança
-   O banco de dados agora possui `UNIQUE INDEX` tanto para CPF quanto para E-mail, prevenindo colisões de identidade.
-   Tentativas de login com CPFs inválidos matematicamente são logadas como `DETECTION_INVALID_CPF` para fins de segurança perimetral.

---
**SRE Standardized — Governança Digital de Missão Crítica.**
