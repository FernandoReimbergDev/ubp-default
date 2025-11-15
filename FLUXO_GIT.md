# 🔄 Fluxo Visual de Trabalho em Equipe

## 📊 Estrutura das Branches

```
main (produção)
  ↑
homologacao (testes)
  ↑
  ├── devFR (você) ──────┐
  │                      │
  └── devC (colega) ──────┘
```

---

## 🎯 Fluxo de Trabalho Diário

### **Cenário 1: Você quer trabalhar na sua branch**

```
1. git checkout devFR
2. git fetch origin
3. git merge origin/homologacao  (sincronizar)
4. [trabalhar no código]
5. git add .
6. git commit -m "sua mensagem"
7. git push origin devFR
8. [Criar PR no GitHub: devFR → homologacao]
```

---

### **Cenário 2: Você quer ver o que seu colega fez**

```
1. git fetch origin
2. git log devFR..origin/devC --oneline  (ver commits)
3. git diff devFR origin/devC  (ver diferenças)
```

---

### **Cenário 3: Você quer trazer mudanças da devC**

```
1. git checkout devFR
2. git fetch origin
3. git merge origin/devC  (ou git rebase origin/devC)
4. [resolver conflitos se houver]
5. git push origin devFR
```

---

## 🔀 Fluxo de Pull Request

```
devFR ──PR──> homologacao ──PR──> main
devC  ──PR──> homologacao ──PR──> main
```

**Regra de Ouro:**

- ✅ Sempre faça PR da sua branch para `homologacao`
- ✅ Nunca faça PR direto para `main`
- ✅ Sincronize com `homologacao` antes de fazer PR

---

## 📝 Exemplo Prático Completo

### **Início do dia:**

```bash
# 1. Buscar atualizações
git fetch origin

# 2. Ir para sua branch
git checkout devFR

# 3. Sincronizar com homologacao
git merge origin/homologacao
```

### **Durante o trabalho:**

```bash
# Fazer mudanças no código...

# Adicionar mudanças
git add .

# Fazer commit
git commit -m "feat: adiciona cache de produtos"

# Continuar trabalhando...
```

### **Antes de fazer PR:**

```bash
# 1. Sincronizar novamente (pode ter mudanças novas)
git fetch origin
git merge origin/homologacao

# 2. Resolver conflitos se houver
# [editar arquivos com conflito]
git add .
git commit -m "merge: sincroniza com homologacao"

# 3. Enviar para GitHub
git push origin devFR
```

### **Criar PR no GitHub:**

1. Acesse: `https://github.com/[usuario]/[repo]/pulls`
2. Clique em "New pull request"
3. Base: `homologacao`
4. Compare: `devFR`
5. Título: `feat: adiciona cache de produtos`
6. Descrição: Descreva o que foi feito
7. Clique em "Create pull request"

---

## 🔍 Comandos de Diagnóstico

### Ver o estado atual:

```bash
git status                    # Ver o que está modificado
git branch                    # Ver branches locais
git branch -r                 # Ver branches remotas
git log --oneline -5          # Ver últimos 5 commits
```

### Comparar branches:

```bash
# Ver o que tem na devC que não tem na devFR
git log devFR..origin/devC --oneline

# Ver o que tem na devFR que não tem na devC
git log origin/devC..devFR --oneline

# Ver diferenças de arquivos
git diff devFR origin/devC
```

---

## ⚠️ Situações Comuns e Soluções

### **"Já fiz commit mas esqueci de sincronizar com homologacao"**

```bash
# Opção 1: Merge (cria commit de merge)
git fetch origin
git merge origin/homologacao
# Resolver conflitos
git push origin devFR

# Opção 2: Rebase (histórico mais limpo)
git fetch origin
git rebase origin/homologacao
# Resolver conflitos
git push origin devFR
```

### **"Fiz commit errado"**

```bash
# Desfazer último commit (mantém mudanças)
git reset --soft HEAD~1

# Corrigir e fazer commit novamente
git add .
git commit -m "mensagem correta"
```

### **"Preciso ver o que meu colega fez sem modificar minha branch"**

```bash
# Criar branch temporária
git checkout -b test-devC origin/devC

# Ver/testar
# ...

# Voltar para sua branch
git checkout devFR

# Deletar branch temporária
git branch -d test-devC
```

---

## 🎓 Boas Práticas

1. ✅ **Sempre sincronize antes de fazer PR**
2. ✅ **Faça commits pequenos e frequentes**
3. ✅ **Use mensagens de commit descritivas**
4. ✅ **Teste localmente antes de fazer push**
5. ✅ **Comunique-se com o time sobre mudanças grandes**
6. ✅ **Use `git fetch` antes de `git merge`**
7. ✅ **Nunca force push na branch compartilhada**

---

## 🚨 Comandos Perigosos (use com cuidado!)

```bash
# ⚠️ Perde todas as mudanças não commitadas
git reset --hard HEAD

# ⚠️ Força push (pode sobrescrever trabalho de outros)
git push --force origin devFR

# ⚠️ Deleta branch (certifique-se antes!)
git branch -D devFR
```

---

## 📚 Recursos Adicionais

- **GitHub Docs**: https://docs.github.com/pt
- **Git Book**: https://git-scm.com/book
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf
