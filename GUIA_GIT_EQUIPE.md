# 🚀 Guia de Trabalho em Equipe com Git/GitHub

## 📋 Estrutura das Branches

- **main**: Branch principal (produção)
- **homologacao**: Branch de homologação/testes
- **devC**: Branch do Carlos Dias
- **devFR**: Sua branch de desenvolvimento

---

## 🔄 Fluxo de Trabalho Recomendado

### 1️⃣ **Sincronizar com homologacao (você já fez isso)**

```bash
# Você já fez isso:
git pull origin homologacao
```

### 2️⃣ **Verificar em qual branch você está**

```bash
git branch
# ou
git status
```

### 3️⃣ **Criar/Mudar para sua branch devFR**

```bash
# Se a branch devFR não existe localmente:
git checkout -b devFR

# Se a branch devFR já existe:
git checkout devFR

# Se a branch devFR existe no remoto mas não localmente:
git checkout -b devFR origin/devFR
```

### 4️⃣ **Sincronizar sua branch devFR com homologacao**

```bash
# Garantir que está na sua branch
git checkout devFR

# Buscar todas as atualizações do remoto
git fetch origin

# Mesclar as mudanças da homologacao na sua devFR
git merge origin/homologacao

# OU usar rebase (mantém histórico mais limpo):
git rebase origin/homologacao
```

### 5️⃣ **Adicionar seus commits locais**

```bash
# Ver o que foi modificado
git status

# Adicionar arquivos modificados
git add .

# OU adicionar arquivos específicos:
git add src/app/Context/ProductsContext.tsx
git add src/app/types/responseTypes.ts

# Fazer commit
git commit -m "feat: implementa cache de 30min para produtos"

# Ver histórico de commits
git log --oneline -5
```

### 6️⃣ **Enviar seus commits para devFR no GitHub**

```bash
# Enviar para o remoto (primeira vez)
git push -u origin devFR

# Ou se já foi enviado antes:
git push origin devFR
```

### 7️⃣ **Criar Pull Request (PR) para homologacao**

1. Acesse o GitHub no navegador
2. Vá para o repositório
3. Clique em "Pull requests" → "New pull request"
4. **Base**: selecione `homologacao`
5. **Compare**: selecione `devFR`
6. Preencha título e descrição
7. Clique em "Create pull request"

---

## 🔀 Sincronizar com devC (branch do colega)

### Opção 1: Ver o que tem na devC (sem modificar sua branch)

```bash
# Buscar atualizações
git fetch origin

# Ver commits da devC que não estão na sua devFR
git log devFR..origin/devC --oneline

# Ver diferenças de arquivos
git diff devFR origin/devC
```

### Opção 2: Trazer mudanças da devC para sua devFR

```bash
# Garantir que está na sua branch
git checkout devFR

# Buscar atualizações
git fetch origin

# Mesclar devC na sua devFR
git merge origin/devC

# OU usar rebase:
git rebase origin/devC
```

### Opção 3: Criar branch temporária para testar devC

```bash
# Criar branch baseada na devC
git checkout -b test-devC origin/devC

# Testar/verificar
# ... fazer testes ...

# Voltar para sua branch
git checkout devFR

# Deletar branch temporária
git branch -d test-devC
```

---

## ⚠️ Resolvendo Conflitos

Se houver conflitos ao fazer merge/rebase:

```bash
# 1. Git vai mostrar quais arquivos têm conflito
git status

# 2. Abrir arquivos com conflito e resolver manualmente
# Procure por marcadores:
# <<<<<<< HEAD
# (seu código)
# =======
# (código do outro)
# >>>>>>> origin/devC

# 3. Após resolver, adicionar arquivos:
git add arquivo-resolvido.tsx

# 4. Se estava fazendo merge:
git commit -m "merge: resolve conflitos com devC"

# 5. Se estava fazendo rebase:
git rebase --continue
```

---

## 📝 Comandos Úteis do Dia a Dia

### Ver status atual

```bash
git status
```

### Ver histórico de commits

```bash
git log --oneline --graph --all -10
```

### Ver diferenças entre branches

```bash
# Ver o que tem na devC que não tem na devFR
git diff devFR origin/devC

# Ver o que tem na devFR que não tem na devC
git diff origin/devC devFR
```

### Desfazer mudanças locais (CUIDADO!)

```bash
# Descartar mudanças em arquivo específico
git checkout -- arquivo.tsx

# Descartar todas as mudanças não commitadas
git reset --hard HEAD

# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1
```

### Renomear branch local

```bash
git branch -m devFR novo-nome
```

### Deletar branch local

```bash
git branch -d devFR
```

### Deletar branch remota

```bash
git push origin --delete devFR
```

---

## 🎯 Fluxo Completo Recomendado

### **Início do dia:**

```bash
# 1. Buscar todas atualizações
git fetch origin

# 2. Ir para sua branch
git checkout devFR

# 3. Sincronizar com homologacao
git merge origin/homologacao
# ou
git rebase origin/homologacao
```

### **Durante o trabalho:**

```bash
# Fazer commits frequentes
git add .
git commit -m "feat: descrição da mudança"
```

### **Final do dia / Antes de fazer PR:**

```bash
# 1. Verificar se está tudo commitado
git status

# 2. Sincronizar novamente com homologacao
git merge origin/homologacao

# 3. Resolver conflitos se houver

# 4. Enviar para GitHub
git push origin devFR

# 5. Criar PR no GitHub
```

---

## 🔍 Verificar o que cada branch tem

```bash
# Ver commits únicos da devC
git log origin/homologacao..origin/devC --oneline

# Ver commits únicos da devFR
git log origin/homologacao..devFR --oneline

# Ver commits que estão em ambas (devC e devFR) mas não em homologacao
git log origin/homologacao..origin/devC origin/homologacao..devFR --oneline
```

---

## 💡 Dicas Importantes

1. **Sempre sincronize com homologacao antes de fazer PR**
2. **Faça commits pequenos e frequentes** (mais fácil de resolver conflitos)
3. **Use mensagens de commit descritivas**
4. **Teste localmente antes de fazer push**
5. **Comunique-se com seu colega** sobre mudanças grandes
6. **Use `git fetch` antes de `git merge`** para ter certeza que está atualizado

---

## 🚨 Comandos de Emergência

### Desfazer merge que ainda não foi commitado

```bash
git merge --abort
```

### Desfazer rebase

```bash
git rebase --abort
```

### Voltar para commit anterior (CUIDADO - perde commits!)

```bash
git reset --hard HEAD~1
```

### Forçar push (CUIDADO - só se tiver certeza!)

```bash
git push --force origin devFR
```

---

## 📚 Convenções de Mensagens de Commit

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração de código
style: mudanças de formatação
docs: documentação
test: testes
chore: tarefas de manutenção
```

Exemplos:

- `feat: adiciona cache de 30min para produtos`
- `fix: corrige redirecionamento após finalizar pedido`
- `refactor: remove dependências não usadas do Prisma`
