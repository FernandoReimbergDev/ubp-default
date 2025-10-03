# Middleware Limpo - UBP Skin

Este é um middleware simples e limpo para uma aplicação web Next.js.

## 🚀 Funcionalidades

### **Autenticação**

- Verifica token JWT em cookies
- Log do nome do usuário autenticado
- Redirecionamento baseado em autenticação

### **Rotas Públicas**

- `/sign-in` - Página de login
- `/sign-out` - Logout
- `/politica-de-cookies` - Política de cookies
- `/politica-de-privacidade` - Política de privacidade
- `/termos-de-uso` - Termos de uso
- `/fale-conosco` - Fale conosco

### **Redirecionamentos**

- `/` → `/produto` (se autenticado) ou `/sign-in`
- Usuários autenticados em `/sign-in` → `/produto`
- Usuários não autenticados → `/sign-in`

## 📝 Logs

O middleware registra:

```
[Middleware Log] GET - / - Origin: http://localhost:3000
[Middleware] Usuário autenticado: Nome do Usuário
```

## 🔧 Configuração

### **Variáveis de Ambiente**

```env
JWT_SECRET=sua_chave_secreta_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_aqui
```

### **Headers de Segurança**

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### **CORS**

- Configurado para APIs
- Suporte a múltiplas origens em desenvolvimento
- Headers de segurança para APIs

## 🏃‍♂️ Como Usar

### **Desenvolvimento**

```bash
npm run dev
```

### **Produção**

```bash
npm run build
npm start
```

## 📁 Estrutura

```
src/
├── middleware.ts          # Middleware principal
├── app/
│   ├── (private)/        # Rotas protegidas
│   ├── (public)/         # Rotas públicas
│   └── api/              # APIs
└── utils/
    └── env.ts            # Variáveis de ambiente
```

## 🎯 Comportamento

1. **Usuário não autenticado** → Redirecionado para `/sign-in`
2. **Usuário autenticado** → Acesso às rotas protegidas
3. **Rota raiz "/"** → Redirecionado para `/produto` ou `/sign-in`
4. **Rotas públicas** → Acesso livre
5. **APIs** → Não afetadas pelo middleware

## 🔒 Segurança

- Verificação de JWT em cookies
- Headers de segurança configurados
- Redirecionamento seguro
- Logs para auditoria
