# 🎯 Comandos para Executar AGORA

## Situação Atual:

- ✅ Você já fez `git pull origin homologacao`
- ⏳ Você precisa subir seus commits na devFR
- ⏳ Depois fazer PR para homologacao

---

## 📋 Passo a Passo Imediato:

### 1. Verificar em qual branch você está:

```bash
git status
```

### 2. Mudar para sua branch devFR (ou criar se não existir):

```bash
# Se devFR não existe localmente:
git checkout -b devFR

# Se devFR já existe localmente:
git checkout devFR

# Se devFR existe no remoto mas não localmente:
git checkout -b devFR origin/devFR
```

### 3. Sincronizar devFR com homologacao (importante!):

```bash
# Buscar atualizações
git fetch origin

# Mesclar homologacao na sua devFR
git merge origin/homologacao
```

### 4. Ver o que você modificou:

```bash
git status
```

### 5. Adicionar suas mudanças:

```bash
# Adicionar tudo
git add .

# OU adicionar arquivos específicos:
git add src/app/Context/ProductsContext.tsx
git add src/app/types/responseTypes.ts
```

### 6. Fazer commit:

```bash
git commit -m "feat: implementa cache de 30min para produtos"
```

### 7. Enviar para GitHub:

```bash
# Primeira vez (cria a branch no remoto):
git push -u origin devFR

# Ou se já foi enviado antes:
git push origin devFR
```

### 8. Criar Pull Request:

1. Acesse: https://github.com/[seu-usuario]/[seu-repo]/pulls
2. Clique em "New pull request"
3. **Base**: `homologacao`
4. **Compare**: `devFR`
5. Preencha título e descrição
6. Clique em "Create pull request"

---

## 🔀 Para Sincronizar com devC (depois):

### Ver o que tem na devC:

```bash
git fetch origin
git log devFR..origin/devC --oneline
```

### Trazer mudanças da devC para sua devFR:

```bash
git checkout devFR
git merge origin/devC
# Resolver conflitos se houver
git push origin devFR
```

---

## ⚠️ Se tiver conflitos:

```bash
# 1. Git vai mostrar os arquivos com conflito
git status

# 2. Abra os arquivos e resolva os conflitos manualmente
# Procure por: <<<<<<< ======= >>>>>>>

# 3. Após resolver:
git add arquivo-resolvido.tsx
git commit -m "merge: resolve conflitos com homologacao"
git push origin devFR
```
